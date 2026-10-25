"use server";

import { prisma } from "@/lib/prisma";
import {
  calcularDatasVencimento,
  determinarStatusContribuicao,
  FrequenciaTipo,
  calcularValorCiclo,
  calcularTotalArrecadacaoConsorcio,
  ModeloContribuicao,
  validarMinimoParticipantes,
  formatarTelefone,
  TipoChavePix,
  analisarCicloConsorcio,
  gerarMensagemFollowupConsorcio,
  gerarLinkWhatsApp,
} from "@/lib/finance";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sanitizarParaCliente } from "@/lib/sanitize";
import {
  getVigenciaPlano,
  calcularNovaDataExpiracao,
  PLANOS_INFO,
} from "@/lib/plans";

export async function getConsorcioData(usuarioId?: string, consorcioId?: string) {
  // Verifica se há sessão ativa via cookie ou id fornecido
  const sessionCookie = cookies().get("clube_cota_session");
  const effectiveUserId = usuarioId || sessionCookie?.value;

  const todosUsuarios = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      telefone: true,
      role: true,
      preferredTheme: true,
      isActivated: true,
      receberPixDireto: true,
      tipoChavePix: true,
      chavePix: true,
      planoExpiraEm: true,
    },
  });

  const user = effectiveUserId
    ? await prisma.user.findUnique({ where: { id: effectiveUserId } })
    : null;

  if (!user) {
    return {
      currentUser: null,
      todosUsuarios,
      consorcio: null,
      todosConsorcios: [],
    };
  }

  const isAdminGeral = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";

  // Busca todos os consórcios acessíveis para este usuário (como criador ou participante)
  const todosConsorciosRaw = await prisma.consorcio.findMany({
    where: isAdminGeral
      ? {}
      : {
          OR: [
            { criadorId: user.id },
            {
              cotas: {
                some: {
                  participantes: {
                    some: { usuarioId: user.id },
                  },
                },
              },
            },
          ],
        },
    include: {
      criador: {
        select: { id: true, name: true, email: true },
      },
      cotas: {
        include: {
          participantes: true,
        },
      },
      contribuicoes: {
        select: {
          id: true,
          status: true,
          valorPrevisto: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const todosConsorcios = todosConsorciosRaw.map((c) => {
    const isCriador = c.criadorId === user.id;
    const totalArrecadado = c.contribuicoes
      .filter((cb) => cb.status === "PAGO")
      .reduce((acc, cb) => acc + cb.valorPrevisto, 0);

    const participantesIds = new Set<string>();
    c.cotas.forEach((cot) => {
      cot.participantes.forEach((p) => participantesIds.add(p.usuarioId));
    });

    return {
      id: c.id,
      nome: c.nome,
      finalidade: c.finalidade,
      status: c.status,
      frequencia: c.frequencia,
      modeloContribuicao: c.modeloContribuicao,
      valorCota: c.valorCota,
      valorAcrescimo: c.valorAcrescimo,
      valorTotalBolada: c.valorTotalBolada,
      totalCotas: c.totalCotas,
      dataInicio: c.dataInicio,
      dataPrimeiroVencimento: c.dataPrimeiroVencimento,
      criadorId: c.criadorId,
      criadorNome: c.criador.name,
      isCriador,
      papel: isCriador ? "Administrador" : "Participante",
      totalParticipantes: participantesIds.size,
      totalArrecadado,
      percentualArrecadado:
        c.valorTotalBolada > 0 ? Math.round((totalArrecadado / c.valorTotalBolada) * 100) : 0,
      createdAt: c.createdAt,
    };
  });

  // Determina qual consórcio carregar detalhadamente
  let consorcioIdAlvo = consorcioId;

  // Se nenhum id foi pedido ou o id não existe na lista, busca o mais adequado
  if (!consorcioIdAlvo || !todosConsorcios.some((c) => c.id === consorcioIdAlvo)) {
    const primeiroCriadoAtivo = todosConsorcios.find((c) => c.isCriador && c.status === "ATIVO");
    const primeiroAtivo = todosConsorcios.find((c) => c.status === "ATIVO");
    consorcioIdAlvo = primeiroCriadoAtivo?.id || primeiroAtivo?.id || todosConsorcios[0]?.id;
  }

  const consorcio = consorcioIdAlvo
    ? await prisma.consorcio.findUnique({
        where: { id: consorcioIdAlvo },
        include: {
          criador: true,
          cotas: {
            include: {
              participantes: {
                include: { usuario: true },
              },
            },
            orderBy: { ordemSorteio: "asc" },
          },
          contribuicoes: {
            include: {
              usuario: true,
              cota: true,
              comprovante: true,
            },
            orderBy: { dataVencimento: "asc" },
          },
          auditorias: {
            include: { usuarioResponsavel: true },
            orderBy: { createdAt: "desc" },
            take: 20,
          },
        },
      })
    : null;

  // Atualiza em tempo real status de vencidas para EM_ATRASO se já venceu e ainda está pendente
  if (consorcio) {
    const hoje = new Date();
    for (const c of consorcio.contribuicoes) {
      if (c.status === "PENDENTE" && hoje > new Date(c.dataVencimento)) {
        await prisma.contribuicao.update({
          where: { id: c.id },
          data: { status: "EM_ATRASO" },
        });
        c.status = "EM_ATRASO";
      }
    }

    const lidasAteCookie = cookies().get(`clube_cota_lidas_${consorcio.id}`) || cookies().get(`clube_cota_lidas_global`);
    const dispensadasCookie = cookies().get(`clube_cota_dispensadas_${consorcio.id}`) || cookies().get(`clube_cota_dispensadas_global`);
    let dispensadasIds: string[] = [];
    if (dispensadasCookie?.value) {
      try {
        dispensadasIds = JSON.parse(decodeURIComponent(dispensadasCookie.value));
      } catch {
        try {
          dispensadasIds = JSON.parse(dispensadasCookie.value);
        } catch {}
      }
    }

    (consorcio as any).notificacoesLidasAte = lidasAteCookie?.value || null;
    (consorcio as any).notificacoesDispensadasIds = dispensadasIds;
  }

  // Notificações pessoais do usuário autenticado (Regra: auditoria de perfil exclusiva do usuário)
  if (user && consorcio) {
    const notificacoesPessoaisUsuario = await prisma.auditoriaLog.findMany({
      where: {
        usuarioAfetadoId: user.id,
        tipoAcao: { in: ["EDICAO_PERFIL_USUARIO", "ATIVACAO_CONTA_PARTICIPANTE"] },
      },
      include: { usuarioResponsavel: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const mapa = new Map();
    for (const a of [...(consorcio.auditorias || []), ...notificacoesPessoaisUsuario]) {
      if (!mapa.has(a.id)) mapa.set(a.id, a);
    }
    consorcio.auditorias = Array.from(mapa.values()).sort(
      (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  // Remove hashes de senha e tokens antes de enviar ao navegador.
  // Links de acesso (tokenAcesso) só seguem para o criador do consórcio e para admins.
  const podeVerTokensAcesso = isAdminGeral || consorcio?.criadorId === user.id;

  return {
    currentUser: sanitizarParaCliente(user, false),
    todosUsuarios,
    consorcio: sanitizarParaCliente(consorcio, podeVerTokensAcesso),
    todosConsorcios,
  };
}

export async function marcarNotificacoesLidasAction(consorcioId: string) {
  const agora = new Date().toISOString();
  cookies().set(`clube_cota_lidas_${consorcioId}`, agora, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  cookies().set(`clube_cota_lidas_global`, agora, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return { success: true, lidasAte: agora };
}

export async function dispensarNotificacaoAction(consorcioId: string, notificacaoId: string) {
  const cookieName = `clube_cota_dispensadas_${consorcioId}`;
  const existing = cookies().get(cookieName)?.value;
  let ids: string[] = [];
  if (existing) {
    try {
      ids = JSON.parse(decodeURIComponent(existing));
    } catch {
      try {
        ids = JSON.parse(existing);
      } catch {}
    }
  }
  if (!ids.includes(notificacaoId)) {
    ids.push(notificacaoId);
  }
  const payload = JSON.stringify(ids);
  cookies().set(cookieName, payload, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  cookies().set("clube_cota_dispensadas_global", payload, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });
  return { success: true };
}

export interface ParticipanteAgendaItem {
  id: string; // usuarioId no banco
  name: string;
  email?: string;
  telefone?: string;
  tipoChavePix?: string;
  chavePix?: string;
  totalParticipacoes: number;
  origem: "REDE_CRIADOR" | "SISTEMA";
}

/**
 * Obtém a agenda de participantes do criador (Opção 1):
 * Prioriza membros que já participaram de consórcios com o criador,
 * e inclui outros usuários cadastrados na plataforma para busca rápida.
 */
export async function getAgendaParticipantesAction(
  criadorId: string
): Promise<ParticipanteAgendaItem[]> {
  try {
    if (!criadorId) return [];

    // 1. Busca todos os consórcios onde o criador é administrador ou participante
    const consorcios = await prisma.consorcio.findMany({
      where: {
        OR: [
          { criadorId },
          {
            cotas: {
              some: {
                participantes: {
                  some: { usuarioId: criadorId },
                },
              },
            },
          },
        ],
      },
      include: {
        cotas: {
          include: {
            participantes: {
              include: {
                usuario: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    telefone: true,
                    tipoChavePix: true,
                    chavePix: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const mapaParticipantes = new Map<string, ParticipanteAgendaItem>();

    for (const c of consorcios) {
      for (const cota of c.cotas) {
        for (const p of cota.participantes) {
          if (!p.usuario || p.usuario.id === criadorId) continue;

          const isDummyEmail = p.usuario.email.endsWith("@clubedacota.local");
          const emailLimpo = isDummyEmail ? undefined : p.usuario.email;
          const existing = mapaParticipantes.get(p.usuario.id);

          if (existing) {
            existing.totalParticipacoes += 1;
            if (!existing.email && emailLimpo) existing.email = emailLimpo;
            if (!existing.telefone && p.usuario.telefone) existing.telefone = p.usuario.telefone;
            if (!existing.chavePix && p.usuario.chavePix) {
              existing.chavePix = p.usuario.chavePix;
              existing.tipoChavePix = p.usuario.tipoChavePix || undefined;
            }
          } else {
            mapaParticipantes.set(p.usuario.id, {
              id: p.usuario.id,
              name: p.usuario.name,
              email: emailLimpo,
              telefone: p.usuario.telefone || undefined,
              tipoChavePix: p.usuario.tipoChavePix || undefined,
              chavePix: p.usuario.chavePix || undefined,
              totalParticipacoes: 1,
              origem: "REDE_CRIADOR",
            });
          }
        }
      }
    }

    // 2. Inclui outros usuários reais cadastrados no sistema (com totalParticipacoes = 0)
    const outrosUsuarios = await prisma.user.findMany({
      where: {
        id: { not: criadorId },
        NOT: {
          email: { endsWith: "@clubedacota.local" },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        telefone: true,
        tipoChavePix: true,
        chavePix: true,
      },
    });

    for (const u of outrosUsuarios) {
      if (!mapaParticipantes.has(u.id)) {
        mapaParticipantes.set(u.id, {
          id: u.id,
          name: u.name,
          email: u.email,
          telefone: u.telefone || undefined,
          tipoChavePix: u.tipoChavePix || undefined,
          chavePix: u.chavePix || undefined,
          totalParticipacoes: 0,
          origem: "SISTEMA",
        });
      }
    }

    // 3. Ordena: quem já participou de mais consórcios do criador aparece primeiro
    return Array.from(mapaParticipantes.values()).sort((a, b) => {
      if (b.totalParticipacoes !== a.totalParticipacoes) {
        return b.totalParticipacoes - a.totalParticipacoes;
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
  } catch (error) {
    console.error("Erro ao carregar agenda de participantes:", error);
    return [];
  }
}

export interface CreateConsorcioInput {
  criadorId: string;
  nome: string;
  finalidade?: string;
  regras?: string;
  tipoChavePix?: string;
  chavePix?: string;
  dadosBancarios?: string;
  dataInicio: string;
  dataPrimeiroVencimento: string;
  frequencia: FrequenciaTipo;
  modeloContribuicao?: ModeloContribuicao;
  valorCota: number;
  valorAcrescimo?: number;
  participantes: {
    usuarioId?: string;
    nome: string;
    email?: string;
    telefone?: string;
    cotasCount: number;
    isCompartilhada?: boolean;
    fraçãoUsuarioId?: string;
    fraçãoNome?: string;
    fraçãoEmail?: string;
    fraçãoTelefone?: string;
    valorFração1?: number;
    valorFração2?: number;
    ordensSorteio?: number[];
  }[];
}

export async function createConsorcioAction(input: CreateConsorcioInput) {
  try {
    const criador = await prisma.user.findUnique({ where: { id: input.criadorId } });
    if (!criador) throw new Error("Criador não encontrado.");

    // Verifica se a assinatura do plano PRO ou PRO_MASTER está expirada
    const vigencia = getVigenciaPlano(criador);
    if (!vigencia.isAtivo && (criador.role === "PRO" || criador.role === "PRO_MASTER")) {
      return {
        success: false,
        error: `Sua assinatura do ${PLANOS_INFO[criador.role as "PRO" | "PRO_MASTER"].nome} expirou em ${vigencia.dataExpiracaoFormatada}. Para gerenciar novos grupos, realize a renovação via Pix para Marcos Batista (markos.system@gmail.com).`,
      };
    }

    // Validação de limites por nível de acesso (Modelo A: Comum possui até 1 consórcio ativo simultâneo)
    const consorciosAtivos = await prisma.consorcio.count({
      where: { criadorId: criador.id, status: "ATIVO" },
    });

    if (criador.role === "COMUM" && consorciosAtivos >= 1) {
      return {
        success: false,
        error:
          "Você atingiu o limite de 1 consórcio ativo do Plano Comum. Para gerenciar novos grupos simultaneamente, realize a migração de plano via Pix para Marcos Batista (markos.system@gmail.com): Plano Pro (R$ 19,90/mês para até 3 consórcios) ou Pro Master (R$ 29,90/mês para consórcios ilimitados).",
      };
    }
    if (criador.role === "PRO" && consorciosAtivos >= 3) {
      return {
        success: false,
        error:
          "Você atingiu o limite de 3 consórcios ativos do Plano Pro. Para criar grupos ilimitados, realize a migração para o Plano Pro Master (R$ 29,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
      };
    }

    const totalParticipantes = input.participantes.length;
    if (criador.role === "COMUM" && totalParticipantes > 10) {
      return {
        success: false,
        error:
          "O Plano Comum permite no máximo 10 participantes por consórcio. Para grupos de até 20 participantes, realize a migração para o Plano Pro (R$ 19,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
      };
    }
    if (criador.role === "PRO" && totalParticipantes > 20) {
      return {
        success: false,
        error:
          "O Plano Pro permite no máximo 20 participantes por consórcio. Para participantes ilimitados, realize a migração para o Plano Pro Master (R$ 29,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
      };
    }

    // Valida que o consórcio possui no mínimo 2 participantes
    const validacaoParticipantes = validarMinimoParticipantes(input.participantes);
    if (!validacaoParticipantes.valido) {
      return { success: false, error: validacaoParticipantes.mensagem || "Um consórcio deve ter obrigatoriamente no mínimo 2 participantes." };
    }

    if (!input.chavePix || !input.chavePix.trim()) {
      return { success: false, error: "A chave Pix do consórcio é obrigatória." };
    }

    // Calcula quantidade total de cotas
    let totalCotas = 0;
    input.participantes.forEach((p) => {
      totalCotas += p.cotasCount || 1;
    });

    const modelo = input.modeloContribuicao || "FIXO";
    const acrescimo = input.valorAcrescimo || 0;
    const valorTotalBolada = calcularTotalArrecadacaoConsorcio({
      valorCotaBase: input.valorCota,
      valorAcrescimo: acrescimo,
      modeloContribuicao: modelo,
      totalCotas,
    });

    // Cria o consórcio
    const chavePixLimpa = input.chavePix.trim();
    const novoConsorcio = await prisma.consorcio.create({
      data: {
        nome: input.nome,
        finalidade: input.finalidade || null,
        regras: input.regras || null,
        tipoChavePix: input.tipoChavePix || "CHAVE_ALEATORIA",
        chavePix: chavePixLimpa,
        dadosBancarios: input.dadosBancarios || chavePixLimpa,
        dataInicio: new Date(input.dataInicio.includes("T") ? input.dataInicio : `${input.dataInicio}T12:00:00`),
        dataPrimeiroVencimento: new Date(input.dataPrimeiroVencimento.includes("T") ? input.dataPrimeiroVencimento : `${input.dataPrimeiroVencimento}T12:00:00`),
        frequencia: input.frequencia,
        modeloContribuicao: modelo,
        valorCota: input.valorCota,
        valorAcrescimo: acrescimo,
        valorTotalBolada,
        totalCotas,
        criadorId: criador.id,
      },
    });

    // Gera as datas de vencimento previstas para os ciclos
    const datasVencimento = calcularDatasVencimento({
      dataPrimeiroVencimento: new Date(input.dataPrimeiroVencimento.includes("T") ? input.dataPrimeiroVencimento : `${input.dataPrimeiroVencimento}T12:00:00`),
      frequencia: input.frequencia,
      quantidadeCiclos: totalCotas, // 1 ciclo por cota no modelo padrão
    });

    let numeroCotaGlobal = 1;

    for (const part of input.participantes) {
      // 1. Busca ou vincula o usuário participante:
      // Prioridade 1: usuarioId selecionado explicitamente via Autocomplete / Agenda
      let usuario: any = null;
      if (part.usuarioId) {
        usuario = await prisma.user.findUnique({ where: { id: part.usuarioId } });
      }

      // Prioridade 2: E-mail real informado (não fictício)
      const hasRealEmail = Boolean(
        part.email &&
        part.email.trim().length > 0 &&
        !part.email.endsWith("@clubedacota.local")
      );
      const emailFinal = hasRealEmail ? part.email!.trim().toLowerCase() : null;

      if (!usuario && emailFinal) {
        usuario = await prisma.user.findUnique({ where: { email: emailFinal } });
      }

      // Prioridade 3: Telefone/WhatsApp (se válido e único)
      if (!usuario && part.telefone && part.telefone.trim().length >= 10) {
        const telFormatado = formatarTelefone(part.telefone);
        usuario = await prisma.user.findFirst({ where: { telefone: telFormatado } });
      }

      // Se não encontrou usuário existente, cria uma nova conta
      if (!usuario) {
        const dummyEmail = `participante_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`;
        usuario = await prisma.user.create({
          data: {
            name: part.nome,
            email: emailFinal || dummyEmail,
            telefone: part.telefone ? formatarTelefone(part.telefone) : null,
            role: "COMUM",
            isActivated: false,
            inviteToken: hasRealEmail
              ? `convite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
              : null,
            inviteExpiresAt: hasRealEmail
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 dias conforme PDF
              : null,
          },
        });
      } else if (part.telefone && !usuario.telefone) {
        // Se usuário existente não tinha telefone, atualiza
        await prisma.user.update({
          where: { id: usuario.id },
          data: { telefone: formatarTelefone(part.telefone) },
        });
      }

      // Se for cota compartilhada
      if (part.isCompartilhada && part.fraçãoNome) {
        let usuario2: any = null;
        if (part.fraçãoUsuarioId) {
          usuario2 = await prisma.user.findUnique({ where: { id: part.fraçãoUsuarioId } });
        }

        const hasRealEmail2 = Boolean(
          part.fraçãoEmail &&
          part.fraçãoEmail.trim().length > 0 &&
          !part.fraçãoEmail.endsWith("@clubedacota.local")
        );
        const emailFinal2 = hasRealEmail2 ? part.fraçãoEmail!.trim().toLowerCase() : null;

        if (!usuario2 && emailFinal2) {
          usuario2 = await prisma.user.findUnique({ where: { email: emailFinal2 } });
        }

        if (!usuario2 && part.fraçãoTelefone && part.fraçãoTelefone.trim().length >= 10) {
          const telFormatado2 = formatarTelefone(part.fraçãoTelefone);
          usuario2 = await prisma.user.findFirst({ where: { telefone: telFormatado2 } });
        }

        if (!usuario2) {
          const dummyEmail2 = `participante_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`;
          usuario2 = await prisma.user.create({
            data: {
              name: part.fraçãoNome,
              email: emailFinal2 || dummyEmail2,
              telefone: part.fraçãoTelefone ? formatarTelefone(part.fraçãoTelefone) : null,
              role: "COMUM",
              isActivated: false,
              inviteToken: hasRealEmail2
                ? `convite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
                : null,
              inviteExpiresAt: hasRealEmail2
                ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                : null,
            },
          });
        } else if (part.fraçãoTelefone && !usuario2.telefone) {
          await prisma.user.update({
            where: { id: usuario2.id },
            data: { telefone: formatarTelefone(part.fraçãoTelefone) },
          });
        }

        const qtdCotasCompartilhadas = part.cotasCount || 1;
        for (let c = 0; c < qtdCotasCompartilhadas; c++) {
          const numCota = numeroCotaGlobal++;
          const cotaOrdem = part.ordensSorteio?.[c] ?? numCota;
          const cota = await prisma.cota.create({
            data: {
              consorcioId: novoConsorcio.id,
              numero: numCota,
              ordemSorteio: cotaOrdem,
              isCompartilhada: true,
              tokenAcesso: "cota_" + crypto.randomBytes(6).toString("hex"),
            },
          });

          const val1 = part.valorFração1 ?? input.valorCota / 2;
          const val2 = part.valorFração2 ?? input.valorCota / 2;

          await prisma.cotaParticipante.create({
            data: {
              cotaId: cota.id,
              usuarioId: usuario.id,
              percentual: (val1 / input.valorCota) * 100,
              valorParcela: val1,
              tokenAcesso: "cp_" + crypto.randomBytes(6).toString("hex"),
            },
          });

          await prisma.cotaParticipante.create({
            data: {
              cotaId: cota.id,
              usuarioId: usuario2.id,
              percentual: (val2 / input.valorCota) * 100,
              valorParcela: val2,
              tokenAcesso: "cp_" + crypto.randomBytes(6).toString("hex"),
            },
          });

          // Gera parcelas para ambos os participantes da cota
          for (let i = 0; i < datasVencimento.length; i++) {
            const valorCotaCiclo = calcularValorCiclo(i + 1, input.valorCota, modelo, acrescimo);
            const perc1 = val1 / input.valorCota;
            const perc2 = val2 / input.valorCota;

            await prisma.contribuicao.create({
              data: {
                consorcioId: novoConsorcio.id,
                cotaId: cota.id,
                usuarioId: usuario.id,
                numeroCiclo: i + 1,
                valorPrevisto: valorCotaCiclo * perc1,
                dataVencimento: datasVencimento[i],
                status: "PENDENTE",
              },
            });

            await prisma.contribuicao.create({
              data: {
                consorcioId: novoConsorcio.id,
                cotaId: cota.id,
                usuarioId: usuario2.id,
                numeroCiclo: i + 1,
                valorPrevisto: valorCotaCiclo * perc2,
                dataVencimento: datasVencimento[i],
                status: "PENDENTE",
              },
            });
          }
        }
      } else {
        // Cota(s) individuais
        for (let c = 0; c < (part.cotasCount || 1); c++) {
          const numCota = numeroCotaGlobal++;
          const cotaOrdem = part.ordensSorteio?.[c] ?? numCota;
          const cota = await prisma.cota.create({
            data: {
              consorcioId: novoConsorcio.id,
              numero: numCota,
              ordemSorteio: cotaOrdem,
              isCompartilhada: false,
              tokenAcesso: "cota_" + crypto.randomBytes(6).toString("hex"),
            },
          });

          await prisma.cotaParticipante.create({
            data: {
              cotaId: cota.id,
              usuarioId: usuario.id,
              percentual: 100.0,
              valorParcela: input.valorCota,
              tokenAcesso: "cp_" + crypto.randomBytes(6).toString("hex"),
            },
          });

          for (let i = 0; i < datasVencimento.length; i++) {
            const valorCotaCiclo = calcularValorCiclo(i + 1, input.valorCota, modelo, acrescimo);
            await prisma.contribuicao.create({
              data: {
                consorcioId: novoConsorcio.id,
                cotaId: cota.id,
                usuarioId: usuario.id,
                numeroCiclo: i + 1,
                valorPrevisto: valorCotaCiclo,
                dataVencimento: datasVencimento[i],
                status: "PENDENTE",
              },
            });
          }
        }
      }
    }

    // Registra auditoria
    await prisma.auditoriaLog.create({
      data: {
        consorcioId: novoConsorcio.id,
        usuarioResponsavelId: criador.id,
        tipoAcao: "CRIACAO_CONSORCIO",
        detalhes: `Consórcio "${novoConsorcio.nome}" criado com ${totalCotas} cotas.`,
        justificativa: "Criação de novo grupo pelo assistente.",
      },
    });

    revalidatePath("/");
    return { success: true, consorcioId: novoConsorcio.id, nome: novoConsorcio.nome };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function confirmPaymentAction(
  contribuicaoId: string,
  criadorId: string,
  justificativa?: string
) {
  const contribuicao = await prisma.contribuicao.findUnique({
    where: { id: contribuicaoId },
    include: { comprovante: true, usuario: true, consorcio: true },
  });

  if (!contribuicao) return { success: false, error: "Contribuição não encontrada." };

  if (contribuicao.consorcio.status === "ENCERRADO") {
    return { success: false, error: "Este consórcio está encerrado (somente leitura) e não permite novas confirmações de pagamento." };
  }

  await prisma.contribuicao.update({
    where: { id: contribuicaoId },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
      responsavelAlteracaoId: criadorId,
      motivoAlteracao: justificativa || "Pagamento confirmado pelo criador.",
    },
  });

  if (contribuicao.comprovante) {
    await prisma.comprovante.update({
      where: { id: contribuicao.comprovante.id },
      data: {
        status: "CONFIRMADO",
        analisadoPorId: criadorId,
        analisadoEm: new Date(),
      },
    });
  }

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: contribuicao.consorcioId,
      usuarioResponsavelId: criadorId,
      usuarioAfetadoId: contribuicao.usuarioId,
      tipoAcao: "CONFIRMACAO_PAGAMENTO",
      detalhes: `Contribuição de R$ ${contribuicao.valorPrevisto.toFixed(2)} do participante ${contribuicao.usuario.name} marcada como PAGO.`,
      justificativa: justificativa || "Confirmação manual de recebimento",
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function revertPaymentAction(
  contribuicaoId: string,
  criadorId: string,
  motivo: string
) {
  if (!motivo || motivo.trim().length === 0) {
    return { success: false, error: "A justificativa para estorno é obrigatória." };
  }

  const contribuicao = await prisma.contribuicao.findUnique({
    where: { id: contribuicaoId },
    include: { usuario: true },
  });

  if (!contribuicao) return { success: false, error: "Contribuição não encontrada." };

  const statusRetorno = new Date() > new Date(contribuicao.dataVencimento) ? "EM_ATRASO" : "PENDENTE";

  await prisma.contribuicao.update({
    where: { id: contribuicaoId },
    data: {
      status: statusRetorno,
      dataPagamento: null,
      responsavelAlteracaoId: criadorId,
      motivoAlteracao: motivo,
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: contribuicao.consorcioId,
      usuarioResponsavelId: criadorId,
      usuarioAfetadoId: contribuicao.usuarioId,
      tipoAcao: "ESTORNO_PAGAMENTO",
      detalhes: `Pagamento de R$ ${contribuicao.valorPrevisto.toFixed(2)} revertido para ${statusRetorno}.`,
      justificativa: motivo,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function rejectReceiptAction(
  comprovanteId: string,
  criadorId: string,
  motivoRecusa: string
) {
  if (!motivoRecusa || motivoRecusa.trim().length === 0) {
    return { success: false, error: "O motivo da recusa é obrigatório." };
  }

  const comp = await prisma.comprovante.findUnique({
    where: { id: comprovanteId },
    include: { contribuicao: true },
  });

  if (!comp) return { success: false, error: "Comprovante não encontrado." };

  await prisma.comprovante.update({
    where: { id: comprovanteId },
    data: {
      status: "RECUSADO",
      motivoRecusa,
      analisadoPorId: criadorId,
      analisadoEm: new Date(),
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: comp.contribuicao.consorcioId,
      usuarioResponsavelId: criadorId,
      usuarioAfetadoId: comp.usuarioId,
      tipoAcao: "RECUSA_COMPROVANTE",
      detalhes: `Comprovante "${comp.arquivoNome}" recusado.`,
      justificativa: motivoRecusa,
    },
  });

  revalidatePath("/");
  return { success: true };
}

export async function submitReceiptAction(
  contribuicaoId: string,
  usuarioId: string,
  nomeArquivo: string
) {
  // Verifica se já existe comprovante ativo (se existir, substitui conforme requisito)
  const compExistente = await prisma.comprovante.findUnique({
    where: { contribuicaoId },
  });

  if (compExistente) {
    await prisma.comprovante.update({
      where: { id: compExistente.id },
      data: {
        arquivoNome: nomeArquivo,
        status: "PENDENTE",
        motivoRecusa: null,
      },
    });
  } else {
    await prisma.comprovante.create({
      data: {
        contribuicaoId,
        usuarioId,
        arquivoUrl: `/uploads/${Date.now()}_${nomeArquivo}`,
        arquivoNome: nomeArquivo,
        tamanhoBytes: 150000,
        mimeType: "image/png",
        status: "PENDENTE",
      },
    });
  }

  revalidatePath("/");
  return { success: true };
}

export async function updateUserThemeAction(usuarioId: string, theme: string) {
  await prisma.user.update({
    where: { id: usuarioId },
    data: { preferredTheme: theme },
  });
  return { success: true };
}

// ==========================================
// MÓDULO DE AUTENTICAÇÃO REAL & SESSÃO
// ==========================================

export async function loginAction(formData: { email: string; password: string }) {
  const email = formData.email.trim().toLowerCase();
  const password = formData.password;

  if (!email || !password) {
    return { success: false, error: "Informe seu e-mail e senha." };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  const senhaValida = await bcrypt.compare(password, user.passwordHash);
  if (!senhaValida) {
    return { success: false, error: "E-mail ou senha incorretos." };
  }

  // Define cookie de sessão por 30 dias
  cookies().set("clube_cota_session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/");
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredTheme: user.preferredTheme,
    },
  };
}

export async function registerAction(formData: {
  name: string;
  email: string;
  password: string;
  telefone?: string;
  receberPixDireto?: boolean;
  tipoChavePix?: string;
  chavePix?: string;
}) {
  const name = formData.name.trim();
  const email = formData.email.trim().toLowerCase();
  const password = formData.password;
  const telefone = formData.telefone ? formatarTelefone(formData.telefone) : null;
  const chavePix = formData.chavePix?.trim() || null;
  const tipoChavePix = formData.tipoChavePix || (chavePix ? "CELULAR" : null);

  if (!name || name.length < 2) {
    return { success: false, error: "O nome deve ter pelo menos 2 caracteres." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return { success: false, error: "Informe um endereço de e-mail válido." };
  }

  if (!password || password.length < 6) {
    return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
  }

  const jaExiste = await prisma.user.findUnique({
    where: { email },
  });

  if (jaExiste) {
    return { success: false, error: "Este e-mail já está cadastrado no sistema." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const novoUsuario = await prisma.user.create({
    data: {
      name,
      email,
      telefone,
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
      receberPixDireto: Boolean(formData.receberPixDireto),
      tipoChavePix,
      chavePix,
    },
  });

  // Salva sessão do novo usuário
  cookies().set("clube_cota_session", novoUsuario.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/");
  return {
    success: true,
    user: {
      id: novoUsuario.id,
      name: novoUsuario.name,
      email: novoUsuario.email,
      role: novoUsuario.role,
      preferredTheme: novoUsuario.preferredTheme,
    },
  };
}

export async function logoutAction() {
  cookies().delete("clube_cota_session");
  revalidatePath("/");
  return { success: true };
}

export async function forgotPasswordAction(email: string) {
  const emailLimpo = email.trim().toLowerCase();
  if (!emailLimpo) {
    return { success: false, error: "Informe o seu e-mail cadastrado." };
  }

  const user = await prisma.user.findUnique({
    where: { email: emailLimpo },
  });

  if (!user) {
    return { success: false, error: "Nenhuma conta encontrada com este e-mail." };
  }

  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora de validade

  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetToken: token,
      resetExpiresAt: expiresAt,
    },
  });

  return {
    success: true,
    message: "Código de recuperação gerado com sucesso!",
    resetToken: token,
  };
}

export async function resetPasswordAction(token: string, novaSenha: string) {
  if (!token || !token.trim()) {
    return { success: false, error: "Token de recuperação inválido." };
  }

  if (!novaSenha || novaSenha.length < 6) {
    return { success: false, error: "A nova senha deve ter no mínimo 6 caracteres." };
  }

  const user = await prisma.user.findUnique({
    where: { resetToken: token.trim() },
  });

  if (!user || !user.resetExpiresAt || user.resetExpiresAt < new Date()) {
    return { success: false, error: "O link ou token de recuperação é inválido ou já expirou." };
  }

  const passwordHash = await bcrypt.hash(novaSenha, 10);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetToken: null,
      resetExpiresAt: null,
    },
  });

  // Inicia sessão automaticamente após a redefinição
  cookies().set("clube_cota_session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/");
  return { success: true, message: "Senha redefinida com sucesso!" };
}

export async function quickLoginAction(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  cookies().set("clube_cota_session", user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  revalidatePath("/");
  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      preferredTheme: user.preferredTheme,
    },
  };
}

export async function updateUserRoleAction(input: {
  adminUserId: string;
  targetUserId: string;
  newRole: "COMUM" | "PRO" | "PRO_MASTER" | "SUPER_ADMIN";
}) {
  try {
    const admin = await prisma.user.findUnique({
      where: { id: input.adminUserId },
    });

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return {
        success: false,
        error: "Apenas usuários com nível Super Admin podem alterar papéis de acesso.",
      };
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: input.targetUserId },
    });

    if (!targetUser) {
      return { success: false, error: "Usuário alvo não encontrado." };
    }

    const validRoles = ["COMUM", "PRO", "PRO_MASTER", "SUPER_ADMIN"];
    if (!validRoles.includes(input.newRole)) {
      return { success: false, error: "Nível de acesso inválido." };
    }

    let novoPlanoExpiraEm = targetUser.planoExpiraEm;
    if (input.newRole === "PRO" || input.newRole === "PRO_MASTER") {
      novoPlanoExpiraEm = calcularNovaDataExpiracao(targetUser.planoExpiraEm, 30);
    } else if (input.newRole === "COMUM" || input.newRole === "SUPER_ADMIN") {
      novoPlanoExpiraEm = null;
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        role: input.newRole,
        planoExpiraEm: novoPlanoExpiraEm,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Nível de acesso de ${updatedUser.name} alterado para ${input.newRole} com sucesso!`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Erro ao atualizar nível de acesso." };
  }
}

export interface UpdateConsorcioInfoInput {
  consorcioId: string;
  usuarioId: string;
  nome: string;
  finalidade?: string;
  regras?: string;
  tipoChavePix?: string;
  chavePix?: string;
  dadosPagamento?: string;
}

export async function updateConsorcioInfoAction(input: UpdateConsorcioInfoInput) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const consorcio = await prisma.consorcio.findUnique({ where: { id: input.consorcioId } });
    if (!consorcio) {
      return { success: false, error: "Consórcio não encontrado." };
    }

    const isAdminGeral = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";
    const isCriador = consorcio.criadorId === user.id;

    if (!isCriador && !isAdminGeral) {
      return {
        success: false,
        error: "Apenas o criador deste consórcio ou administradores podem editar essas informações.",
      };
    }

    if (consorcio.status === "ENCERRADO") {
      return {
        success: false,
        error: "Este consórcio está encerrado (somente leitura) e não permite alterações cadastrais.",
      };
    }

    if (!input.nome || !input.nome.trim()) {
      return { success: false, error: "O nome do consórcio é obrigatório." };
    }

    const chavePixValida = (input.chavePix || input.dadosPagamento)?.trim();
    if (!chavePixValida) {
      return { success: false, error: "A chave Pix do consórcio é obrigatória." };
    }

    const tipoChavePixEfetivo = input.tipoChavePix || consorcio.tipoChavePix || "CHAVE_ALEATORIA";

    const dadosAnteriores = {
      nome: consorcio.nome,
      finalidade: consorcio.finalidade,
      regras: consorcio.regras,
      tipoChavePix: consorcio.tipoChavePix,
      chavePix: consorcio.chavePix,
      dadosBancarios: consorcio.dadosBancarios,
    };

    const atualizado = await prisma.consorcio.update({
      where: { id: input.consorcioId },
      data: {
        nome: input.nome.trim(),
        finalidade: input.finalidade?.trim() || null,
        regras: input.regras?.trim() || null,
        tipoChavePix: tipoChavePixEfetivo,
        chavePix: chavePixValida,
        dadosBancarios: input.dadosPagamento?.trim() || chavePixValida,
      },
    });

    // Registra trilha de auditoria oficial
    await prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: user.id,
        tipoAcao: "EDICAO_DADOS_CONSORCIO",
        detalhes: JSON.stringify({
          antes: dadosAnteriores,
          depois: {
            nome: atualizado.nome,
            finalidade: atualizado.finalidade,
            regras: atualizado.regras,
            tipoChavePix: atualizado.tipoChavePix,
            chavePix: atualizado.chavePix,
            dadosPagamento: atualizado.chavePix,
          },
        }),
        justificativa: "Atualização de dados informativos e de pagamento do consórcio.",
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Informações do consórcio atualizadas com sucesso!",
      consorcio: atualizado,
    };
  } catch (error: any) {
    console.error("Erro ao atualizar dados do consórcio:", error);
    return { success: false, error: error.message || "Erro ao atualizar informações do consórcio." };
  }
}

export interface UpdateUserPixSettingsInput {
  usuarioId: string;
  receberPixDireto: boolean;
  tipoChavePix?: string;
  chavePix?: string;
}

export async function updateUserPixSettingsAction(input: UpdateUserPixSettingsInput) {
  try {
    if (!input.usuarioId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const usuario = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!usuario) {
      return { success: false, error: "Usuário não encontrado." };
    }

    if (input.receberPixDireto) {
      if (!input.chavePix || !input.chavePix.trim()) {
        return {
          success: false,
          error: "Para receber a bolada diretamente via Pix na sua conta, informe sua Chave Pix.",
        };
      }
    }

    const chavePixLimpa = input.chavePix?.trim() || null;
    const tipoChavePixEfetivo = input.tipoChavePix || "CELULAR";

    const atualizado = await prisma.user.update({
      where: { id: input.usuarioId },
      data: {
        receberPixDireto: Boolean(input.receberPixDireto),
        tipoChavePix: input.receberPixDireto ? tipoChavePixEfetivo : usuario.tipoChavePix,
        chavePix: input.receberPixDireto ? chavePixLimpa : usuario.chavePix,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Preferências de recebimento Pix salvas com sucesso!",
      user: {
        id: atualizado.id,
        receberPixDireto: atualizado.receberPixDireto,
        tipoChavePix: atualizado.tipoChavePix,
        chavePix: atualizado.chavePix,
      },
    };
  } catch (error: any) {
    console.error("Erro ao salvar preferências Pix do usuário:", error);
    return { success: false, error: error.message || "Erro ao salvar preferências Pix." };
  }
}

export interface UpdateUserProfileDadosInput {
  usuarioId: string;
  name: string;
  telefone?: string | null;
  tipoChavePix?: string | null;
  chavePix?: string | null;
  receberPixDireto?: boolean;
  senhaAtual?: string;
  novaSenha?: string;
}

export async function updateUserProfileDadosAction(input: UpdateUserProfileDadosInput) {
  try {
    if (!input.usuarioId) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const trimmedName = input.name?.trim();
    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: "O nome completo deve ter no mínimo 2 caracteres." };
    }

    const user = await prisma.user.findUnique({
      where: { id: input.usuarioId },
    });

    if (!user) {
      return { success: false, error: "Usuário não encontrado." };
    }

    const updateData: {
      name: string;
      telefone?: string | null;
      tipoChavePix?: string | null;
      chavePix?: string | null;
      receberPixDireto?: boolean;
      passwordHash?: string;
    } = {
      name: trimmedName,
      telefone: input.telefone ? formatarTelefone(input.telefone) : null,
    };

    if (input.tipoChavePix !== undefined) {
      updateData.tipoChavePix = input.tipoChavePix || "CELULAR";
    }
    if (input.chavePix !== undefined) {
      updateData.chavePix = input.chavePix ? input.chavePix.trim() : null;
    }
    if (input.receberPixDireto !== undefined) {
      updateData.receberPixDireto = Boolean(input.receberPixDireto);
    }

    // Validação de alteração de senha (se informada)
    if (input.novaSenha && input.novaSenha.trim().length > 0) {
      if (input.novaSenha.trim().length < 6) {
        return { success: false, error: "A nova senha deve ter no mínimo 6 dígitos." };
      }

      // Se já possui senha cadastrada, exige a senha atual correta
      if (user.passwordHash) {
        if (!input.senhaAtual) {
          return {
            success: false,
            error: "Informe a sua senha atual para autorizar a alteração de senha.",
          };
        }
        const senhaValida = await bcrypt.compare(input.senhaAtual, user.passwordHash);
        if (!senhaValida) {
          return { success: false, error: "A senha atual informada está incorreta." };
        }
      }

      updateData.passwordHash = await bcrypt.hash(input.novaSenha.trim(), 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: input.usuarioId },
      data: updateData,
    });

    // Registra na trilha de auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioResponsavelId: user.id,
        usuarioAfetadoId: user.id,
        tipoAcao: "EDICAO_PERFIL_USUARIO",
        detalhes: JSON.stringify({
          nomeAnterior: user.name,
          novoNome: updatedUser.name,
          telefoneAnterior: user.telefone || "Não informado",
          novoTelefone: updatedUser.telefone || "Não informado",
          tipoChavePixAnterior: user.tipoChavePix || "Não informado",
          novoTipoChavePix: updatedUser.tipoChavePix || "Não informado",
          chavePixAnterior: user.chavePix || "Não informada",
          novaChavePix: updatedUser.chavePix || "Não informada",
          senhaAlterada: Boolean(input.novaSenha),
        }),
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: "Dados cadastrais atualizados com sucesso!",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        telefone: updatedUser.telefone,
        tipoChavePix: updatedUser.tipoChavePix,
        chavePix: updatedUser.chavePix,
        receberPixDireto: updatedUser.receberPixDireto,
      },
    };
  } catch (error: any) {
    console.error("Erro ao atualizar dados cadastrais do perfil:", error);
    return {
      success: false,
      error: error.message || "Erro interno ao atualizar os dados do perfil.",
    };
  }
}

export interface UpdateParticipantInfoInput {
  consorcioId: string;
  gestorUserId: string;
  targetUserId: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipoChavePix?: TipoChavePix;
  chavePix?: string;
  receberPixDireto?: boolean;
}

export async function updateParticipantInfoAction(input: UpdateParticipantInfoInput) {
  try {
    const gestor = await prisma.user.findUnique({ where: { id: input.gestorUserId } });
    if (!gestor) return { success: false, error: "Gestor não encontrado." };

    const consorcio = await prisma.consorcio.findUnique({ where: { id: input.consorcioId } });
    if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

    const isAutorizado =
      gestor.role === "SUPER_ADMIN" ||
      gestor.role === "PRO_MASTER" ||
      consorcio.criadorId === gestor.id;

    if (!isAutorizado) {
      return { success: false, error: "Você não tem permissão para editar participantes deste consórcio." };
    }

    if (consorcio.status === "ENCERRADO") {
      return {
        success: false,
        error: "Este consórcio está encerrado (somente leitura) e não permite alteração de dados de participantes.",
      };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: input.targetUserId } });
    if (!targetUser) return { success: false, error: "Participante não encontrado." };

    const nomeLimpo = input.nome.trim();
    if (!nomeLimpo) return { success: false, error: "O nome do participante é obrigatório." };

    let emailFinal = targetUser.email;
    const novoEmail = input.email?.trim().toLowerCase();

    if (novoEmail && novoEmail !== targetUser.email) {
      const existente = await prisma.user.findUnique({ where: { email: novoEmail } });
      if (existente && existente.id !== targetUser.id) {
        return {
          success: false,
          error: `O e-mail "${novoEmail}" já está em uso por outro usuário cadastrado no sistema.`,
        };
      }
      emailFinal = novoEmail;
    }

    const telefoneFormatado = input.telefone ? formatarTelefone(input.telefone) : null;
    const chavePixLimpa = input.chavePix?.trim() || null;
    const tipoPixFinal = chavePixLimpa ? (input.tipoChavePix || "CHAVE_ALEATORIA") : null;
    const receberPixDiretoFinal = Boolean(input.receberPixDireto && chavePixLimpa);

    const dadosAnteriores = {
      name: targetUser.name,
      email: targetUser.email,
      telefone: targetUser.telefone,
      tipoChavePix: targetUser.tipoChavePix,
      chavePix: targetUser.chavePix,
      receberPixDireto: targetUser.receberPixDireto,
    };

    const usuarioAtualizado = await prisma.user.update({
      where: { id: targetUser.id },
      data: {
        name: nomeLimpo,
        email: emailFinal,
        telefone: telefoneFormatado,
        tipoChavePix: tipoPixFinal,
        chavePix: chavePixLimpa,
        receberPixDireto: receberPixDiretoFinal,
      },
    });

    const dadosNovos = {
      name: usuarioAtualizado.name,
      email: usuarioAtualizado.email,
      telefone: usuarioAtualizado.telefone,
      tipoChavePix: usuarioAtualizado.tipoChavePix,
      chavePix: usuarioAtualizado.chavePix,
      receberPixDireto: usuarioAtualizado.receberPixDireto,
    };

    await prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: gestor.id,
        usuarioAfetadoId: targetUser.id,
        tipoAcao: "EDICAO_DADOS_PARTICIPANTE",
        detalhes: JSON.stringify({
          participanteId: targetUser.id,
          nomeAnterior: targetUser.name,
          novoNome: nomeLimpo,
          antes: dadosAnteriores,
          depois: dadosNovos,
        }),
        justificativa: "Atualização de dados cadastrais do participante pelo gestor.",
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Dados cadastrais de ${nomeLimpo} atualizados com sucesso!`,
      usuario: {
        id: usuarioAtualizado.id,
        name: usuarioAtualizado.name,
        email: usuarioAtualizado.email,
        telefone: usuarioAtualizado.telefone,
        tipoChavePix: usuarioAtualizado.tipoChavePix,
        chavePix: usuarioAtualizado.chavePix,
        receberPixDireto: usuarioAtualizado.receberPixDireto,
      },
    };
  } catch (error: any) {
    console.error("Erro ao atualizar participante:", error);
    return { success: false, error: error.message || "Erro ao atualizar participante." };
  }
}

export interface SubstituteParticipantInput {
  consorcioId: string;
  cotaId: string;
  participanteAntigoId: string;
  gestorUserId: string;
  modoNovoParticipante: "EXISTENTE" | "NOVO";
  novoUsuarioId?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  tipoChavePix?: TipoChavePix;
  chavePix?: string;
  receberPixDireto?: boolean;
  aPartirDoCiclo: number;
  justificativa: string;
  acertoFinanceiroInfo?: string;
}

export async function substituteParticipantAction(input: SubstituteParticipantInput) {
  try {
    const gestor = await prisma.user.findUnique({ where: { id: input.gestorUserId } });
    if (!gestor) return { success: false, error: "Gestor não encontrado." };

    const consorcio = await prisma.consorcio.findUnique({
      where: { id: input.consorcioId },
      include: {
        cotas: {
          include: {
            participantes: { include: { usuario: true } },
          },
        },
      },
    });
    if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

    const isAutorizado =
      gestor.role === "SUPER_ADMIN" ||
      gestor.role === "PRO_MASTER" ||
      consorcio.criadorId === gestor.id;

    if (!isAutorizado) {
      return { success: false, error: "Você não tem permissão para substituir participantes deste consórcio." };
    }

    if (consorcio.status === "ENCERRADO") {
      return {
        success: false,
        error: "Este consórcio está encerrado (somente leitura) e não permite substituição de participantes.",
      };
    }

    if (!input.justificativa || input.justificativa.trim().length < 5) {
      return { success: false, error: "A justificativa da substituição é obrigatória (mínimo de 5 caracteres)." };
    }

    const cota = consorcio.cotas.find((c) => c.id === input.cotaId);
    if (!cota) return { success: false, error: "Cota não encontrada neste consórcio." };

    const vinculoAntigo = cota.participantes.find((p) => p.usuarioId === input.participanteAntigoId);
    if (!vinculoAntigo) {
      return { success: false, error: "O participante informado não pertence a esta cota." };
    }

    const participanteAntigo = vinculoAntigo.usuario;
    let novoUsuario: any = null;

    if (input.modoNovoParticipante === "EXISTENTE") {
      if (!input.novoUsuarioId) {
        return { success: false, error: "Selecione o participante existente que assumirá a cota." };
      }
      novoUsuario = await prisma.user.findUnique({ where: { id: input.novoUsuarioId } });
      if (!novoUsuario) return { success: false, error: "Participante selecionado não foi encontrado." };
    } else {
      const nomeNovo = input.nome?.trim();
      if (!nomeNovo) {
        return { success: false, error: "O nome do novo participante é obrigatório." };
      }

      const hasRealEmail = Boolean(input.email && input.email.trim().length > 0);
      const emailFinal = hasRealEmail
        ? input.email!.trim().toLowerCase()
        : `participante_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`;

      novoUsuario = hasRealEmail
        ? await prisma.user.findUnique({ where: { email: emailFinal } })
        : null;

      if (!novoUsuario) {
        const telefoneFormatado = input.telefone ? formatarTelefone(input.telefone) : null;
        const chavePixLimpa = input.chavePix?.trim() || null;
        const tipoPixFinal = chavePixLimpa ? (input.tipoChavePix || "CHAVE_ALEATORIA") : null;

        novoUsuario = await prisma.user.create({
          data: {
            name: nomeNovo,
            email: emailFinal,
            telefone: telefoneFormatado,
            tipoChavePix: tipoPixFinal,
            chavePix: chavePixLimpa,
            receberPixDireto: Boolean(input.receberPixDireto && chavePixLimpa),
            role: "COMUM",
            isActivated: false,
            inviteToken: hasRealEmail
              ? `convite-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`
              : null,
            inviteExpiresAt: hasRealEmail
              ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              : null,
          },
        });
      }
    }

    if (novoUsuario.id === participanteAntigo.id) {
      return { success: false, error: "O novo titular deve ser uma pessoa diferente do titular atual da cota." };
    }

    // 1. Gera novo Token de Acesso exclusivo para o novo titular (invalidando o link anterior)
    const novoTokenAcesso = "cp_" + crypto.randomBytes(6).toString("hex");

    // 2. Atualiza CotaParticipante com o novo usuario e novo token
    await prisma.cotaParticipante.update({
      where: { id: vinculoAntigo.id },
      data: {
        usuarioId: novoUsuario.id,
        tokenAcesso: novoTokenAcesso,
      },
    });

    // 3. Reatribui as contribuições futuras (numeroCiclo >= aPartirDoCiclo)
    const cicloCorte = Math.max(1, Number(input.aPartirDoCiclo) || 1);
    const atualizacaoContribuicoes = await prisma.contribuicao.updateMany({
      where: {
        cotaId: cota.id,
        usuarioId: participanteAntigo.id,
        numeroCiclo: { gte: cicloCorte },
      },
      data: {
        usuarioId: novoUsuario.id,
      },
    });

    // 4. Registra na trilha de auditoria
    await prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: gestor.id,
        usuarioAfetadoId: novoUsuario.id,
        tipoAcao: "SUBSTITUICAO_PARTICIPANTE_COTA",
        detalhes: JSON.stringify({
          cotaNumero: cota.numero,
          cotaId: cota.id,
          aPartirDoCiclo: cicloCorte,
          parcelasReatribuidas: atualizacaoContribuicoes.count,
          participanteAntigo: {
            id: participanteAntigo.id,
            name: participanteAntigo.name,
            email: participanteAntigo.email,
          },
          novoParticipante: {
            id: novoUsuario.id,
            name: novoUsuario.name,
            email: novoUsuario.email,
            telefone: novoUsuario.telefone,
          },
          acertoFinanceiroInfo: input.acertoFinanceiroInfo?.trim() || null,
          cotaJaContemplada: cota.status === "CONTEMPLADA",
        }),
        justificativa: input.justificativa.trim(),
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Cota #${cota.numero} repassada com sucesso para ${novoUsuario.name}!`,
      novoToken: novoTokenAcesso,
      cotaNumero: cota.numero,
      novoUsuario: {
        id: novoUsuario.id,
        name: novoUsuario.name,
        telefone: novoUsuario.telefone,
      },
    };
  } catch (error: any) {
    console.error("Erro ao substituir participante:", error);
    return { success: false, error: error.message || "Erro ao substituir participante da cota." };
  }
}

export interface SwapCotaPositionsInput {
  consorcioId: string;
  usuarioId: string;
  cotaId1: string;
  cotaId2: string;
  justificativa?: string;
}

export async function swapCotaPositionsAction(input: SwapCotaPositionsInput) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const consorcio = await prisma.consorcio.findUnique({
      where: { id: input.consorcioId },
      include: {
        cotas: {
          include: {
            participantes: {
              include: { usuario: true },
            },
          },
        },
      },
    });

    if (!consorcio) {
      return { success: false, error: "Consórcio não encontrado." };
    }

    const isAdminGeral = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";
    const isCriador = consorcio.criadorId === user.id;

    if (!isCriador && !isAdminGeral) {
      return {
        success: false,
        error: "Somente o criador do consórcio ou administradores estão autorizados a efetivar a troca de posições no sistema.",
      };
    }

    if (consorcio.status === "ENCERRADO") {
      return {
        success: false,
        error: "Este consórcio está encerrado (somente leitura) e não permite troca de posições de cotas.",
      };
    }

    if (input.cotaId1 === input.cotaId2) {
      return { success: false, error: "Selecione duas cotas diferentes para realizar a troca." };
    }

    const cota1 = consorcio.cotas.find((c) => c.id === input.cotaId1);
    const cota2 = consorcio.cotas.find((c) => c.id === input.cotaId2);

    if (!cota1 || !cota2) {
      return { success: false, error: "Uma ou ambas as cotas selecionadas não pertencem a este consórcio." };
    }

    if (cota1.status === "CONTEMPLADA" || cota2.status === "CONTEMPLADA") {
      return {
        success: false,
        error: "Não é permitido trocar a posição de uma cota que já foi contemplada.",
      };
    }

    const pos1 = cota1.ordemSorteio || cota1.numero;
    const pos2 = cota2.ordemSorteio || cota2.numero;

    const nomesCota1 = cota1.participantes.map((p) => p.usuario.name).join(" & ");
    const nomesCota2 = cota2.participantes.map((p) => p.usuario.name).join(" & ");

    // Realiza a troca atômica no banco de dados
    await prisma.$transaction([
      prisma.cota.update({
        where: { id: cota1.id },
        data: { ordemSorteio: pos2 },
      }),
      prisma.cota.update({
        where: { id: cota2.id },
        data: { ordemSorteio: pos1 },
      }),
    ]);

    // Registra na trilha de auditoria oficial
    await prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: user.id,
        tipoAcao: "TROCA_POSICAO_COTA",
        detalhes: JSON.stringify({
          cota1: {
            id: cota1.id,
            numero: cota1.numero,
            participantes: nomesCota1,
            ordemAnterior: pos1,
            novaOrdem: pos2,
          },
          cota2: {
            id: cota2.id,
            numero: cota2.numero,
            participantes: nomesCota2,
            ordemAnterior: pos2,
            novaOrdem: pos1,
          },
        }),
        justificativa:
          input.justificativa?.trim() ||
          `Troca de ordem de contemplação entre ${nomesCota1} (Ciclo #${pos1}) e ${nomesCota2} (Ciclo #${pos2}) acordada entre as partes e efetivada pelo criador.`,
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message: `Troca de posição entre Cota #${cota1.numero} e Cota #${cota2.numero} efetivada com sucesso!`,
    };
  } catch (error: any) {
    console.error("Erro ao trocar posições de cotas:", error);
    return { success: false, error: error.message || "Erro ao efetivar troca de posição." };
  }
}

export interface ToggleCotaContempladaInput {
  consorcioId: string;
  usuarioId: string;
  cotaId: string;
  status: "ATIVA" | "CONTEMPLADA";
  justificativa?: string;
}

export async function toggleCotaContempladaAction(input: ToggleCotaContempladaInput) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) {
      return { success: false, error: "Usuário não autenticado." };
    }

    const consorcio = await prisma.consorcio.findUnique({
      where: { id: input.consorcioId },
      include: {
        cotas: {
          include: {
            participantes: { include: { usuario: true } },
          },
        },
      },
    });

    if (!consorcio) {
      return { success: false, error: "Consórcio não encontrado." };
    }

    const isAdminGeral = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";
    const isCriador = consorcio.criadorId === user.id;

    if (!isCriador && !isAdminGeral) {
      return {
        success: false,
        error: "Somente o criador do consórcio ou administradores podem registrar a contemplação de cotas.",
      };
    }

    const cota = consorcio.cotas.find((c) => c.id === input.cotaId);
    if (!cota) {
      return { success: false, error: "Cota não encontrada." };
    }

    const nomesParticipantes = cota.participantes.map((p) => p.usuario.name).join(" & ");

    await prisma.cota.update({
      where: { id: cota.id },
      data: { status: input.status },
    });

    // Registra na trilha de auditoria
    await prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: user.id,
        tipoAcao: input.status === "CONTEMPLADA" ? "CONTEMPLACAO_COTA" : "REVERSAO_CONTEMPLACAO_COTA",
        detalhes: JSON.stringify({
          cotaId: cota.id,
          numero: cota.numero,
          ordemSorteio: cota.ordemSorteio || cota.numero,
          participantes: nomesParticipantes,
          statusAnterior: cota.status,
          novoStatus: input.status,
        }),
        justificativa:
          input.justificativa ||
          (input.status === "CONTEMPLADA"
            ? `Cota #${cota.numero} marcada como contemplada no ciclo correspondente.`
            : `Contemplação da cota #${cota.numero} revertida pelo criador.`),
      },
    });

    revalidatePath("/");
    return {
      success: true,
      message:
        input.status === "CONTEMPLADA"
          ? `Cota #${cota.numero} (${nomesParticipantes}) marcada como CONTEMPLADA com sucesso!`
          : `Cota #${cota.numero} retornou ao status ATIVA.`,
    };
  } catch (error: any) {
    console.error("Erro ao alterar contemplação da cota:", error);
    return { success: false, error: error.message || "Erro ao registrar contemplação." };
  }
}

export async function getParticipanteByToken(token: string) {
  try {
    if (!token) return { success: false, error: "Token não fornecido." };

    // 1. Tenta buscar por CotaParticipante
    let cotaParticipante = await prisma.cotaParticipante.findUnique({
      where: { tokenAcesso: token },
      include: {
        usuario: {
          select: {
            id: true,
            name: true,
            email: true,
            telefone: true,
            chavePix: true,
            tipoChavePix: true,
            receberPixDireto: true,
            role: true,
            isActivated: true,
            passwordHash: true,
          },
        },
        cota: {
          include: {
            consorcio: {
              include: {
                criador: {
                  select: { id: true, name: true, email: true, telefone: true },
                },
              },
            },
            participantes: {
              include: {
                usuario: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    // 2. Se não encontrou por participante, tenta buscar por Cota
    if (!cotaParticipante) {
      const cota = await prisma.cota.findUnique({
        where: { tokenAcesso: token },
        include: {
          consorcio: {
            include: {
              criador: { select: { id: true, name: true, email: true, telefone: true } },
            },
          },
          participantes: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  telefone: true,
                  chavePix: true,
                  tipoChavePix: true,
                  receberPixDireto: true,
                  role: true,
                  isActivated: true,
                  passwordHash: true,
                },
              },
            },
          },
        },
      });

      if (cota && cota.participantes.length > 0) {
        cotaParticipante = {
          ...cota.participantes[0],
          cota: cota as any,
        } as any;
      }
    }

    if (!cotaParticipante) {
      return { success: false, error: "Acesso não encontrado ou link inválido." };
    }

    const { cota, usuario } = cotaParticipante;
    const consorcio = cota.consorcio;

    // Busca contribuições deste usuário neste consórcio
    const contribuicoes = await prisma.contribuicao.findMany({
      where: {
        consorcioId: consorcio.id,
        cotaId: cota.id,
        usuarioId: usuario.id,
      },
      include: {
        comprovante: true,
      },
      orderBy: { numeroCiclo: "asc" },
    });

    // Busca todas as cotas ordenadas por ordem de contemplação para transparência
    const todasCotas = await prisma.cota.findMany({
      where: { consorcioId: consorcio.id },
      include: {
        participantes: {
          include: {
            usuario: {
              select: {
                id: true,
                name: true,
                isActivated: true,
                receberPixDireto: true,
                tipoChavePix: true,
                chavePix: true,
              },
            },
          },
        },
      },
      orderBy: { ordemSorteio: "asc" },
    });

    // Atualiza status se houver parcelas vencidas
    const hoje = new Date();
    for (const c of contribuicoes) {
      if (c.status === "PENDENTE" && hoje > new Date(c.dataVencimento)) {
        await prisma.contribuicao.update({
          where: { id: c.id },
          data: { status: "EM_ATRASO" },
        });
        c.status = "EM_ATRASO";
      }
    }

    return {
      success: true,
      data: {
        participante: {
          id: usuario.id,
          nome: usuario.name,
          email: usuario.email,
          telefone: usuario.telefone || "",
          tipoChavePix: usuario.tipoChavePix || "CELULAR",
          chavePix: usuario.chavePix || "",
          receberPixDireto: Boolean(usuario.receberPixDireto),
          temSenha: Boolean(usuario.passwordHash),
          isActivated: Boolean(usuario.isActivated),
          isEmailTemporario: Boolean(usuario.email?.endsWith("@clubedacota.local")),
          percentual: cotaParticipante.percentual,
          valorParcela: cotaParticipante.valorParcela,
          tokenAcesso: cotaParticipante.tokenAcesso,
        },
        cota: {
          id: cota.id,
          numero: cota.numero,
          ordemSorteio: cota.ordemSorteio || cota.numero,
          isCompartilhada: cota.isCompartilhada,
          status: cota.status,
          participantes: cota.participantes.map((p) => ({
            id: p.usuarioId,
            nome: p.usuario.name,
            percentual: p.percentual,
          })),
        },
        consorcio: {
          id: consorcio.id,
          nome: consorcio.nome,
          finalidade: consorcio.finalidade,
          status: consorcio.status,
          frequencia: consorcio.frequencia,
          modeloContribuicao: consorcio.modeloContribuicao,
          valorCota: consorcio.valorCota,
          valorAcrescimo: consorcio.valorAcrescimo,
          valorTotalBolada: consorcio.valorTotalBolada,
          totalCotas: consorcio.totalCotas,
          tipoChavePix: consorcio.tipoChavePix,
          chavePix: consorcio.chavePix,
          dadosBancarios: consorcio.dadosBancarios,
          regras: consorcio.regras,
          criadorNome: consorcio.criador.name,
          criadorEmail: consorcio.criador.email,
          criadorTelefone: (consorcio.criador as any).telefone || null,
        },
        contribuicoes: contribuicoes.map((cb) => ({
          id: cb.id,
          numeroCiclo: cb.numeroCiclo,
          valorPrevisto: cb.valorPrevisto,
          dataVencimento: cb.dataVencimento,
          status: cb.status,
          dataPagamento: cb.dataPagamento,
          comprovante: cb.comprovante
            ? {
                id: cb.comprovante.id,
                arquivoNome: cb.comprovante.arquivoNome,
                status: cb.comprovante.status,
                motivoRecusa: cb.comprovante.motivoRecusa,
              }
            : null,
        })),
        ciclosGrupo: todasCotas.map((cot) => {
          const partPrincipal = cot.participantes[0]?.usuario;
          return {
            id: cot.id,
            numeroCota: cot.numero,
            ordemSorteio: cot.ordemSorteio || cot.numero,
            status: cot.status,
            participantes: cot.participantes.map((p) => p.usuario.name).join(" & "),
            temPixDireto: Boolean(
              partPrincipal?.isActivated &&
              partPrincipal?.receberPixDireto &&
              partPrincipal?.chavePix
            ),
            tipoChavePix: partPrincipal?.tipoChavePix || null,
            chavePix: partPrincipal?.chavePix || null,
            usuarioId: partPrincipal?.id || null,
            usuarioNome: partPrincipal?.name || null,
          };
        }),
      },
    };
  } catch (error: any) {
    console.error("Erro ao buscar dados do participante por token:", error);
    return { success: false, error: "Erro ao carregar dados do participante." };
  }
}

export async function submitReceiptByTokenAction(
  token: string,
  contribuicaoId: string,
  arquivoNome: string
) {
  try {
    if (!token || !contribuicaoId || !arquivoNome) {
      return { success: false, error: "Parâmetros obrigatórios ausentes." };
    }

    const participanteRes = await getParticipanteByToken(token);
    if (!participanteRes.success || !participanteRes.data) {
      return { success: false, error: "Acesso inválido." };
    }

    const usuarioId = participanteRes.data.participante.id;
    const consorcioId = participanteRes.data.consorcio.id;

    const contribuicao = await prisma.contribuicao.findFirst({
      where: {
        id: contribuicaoId,
        usuarioId,
        consorcioId,
      },
    });

    if (!contribuicao) {
      return { success: false, error: "Contribuição não encontrada para este participante." };
    }

    await prisma.comprovante.upsert({
      where: { contribuicaoId },
      create: {
        contribuicaoId,
        usuarioId,
        arquivoUrl: `/uploads/${arquivoNome}`,
        arquivoNome,
        tamanhoBytes: 1024,
        mimeType: arquivoNome.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        status: "PENDENTE",
      },
      update: {
        arquivoUrl: `/uploads/${arquivoNome}`,
        arquivoNome,
        mimeType: arquivoNome.endsWith(".pdf") ? "application/pdf" : "image/jpeg",
        status: "PENDENTE",
        motivoRecusa: null,
      },
    });

    await prisma.auditoriaLog.create({
      data: {
        consorcioId,
        usuarioResponsavelId: usuarioId,
        tipoAcao: "ENVIO_COMPROVANTE",
        detalhes: JSON.stringify({
          tipo: "ENVIO_COMPROVANTE_VIA_LINK",
          contribuicaoId,
          ciclo: contribuicao.numeroCiclo,
          valor: contribuicao.valorPrevisto,
          arquivoNome,
          participante: participanteRes.data.participante.nome,
        }),
        justificativa: `Comprovante '${arquivoNome}' enviado pelo participante via link rápido.`,
      },
    });

    revalidatePath("/");
    return { success: true, message: "Comprovante enviado com sucesso para o organizador!" };
  } catch (error: any) {
    console.error("Erro ao enviar comprovante via token:", error);
    return { success: false, error: error.message || "Erro ao registrar comprovante." };
  }
}

export async function ativarContaComSenhaAction(
  token: string,
  novaSenha: string,
  pixSettings?: {
    receberPixDireto?: boolean;
    tipoChavePix?: string;
    chavePix?: string;
  }
) {
  try {
    if (!token || !novaSenha || novaSenha.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    const participanteRes = await getParticipanteByToken(token);
    if (!participanteRes.success || !participanteRes.data) {
      return { success: false, error: "Acesso inválido." };
    }

    const usuarioId = participanteRes.data.participante.id;
    const passwordHash = await bcrypt.hash(novaSenha, 10);

    await prisma.user.update({
      where: { id: usuarioId },
      data: {
        passwordHash,
        isActivated: true,
        ...(pixSettings
          ? {
              receberPixDireto: Boolean(pixSettings.receberPixDireto),
              tipoChavePix: pixSettings.tipoChavePix || "CELULAR",
              chavePix: pixSettings.chavePix?.trim() || null,
            }
          : {}),
      },
    });

    return {
      success: true,
      message: "Senha cadastrada com sucesso! Agora você também pode fazer login completo no sistema.",
    };
  } catch (error: any) {
    console.error("Erro ao cadastrar senha para o participante:", error);
    return { success: false, error: error.message || "Erro ao definir senha." };
  }
}

export async function completarCadastroParticipanteAction(input: {
  token: string;
  nome?: string;
  email: string;
  telefone?: string;
  senha: string;
  tipoChavePix?: string;
  chavePix?: string;
  receberPixDireto?: boolean;
}) {
  try {
    const { token, nome, email, telefone, senha, tipoChavePix, chavePix, receberPixDireto } = input;

    if (!token) {
      return { success: false, error: "Link de acesso inválido ou ausente." };
    }

    const participanteRes = await getParticipanteByToken(token);
    if (!participanteRes.success || !participanteRes.data) {
      return { success: false, error: "Link de acesso inválido ou expirado." };
    }

    const usuarioId = participanteRes.data.participante.id;
    const consorcioId = participanteRes.data.consorcio.id;

    const usuarioAtual = await prisma.user.findUnique({
      where: { id: usuarioId },
    });

    if (!usuarioAtual) {
      return { success: false, error: "Usuário participante não encontrado." };
    }

    const nomeLimpo = nome?.trim() || usuarioAtual.name;
    const emailLimpo = email?.trim().toLowerCase();
    const telefoneLimpo = telefone ? formatarTelefone(telefone) : usuarioAtual.telefone;

    if (!nomeLimpo || nomeLimpo.length < 2) {
      return { success: false, error: "Informe seu nome completo." };
    }

    if (!emailLimpo || !emailLimpo.includes("@") || !emailLimpo.includes(".")) {
      return { success: false, error: "Informe um e-mail válido para acessar sua conta." };
    }

    if (!senha || senha.length < 6) {
      return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };
    }

    const tipoPixEfetivo = tipoChavePix || "CELULAR";
    const chavePixEfetiva = chavePix?.trim() || null;
    const receberPixDiretoEfetivo = Boolean(receberPixDireto && chavePixEfetiva);

    // 1. Verifica se já existe outra conta no sistema com esse e-mail
    const usuarioExistente = await prisma.user.findUnique({
      where: { email: emailLimpo },
    });

    let usuarioFinalId = usuarioAtual.id;

    if (usuarioExistente && usuarioExistente.id !== usuarioAtual.id) {
      // Caso 1: O e-mail já existe no sistema com senha cadastrada
      if (usuarioExistente.passwordHash) {
        const senhaCorreta = await bcrypt.compare(senha, usuarioExistente.passwordHash);
        if (!senhaCorreta) {
          return {
            success: false,
            error: "Já existe uma conta com este e-mail no Clube da Cota. Informe a senha correta da sua conta para vincular este consórcio ao seu perfil existente.",
          };
        }
      }

      // Senha confere ou usuário existente não tinha senha ainda: mescla os registros
      const novoPasswordHash = usuarioExistente.passwordHash || (await bcrypt.hash(senha, 10));

      await prisma.$transaction([
        // Atualiza titularidade da cota
        prisma.cotaParticipante.updateMany({
          where: { usuarioId: usuarioAtual.id },
          data: { usuarioId: usuarioExistente.id },
        }),
        // Atualiza parcelas financeiras
        prisma.contribuicao.updateMany({
          where: { usuarioId: usuarioAtual.id },
          data: { usuarioId: usuarioExistente.id },
        }),
        // Atualiza comprovantes
        prisma.comprovante.updateMany({
          where: { usuarioId: usuarioAtual.id },
          data: { usuarioId: usuarioExistente.id },
        }),
        // Atualiza trilha de auditoria
        prisma.auditoriaLog.updateMany({
          where: { usuarioAfetadoId: usuarioAtual.id },
          data: { usuarioAfetadoId: usuarioExistente.id },
        }),
        // Atualiza perfil do usuário existente
        prisma.user.update({
          where: { id: usuarioExistente.id },
          data: {
            name: usuarioExistente.name || nomeLimpo,
            telefone: usuarioExistente.telefone || telefoneLimpo,
            passwordHash: novoPasswordHash,
            isActivated: true,
            tipoChavePix: chavePixEfetiva ? tipoPixEfetivo : usuarioExistente.tipoChavePix,
            chavePix: chavePixEfetiva || usuarioExistente.chavePix,
            receberPixDireto: chavePixEfetiva ? receberPixDiretoEfetivo : usuarioExistente.receberPixDireto,
          },
        }),
        // Remove usuário temporário órfão
        prisma.user.delete({
          where: { id: usuarioAtual.id },
        }),
      ]);

      usuarioFinalId = usuarioExistente.id;
    } else {
      // Caso 2: E-mail novo ou o mesmo usuário
      const passwordHash = await bcrypt.hash(senha, 10);
      await prisma.user.update({
        where: { id: usuarioAtual.id },
        data: {
          name: nomeLimpo,
          email: emailLimpo,
          telefone: telefoneLimpo,
          passwordHash,
          isActivated: true,
          tipoChavePix: tipoPixEfetivo,
          chavePix: chavePixEfetiva,
          receberPixDireto: receberPixDiretoEfetivo,
        },
      });

      usuarioFinalId = usuarioAtual.id;
    }

    // Registra na trilha de auditoria
    await prisma.auditoriaLog.create({
      data: {
        consorcioId,
        usuarioResponsavelId: usuarioFinalId,
        usuarioAfetadoId: usuarioFinalId,
        tipoAcao: "ATIVACAO_CONTA_PARTICIPANTE",
        detalhes: `Participante "${nomeLimpo}" completou seu cadastro oficial (${emailLimpo}) e ativou acesso com senha.`,
        justificativa: "Ativação voluntária de cadastro completo pelo link do participante.",
      },
    });

    // Inicia sessão no navegador via cookie seguro
    cookies().set("clube_cota_session", usuarioFinalId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 dias
      path: "/",
    });

    revalidatePath(`/participante/${token}`);
    revalidatePath("/");

    return {
      success: true,
      message: "Cadastro concluído com sucesso! Sua conta foi vinculada e você já está conectado.",
    };
  } catch (error: any) {
    console.error("Erro ao completar cadastro do participante:", error);
    return { success: false, error: error.message || "Erro ao processar cadastro." };
  }
}

export async function updateParticipantPixByTokenAction(input: {
  token: string;
  tipoChavePix: string;
  chavePix: string;
  receberPixDireto: boolean;
}) {
  try {
    const { token, tipoChavePix, chavePix, receberPixDireto } = input;
    if (!token) return { success: false, error: "Link de acesso inválido." };

    const participanteRes = await getParticipanteByToken(token);
    if (!participanteRes.success || !participanteRes.data) {
      return { success: false, error: "Acesso inválido ou link expirado." };
    }

    const usuarioId = participanteRes.data.participante.id;
    const consorcioId = participanteRes.data.consorcio.id;
    const chaveLimpa = chavePix?.trim() || null;

    await prisma.user.update({
      where: { id: usuarioId },
      data: {
        tipoChavePix: tipoChavePix || "CELULAR",
        chavePix: chaveLimpa,
        receberPixDireto: Boolean(receberPixDireto && chaveLimpa),
      },
    });

    await prisma.auditoriaLog.create({
      data: {
        consorcioId,
        usuarioResponsavelId: usuarioId,
        usuarioAfetadoId: usuarioId,
        tipoAcao: "EDICAO_DADOS_PARTICIPANTE",
        detalhes: `Participante "${participanteRes.data.participante.nome}" atualizou seus dados Pix para recebimento de contemplações.`,
        justificativa: "Atualização cadastral de Chave Pix via portal do participante.",
      },
    });

    revalidatePath(`/participante/${token}`);
    revalidatePath("/");

    return { success: true, message: "Dados Pix atualizados com sucesso!" };
  } catch (error: any) {
    console.error("Erro ao atualizar Pix do participante:", error);
    return { success: false, error: error.message || "Erro ao salvar dados Pix." };
  }
}

// ==========================================
// MÓDULO DE GESTÃO DE ASSINATURAS & PLANOS SAAS
// ==========================================

export async function solicitarAssinaturaAction(input: {
  usuarioId: string;
  plano: "PRO" | "PRO_MASTER";
  comprovanteNome?: string;
  comprovanteUrl?: string;
  observacoes?: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    if (input.plano !== "PRO" && input.plano !== "PRO_MASTER") {
      return { success: false, error: "Plano inválido selecionado." };
    }

    const valor = input.plano === "PRO" ? 19.9 : 29.9;

    // Se já houver solicitação pendente para esse usuário, atualiza com o novo comprovante
    const pendente = await prisma.assinaturaPlano.findFirst({
      where: { usuarioId: user.id, status: "PENDENTE" },
      orderBy: { solicitadoEm: "desc" },
    });

    let assinatura;
    if (pendente) {
      assinatura = await prisma.assinaturaPlano.update({
        where: { id: pendente.id },
        data: {
          plano: input.plano,
          valor,
          comprovanteNome: input.comprovanteNome || pendente.comprovanteNome,
          comprovanteUrl: input.comprovanteUrl || pendente.comprovanteUrl,
          observacoes: input.observacoes,
          solicitadoEm: new Date(),
          status: "PENDENTE",
          motivoRecusa: null,
        },
      });
    } else {
      assinatura = await prisma.assinaturaPlano.create({
        data: {
          usuarioId: user.id,
          plano: input.plano,
          valor,
          mesesVigencia: 1,
          status: "PENDENTE",
          comprovanteNome: input.comprovanteNome,
          comprovanteUrl: input.comprovanteUrl,
          observacoes: input.observacoes,
        },
      });
    }

    // Registrar log de auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioResponsavelId: user.id,
        usuarioAfetadoId: user.id,
        tipoAcao: "SOLICITACAO_UPGRADE_PLANO",
        detalhes: `Usuário ${user.name} solicitou ativação do Plano ${input.plano} (R$ ${valor.toFixed(2)}/mês).`,
        justificativa: input.observacoes || "Envio de comprovante Pix para aprovação.",
      },
    });

    revalidatePath("/");
    return {
      success: true,
      assinaturaId: assinatura.id,
      message: "Solicitação enviada com sucesso! O administrador Marcos Batista analisará seu comprovante.",
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao registrar solicitação de upgrade." };
  }
}

export async function aprovarAssinaturaAction(input: {
  assinaturaId: string;
  adminId: string;
  diasAdicionais?: number;
}) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Apenas Super Admin pode aprovar assinaturas." };
    }

    const assinatura = await prisma.assinaturaPlano.findUnique({
      where: { id: input.assinaturaId },
      include: { usuario: true },
    });

    if (!assinatura) return { success: false, error: "Solicitação de assinatura não encontrada." };

    const dias = input.diasAdicionais || 30;
    const agora = new Date();
    const novaDataFim = calcularNovaDataExpiracao(assinatura.usuario.planoExpiraEm, dias);

    await prisma.$transaction([
      prisma.assinaturaPlano.update({
        where: { id: assinatura.id },
        data: {
          status: "APROVADO",
          dataInicio: agora,
          dataFim: novaDataFim,
          aprovadoPorId: admin.id,
          motivoRecusa: null,
        },
      }),
      prisma.user.update({
        where: { id: assinatura.usuarioId },
        data: {
          role: assinatura.plano,
          planoExpiraEm: novaDataFim,
        },
      }),
      prisma.auditoriaLog.create({
        data: {
          usuarioResponsavelId: admin.id,
          usuarioAfetadoId: assinatura.usuarioId,
          tipoAcao: "APROVACAO_ASSINATURA",
          detalhes: `Assinatura ${assinatura.plano} de ${assinatura.usuario.name} aprovada até ${novaDataFim.toLocaleDateString("pt-BR")} (+${dias} dias).`,
        },
      }),
    ]);

    revalidatePath("/");
    return {
      success: true,
      novaDataFim,
      message: `Assinatura ${assinatura.plano} de ${assinatura.usuario.name} aprovada com sucesso!`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao aprovar assinatura." };
  }
}

export async function recusarAssinaturaAction(input: {
  assinaturaId: string;
  adminId: string;
  motivoRecusa: string;
}) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Apenas Super Admin pode recusar assinaturas." };
    }

    if (!input.motivoRecusa || !input.motivoRecusa.trim()) {
      return { success: false, error: "Informe o motivo da recusa do comprovante." };
    }

    const assinatura = await prisma.assinaturaPlano.findUnique({
      where: { id: input.assinaturaId },
      include: { usuario: true },
    });

    if (!assinatura) return { success: false, error: "Solicitação não encontrada." };

    await prisma.$transaction([
      prisma.assinaturaPlano.update({
        where: { id: assinatura.id },
        data: {
          status: "RECUSADO",
          motivoRecusa: input.motivoRecusa,
          aprovadoPorId: admin.id,
        },
      }),
      prisma.auditoriaLog.create({
        data: {
          usuarioResponsavelId: admin.id,
          usuarioAfetadoId: assinatura.usuarioId,
          tipoAcao: "RECUSA_ASSINATURA",
          detalhes: `Comprovante de assinatura recusado para ${assinatura.usuario.name}. Motivo: ${input.motivoRecusa}`,
        },
      }),
    ]);

    revalidatePath("/");
    return { success: true, message: "Solicitação recusada com sucesso." };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao recusar solicitação." };
  }
}

export async function renovarAssinaturaManualAction(input: {
  usuarioId: string;
  adminId: string;
  plano?: "PRO" | "PRO_MASTER";
  diasAdicionais?: number;
  observacoes?: string;
}) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Apenas Super Admin pode renovar assinaturas manualmente." };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!targetUser) return { success: false, error: "Usuário não encontrado." };

    const targetPlano = input.plano || (targetUser.role === "PRO_MASTER" ? "PRO_MASTER" : "PRO");
    const dias = input.diasAdicionais || 30;
    const agora = new Date();
    const novaDataFim = calcularNovaDataExpiracao(targetUser.planoExpiraEm, dias);
    const valor = targetPlano === "PRO" ? 19.9 : 29.9;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUser.id },
        data: {
          role: targetPlano,
          planoExpiraEm: novaDataFim,
        },
      }),
      prisma.assinaturaPlano.create({
        data: {
          usuarioId: targetUser.id,
          plano: targetPlano,
          valor,
          mesesVigencia: Math.round(dias / 30) || 1,
          status: "APROVADO",
          dataInicio: agora,
          dataFim: novaDataFim,
          aprovadoPorId: admin.id,
          observacoes: input.observacoes || `Renovação manual concedida por Marcos Batista (+${dias} dias).`,
        },
      }),
      prisma.auditoriaLog.create({
        data: {
          usuarioResponsavelId: admin.id,
          usuarioAfetadoId: targetUser.id,
          tipoAcao: "RENOVACAO_ASSINATURA_MANUAL",
          detalhes: `Renovação de ${targetPlano} de ${targetUser.name} concedida até ${novaDataFim.toLocaleDateString("pt-BR")}.`,
          justificativa: input.observacoes,
        },
      }),
    ]);

    revalidatePath("/");
    return {
      success: true,
      novaDataFim,
      message: `Assinatura de ${targetUser.name} renovada até ${novaDataFim.toLocaleDateString("pt-BR")}!`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao renovar assinatura." };
  }
}

export async function cancelarAssinaturaAction(input: {
  usuarioId: string;
  adminId: string;
  motivo?: string;
}) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Apenas Super Admin pode cancelar assinaturas." };
    }

    const targetUser = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!targetUser) return { success: false, error: "Usuário não encontrado." };

    await prisma.$transaction([
      prisma.user.update({
        where: { id: targetUser.id },
        data: {
          role: "COMUM",
          planoExpiraEm: null,
        },
      }),
      prisma.assinaturaPlano.updateMany({
        where: { usuarioId: targetUser.id, status: "APROVADO" },
        data: { status: "CANCELADO" },
      }),
      prisma.auditoriaLog.create({
        data: {
          usuarioResponsavelId: admin.id,
          usuarioAfetadoId: targetUser.id,
          tipoAcao: "CANCELAMENTO_ASSINATURA",
          detalhes: `Assinatura de ${targetUser.name} cancelada pelo Super Admin. Retornado ao Plano Comum.`,
          justificativa: input.motivo,
        },
      }),
    ]);

    revalidatePath("/");
    return { success: true, message: `Assinatura de ${targetUser.name} cancelada com sucesso.` };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao cancelar assinatura." };
  }
}

export async function getPainelAssinaturasAction(adminId: string) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso restrito ao Super Admin." };
    }

    const [pendentes, todosUsuarios, historico, consorciosAtivos] = await Promise.all([
      prisma.assinaturaPlano.findMany({
        where: { status: "PENDENTE" },
        include: {
          usuario: {
            select: { id: true, name: true, email: true, telefone: true, role: true, planoExpiraEm: true },
          },
        },
        orderBy: { solicitadoEm: "desc" },
      }),
      prisma.user.findMany({
        where: { role: { in: ["PRO", "PRO_MASTER"] } },
        select: {
          id: true,
          name: true,
          email: true,
          telefone: true,
          role: true,
          planoExpiraEm: true,
          createdAt: true,
        },
        orderBy: { name: "asc" },
      }),
      prisma.assinaturaPlano.findMany({
        where: { status: { not: "PENDENTE" } },
        include: {
          usuario: { select: { id: true, name: true, email: true } },
          aprovadoPor: { select: { id: true, name: true } },
        },
        orderBy: { updatedAt: "desc" },
        take: 25,
      }),
      prisma.consorcio.findMany({
        where: { status: "ATIVO" },
        include: {
          criador: {
            select: { id: true, name: true, email: true, telefone: true, role: true, planoExpiraEm: true },
          },
          cotas: { select: { id: true, numero: true } },
          contribuicoes: {
            select: {
              id: true,
              numeroCiclo: true,
              dataVencimento: true,
              status: true,
              valorPrevisto: true,
            },
            orderBy: { dataVencimento: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    // Métricas SaaS
    let mrrEstimado = 0;
    let prestesAVencer = 0;
    let totalAtivos = 0;

    const assinantesFormatados = todosUsuarios.map((u) => {
      const vigencia = getVigenciaPlano(u);
      if (vigencia.isAtivo) {
        totalAtivos++;
        mrrEstimado += u.role === "PRO_MASTER" ? 29.9 : 19.9;
        if (vigencia.status === "A_VENCER") prestesAVencer++;
      }
      return {
        ...u,
        vigencia,
      };
    });

    // Mapeia consórcios com ciclo programado concluído (oportunidades de CS e Upgrade)
    const consorciosConcluidos = (consorciosAtivos || [])
      .map((c) => {
        const statusCiclo = analisarCicloConsorcio(c);
        if (!statusCiclo.isCicloConcluido) return null;

        const valorTotalPrevisto = (c.contribuicoes || []).reduce(
          (acc, cb) => acc + (cb.valorPrevisto || 0),
          0
        );
        const valorTotalArrecadado = (c.contribuicoes || [])
          .filter((cb) => cb.status === "PAGO")
          .reduce((acc, cb) => acc + (cb.valorPrevisto || 0), 0);

        const mensagemWhatsapp = gerarMensagemFollowupConsorcio({
          nomeCriador: c.criador?.name || "Organizador",
          nomeConsorcio: c.nome,
          isQuitado: statusCiclo.is100PorcentoQuitado,
          totalPendentes: statusCiclo.totalPendentes,
          planoCriador: (c.criador?.role as any) || "COMUM",
        });

        const linkWhatsapp = gerarLinkWhatsApp({
          telefone: c.criador?.telefone,
          mensagem: mensagemWhatsapp,
        });

        return {
          id: c.id,
          nome: c.nome,
          status: c.status,
          frequencia: c.frequencia,
          totalCotas: c.totalCotas,
          criador: c.criador,
          statusCiclo,
          valorTotalPrevisto,
          valorTotalArrecadado,
          mensagemWhatsapp,
          linkWhatsapp,
        };
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    return {
      success: true,
      data: {
        solicitacoesPendentes: pendentes,
        assinantes: assinantesFormatados,
        historico,
        consorciosConcluidos,
        metricas: {
          totalAssinantesAtivos: totalAtivos,
          totalPendentes: pendentes.length,
          mrrEstimado,
          prestesAVencer,
          totalCiclosConcluidos: consorciosConcluidos.length,
          totalCiclosQuitados: consorciosConcluidos.filter((c) => c.statusCiclo.is100PorcentoQuitado).length,
          totalCiclosComPendencias: consorciosConcluidos.filter((c) => !c.statusCiclo.is100PorcentoQuitado).length,
        },
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao buscar dados de assinaturas." };
  }
}

export async function getConsorciosCicloConcluidoAction(adminId: string) {
  try {
    const admin = await prisma.user.findUnique({ where: { id: adminId } });
    if (!admin || admin.role !== "SUPER_ADMIN") {
      return { success: false, error: "Acesso restrito ao Super Admin." };
    }

    const painelRes = await getPainelAssinaturasAction(adminId);
    if (!painelRes.success || !painelRes.data) {
      return { success: false, error: painelRes.error || "Falha ao consultar consórcios." };
    }

    return {
      success: true,
      data: painelRes.data.consorciosConcluidos,
      metricas: {
        totalCiclosConcluidos: painelRes.data.metricas.totalCiclosConcluidos,
        totalCiclosQuitados: painelRes.data.metricas.totalCiclosQuitados,
        totalCiclosComPendencias: painelRes.data.metricas.totalCiclosComPendencias,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao listar consórcios concluídos." };
  }
}

export async function getMinhaAssinaturaAction(usuarioId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: usuarioId },
      select: { id: true, name: true, email: true, role: true, planoExpiraEm: true },
    });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const vigencia = getVigenciaPlano(user);
    const pendente = await prisma.assinaturaPlano.findFirst({
      where: { usuarioId, status: "PENDENTE" },
      orderBy: { solicitadoEm: "desc" },
    });

    const ultimaAprovada = await prisma.assinaturaPlano.findFirst({
      where: { usuarioId, status: "APROVADO" },
      orderBy: { dataFim: "desc" },
    });

    return {
      success: true,
      data: {
        vigencia,
        pendente,
        ultimaAprovada,
      },
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao buscar assinatura." };
  }
}

// ==========================================
// CICLO DE VIDA DO CONSÓRCIO: ENCERRAMENTO, REATIVAÇÃO E EXCLUSÃO
// ==========================================

export async function encerrarConsorcioAction(input: {
  consorcioId: string;
  usuarioId: string;
  motivo?: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const consorcio = await prisma.consorcio.findUnique({ where: { id: input.consorcioId } });
    if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

    const isAutorizado =
      user.role === "SUPER_ADMIN" ||
      user.role === "PRO_MASTER" ||
      consorcio.criadorId === user.id;

    if (!isAutorizado) {
      return { success: false, error: "Você não tem permissão para encerrar este consórcio." };
    }

    if (consorcio.status === "ENCERRADO") {
      return { success: false, error: "Este consórcio já está encerrado." };
    }

    await prisma.$transaction([
      prisma.consorcio.update({
        where: { id: consorcio.id },
        data: { status: "ENCERRADO" },
      }),
      prisma.auditoriaLog.create({
        data: {
          consorcioId: consorcio.id,
          usuarioResponsavelId: user.id,
          tipoAcao: "ENCERRAMENTO_CONSORCIO",
          detalhes: `Consórcio "${consorcio.nome}" foi encerrado por ${user.name}. Status alterado para Somente Leitura.`,
          justificativa: input.motivo || "Encerramento do consórcio pelo organizador.",
        },
      }),
    ]);

    revalidatePath("/");
    return {
      success: true,
      message: `O consórcio "${consorcio.nome}" foi encerrado com sucesso. Todo o histórico foi preservado como somente leitura.`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao encerrar consórcio." };
  }
}

export async function reativarConsorcioAction(input: {
  consorcioId: string;
  usuarioId: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const consorcio = await prisma.consorcio.findUnique({
      where: { id: input.consorcioId },
      include: { criador: true },
    });
    if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

    const isAutorizado =
      user.role === "SUPER_ADMIN" ||
      user.role === "PRO_MASTER" ||
      consorcio.criadorId === user.id;

    if (!isAutorizado) {
      return { success: false, error: "Você não tem permissão para reativar este consórcio." };
    }

    if (consorcio.status === "ATIVO") {
      return { success: false, error: "Este consórcio já está ativo." };
    }

    const criador = consorcio.criador;
    const vigencia = getVigenciaPlano(criador);

    // Validação de limites na reativação
    if (criador.role === "PRO") {
      if (!vigencia.isAtivo) {
        return {
          success: false,
          error: `Sua assinatura do Plano Pro expirou em ${vigencia.dataExpiracaoFormatada}. Para reativar consórcios, renove sua assinatura via Pix para Marcos Batista (markos.system@gmail.com).`,
        };
      }
      const consorciosAtivos = await prisma.consorcio.count({
        where: { criadorId: criador.id, status: "ATIVO" },
      });
      if (consorciosAtivos >= 3) {
        return {
          success: false,
          error: "Você já possui 3 consórcios ativos no Plano Pro. Para reativar este, encerre outro consórcio ou migre para o Plano Pro Master.",
        };
      }
    } else if (criador.role === "PRO_MASTER") {
      if (!vigencia.isAtivo) {
        return {
          success: false,
          error: `Sua assinatura do Plano Pro Master expirou em ${vigencia.dataExpiracaoFormatada}. Para reativar consórcios, renove sua assinatura via Pix para Marcos Batista (markos.system@gmail.com).`,
        };
      }
    } else if (criador.role === "COMUM") {
      const consorciosAtivos = await prisma.consorcio.count({
        where: { criadorId: criador.id, status: "ATIVO" },
      });
      if (consorciosAtivos >= 1) {
        return {
          success: false,
          error: "Você já possui 1 consórcio ativo no Plano Comum. Para gerenciar mais grupos simultâneos, migre para o Plano Pro.",
        };
      }
    }

    await prisma.$transaction([
      prisma.consorcio.update({
        where: { id: consorcio.id },
        data: { status: "ATIVO" },
      }),
      prisma.auditoriaLog.create({
        data: {
          consorcioId: consorcio.id,
          usuarioResponsavelId: user.id,
          tipoAcao: "REATIVACAO_CONSORCIO",
          detalhes: `Consórcio "${consorcio.nome}" foi reativado por ${user.name}.`,
        },
      }),
    ]);

    revalidatePath("/");
    return {
      success: true,
      message: `Consórcio "${consorcio.nome}" reativado com sucesso!`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao reativar consórcio." };
  }
}

export async function excluirConsorcioAction(input: {
  consorcioId: string;
  usuarioId: string;
  confirmacaoNome: string;
}) {
  try {
    const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
    if (!user) return { success: false, error: "Usuário não encontrado." };

    const consorcio = await prisma.consorcio.findUnique({ where: { id: input.consorcioId } });
    if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

    const isAutorizado = user.role === "SUPER_ADMIN" || consorcio.criadorId === user.id;
    if (!isAutorizado) {
      return { success: false, error: "Apenas o criador ou o Super Admin pode excluir este consórcio." };
    }

    if (input.confirmacaoNome.trim().toLowerCase() !== consorcio.nome.trim().toLowerCase()) {
      return {
        success: false,
        error: `Para confirmar a exclusão, você deve digitar o nome exato do consórcio: "${consorcio.nome}".`,
      };
    }

    // Regra de Ouro: consórcio com qualquer pagamento confirmado NUNCA pode ser excluído fisicamente
    const pagamentosConfirmados = await prisma.contribuicao.count({
      where: {
        consorcioId: consorcio.id,
        status: "PAGO",
      },
    });

    if (pagamentosConfirmados > 0) {
      return {
        success: false,
        error: "Este consórcio já possui pagamentos confirmados e não pode ser excluído para garantir a integridade financeira e a prestação de contas dos cotistas. Utilize a opção 'Encerrar Consórcio' para arquivá-lo com segurança.",
      };
    }

    const nomeConsorcio = consorcio.nome;

    // Se for teste/rascunho sem pagamentos, realiza a exclusão física
    await prisma.$transaction([
      prisma.auditoriaLog.create({
        data: {
          usuarioResponsavelId: user.id,
          tipoAcao: "EXCLUSAO_CONSORCIO_TESTE",
          detalhes: `Consórcio de teste "${nomeConsorcio}" sem pagamentos foi excluído definitivamente por ${user.name}.`,
          justificativa: "Exclusão de consórcio teste/rascunho sem movimentação financeira.",
        },
      }),
      prisma.consorcio.delete({
        where: { id: consorcio.id },
      }),
    ]);

    revalidatePath("/");
    return {
      success: true,
      message: `O consórcio "${nomeConsorcio}" foi excluído com sucesso. Como não possuía pagamentos, sua vaga de degustação foi liberada!`,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Erro ao excluir consórcio." };
  }
}




