import assert from "node:assert";
import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { formatarTelefone } from "../src/lib/finance.ts";

const prisma = new PrismaClient();

// Funções de regra de negócio correspondentes às Server Actions
async function executarAtualizacaoParticipante(input) {
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

  const targetUser = await prisma.user.findUnique({ where: { id: input.targetUserId } });
  if (!targetUser) return { success: false, error: "Participante não encontrado." };

  const nomeLimpo = input.nome?.trim();
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

  return {
    success: true,
    message: `Dados cadastrais de ${nomeLimpo} atualizados com sucesso!`,
    usuario: usuarioAtualizado,
  };
}

async function executarSubstituicaoParticipante(input) {
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
  let novoUsuario = null;

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
      ? input.email.trim().toLowerCase()
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

  // 1. Gera novo Token de Acesso exclusivo para o novo titular
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

  return {
    success: true,
    message: `Cota #${cota.numero} repassada com sucesso para ${novoUsuario.name}!`,
    novoToken: novoTokenAcesso,
    cotaNumero: cota.numero,
    novoUsuario,
  };
}

async function runTests() {
  console.log("🧪 Iniciando testes de Edição e Substituição/Repasse de Participantes...\n");

  let consorcio = await prisma.consorcio.findFirst({
    where: { status: "ATIVO" },
    include: {
      criador: true,
      cotas: {
        include: {
          participantes: { include: { usuario: true } },
          contribuicoes: true,
        },
        orderBy: { numero: "asc" },
      },
    },
  });

  let consorcioCriadoNesteTeste = false;
  let participanteCriadoNesteTeste = false;

  if (!consorcio || consorcio.cotas.length === 0) {
    let criador = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!criador) {
      criador = await prisma.user.findFirst();
    }

    const participanteAntigo = await prisma.user.create({
      data: {
        name: "Participante Teste Repasse",
        email: `part_repasse_${Date.now()}@test.local`,
        role: "COMUM",
        isActivated: true,
      },
    });
    participanteCriadoNesteTeste = true;

    consorcio = await prisma.consorcio.create({
      data: {
        nome: "Consórcio Teste Repasse",
        valorCota: 100,
        valorTotalBolada: 500,
        totalCotas: 5,
        criadorId: criador.id,
        dataInicio: new Date(),
        dataPrimeiroVencimento: new Date(),
        cotas: {
          create: {
            numero: 1,
            ordemSorteio: 1,
            participantes: {
              create: {
                usuarioId: participanteAntigo.id,
                percentual: 100,
                valorParcela: 100,
              },
            },
          },
        },
      },
      include: {
        criador: true,
        cotas: {
          include: {
            participantes: { include: { usuario: true } },
            contribuicoes: true,
          },
          orderBy: { numero: "asc" },
        },
      },
    });

    await prisma.contribuicao.create({
      data: {
        consorcioId: consorcio.id,
        cotaId: consorcio.cotas[0].id,
        usuarioId: participanteAntigo.id,
        numeroCiclo: 1,
        valorPrevisto: 100,
        dataVencimento: new Date(),
        status: "PENDENTE",
      },
    });

    // Re-busca com contribuições
    consorcio = await prisma.consorcio.findUnique({
      where: { id: consorcio.id },
      include: {
        criador: true,
        cotas: {
          include: {
            participantes: { include: { usuario: true } },
            contribuicoes: true,
          },
          orderBy: { numero: "asc" },
        },
      },
    });

    consorcioCriadoNesteTeste = true;
  }

  const criador = consorcio.criador;
  const cotaAlvo = consorcio.cotas[0];
  const participanteVinculo = cotaAlvo.participantes[0];
  const participanteAntigo = participanteVinculo.usuario;

  let usuarioComum = await prisma.user.findFirst({
    where: {
      id: { notIn: [criador.id, participanteAntigo.id] },
      role: "COMUM",
    },
  });

  if (!usuarioComum) {
    usuarioComum = await prisma.user.create({
      data: {
        name: "Usuario Comum Sem Poder",
        email: `comum_${Date.now()}@test.local`,
        role: "COMUM",
        isActivated: false,
      },
    });
  }

  // Teste 1: Bloqueio de autorização para edição de participante por não-gestor
  console.log("Testando bloqueio de edição por usuário comum...");
  const resBloqueioEdicao = await executarAtualizacaoParticipante({
    consorcioId: consorcio.id,
    targetUserId: participanteAntigo.id,
    gestorUserId: usuarioComum.id,
    nome: "Hacker Tentativa",
  });
  assert.strictEqual(resBloqueioEdicao.success, false, "Usuário comum não pode ter permissão de edição");
  assert.ok(
    resBloqueioEdicao.error?.includes("permissão"),
    "Mensagem de erro deve indicar ausência de permissão"
  );
  console.log("✅ Teste 1: Bloqueio de edição por usuário sem privilégios aprovado.");

  // Teste 2: Bloqueio de autorização para substituição por não-gestor
  console.log("Testando bloqueio de repasse por usuário comum...");
  const resBloqueioRepasse = await executarSubstituicaoParticipante({
    consorcioId: consorcio.id,
    cotaId: cotaAlvo.id,
    participanteAntigoId: participanteAntigo.id,
    gestorUserId: usuarioComum.id,
    modoNovoParticipante: "NOVO",
    nome: "Novo Fake",
    aPartirDoCiclo: 1,
    justificativa: "Repasse indevido",
  });
  assert.strictEqual(resBloqueioRepasse.success, false, "Usuário comum não pode ter permissão de substituição");
  console.log("✅ Teste 2: Bloqueio de repasse por usuário sem privilégios aprovado.");

  // Teste 3: Edição de dados cadastrais pelo criador com auditoria
  console.log("Testando edição de dados cadastrais (Nome, Telefone, Chave Pix) pelo criador...");
  const nomeOriginal = participanteAntigo.name;
  const telefoneOriginal = participanteAntigo.telefone;

  const resEdicao = await executarAtualizacaoParticipante({
    consorcioId: consorcio.id,
    targetUserId: participanteAntigo.id,
    gestorUserId: criador.id,
    nome: `${nomeOriginal} Atualizado`,
    telefone: "11999887766",
    tipoChavePix: "CELULAR",
    chavePix: "11999887766",
    receberPixDireto: true,
  });

  assert.strictEqual(resEdicao.success, true, `Edição falhou: ${resEdicao.error}`);
  assert.strictEqual(resEdicao.usuario?.name, `${nomeOriginal} Atualizado`);
  assert.strictEqual(resEdicao.usuario?.telefone, "(11) 99988-7766");
  assert.strictEqual(resEdicao.usuario?.receberPixDireto, true);

  // Verifica registro de auditoria gerado
  const logEdicao = await prisma.auditoriaLog.findFirst({
    where: {
      consorcioId: consorcio.id,
      tipoAcao: "EDICAO_DADOS_PARTICIPANTE",
      usuarioAfetadoId: participanteAntigo.id,
    },
    orderBy: { createdAt: "desc" },
  });

  assert.ok(logEdicao, "Log de auditoria para EDICAO_DADOS_PARTICIPANTE deve existir");
  const detalhesEdicao = JSON.parse(logEdicao.detalhes);
  assert.strictEqual(detalhesEdicao.novoNome, `${nomeOriginal} Atualizado`);
  assert.strictEqual(detalhesEdicao.depois.telefone, "(11) 99988-7766");
  console.log("✅ Teste 3: Edição cadastral e trilha de auditoria aprovadas.");

  // Restaura nome para integridade
  await prisma.user.update({
    where: { id: participanteAntigo.id },
    data: { name: nomeOriginal, telefone: telefoneOriginal },
  });

  // Teste 4: Rejeição de substituição com justificativa ausente ou curta
  console.log("Testando obrigatoriedade da justificativa na substituição...");
  const resSemJustificativa = await executarSubstituicaoParticipante({
    consorcioId: consorcio.id,
    cotaId: cotaAlvo.id,
    participanteAntigoId: participanteAntigo.id,
    gestorUserId: criador.id,
    modoNovoParticipante: "NOVO",
    nome: "Novo Candidato",
    aPartirDoCiclo: 1,
    justificativa: "oi", // muito curta (< 5 chars)
  });
  assert.strictEqual(resSemJustificativa.success, false, "Justificativa curta deve ser rejeitada");
  console.log("✅ Teste 4: Validação de justificativa obrigatória aprovada.");

  // Teste 5: Substituição de participante (Repasse de Cota) para Novo Usuário
  console.log("Testando substituição de participante por novo titular com reatribuição de parcelas...");

  const tokenOriginal = participanteVinculo.tokenAcesso;
  const cicloCorte = 2; // a partir do ciclo 2

  const novoNome = `Novo Participante Teste ${Date.now()}`;
  const novoEmail = `titular_${Date.now()}@test.local`;
  const novoTelefone = "21988887777";

  const resRepasse = await executarSubstituicaoParticipante({
    consorcioId: consorcio.id,
    cotaId: cotaAlvo.id,
    participanteAntigoId: participanteAntigo.id,
    gestorUserId: criador.id,
    modoNovoParticipante: "NOVO",
    nome: novoNome,
    email: novoEmail,
    telefone: novoTelefone,
    tipoChavePix: "EMAIL",
    chavePix: novoEmail,
    receberPixDireto: true,
    aPartirDoCiclo: cicloCorte,
    justificativa: "Desistência por motivos pessoais acordada com o grupo.",
    acertoFinanceiroInfo: "Participante antigo recebeu acerto direto com o novo titular.",
  });

  assert.strictEqual(resRepasse.success, true, `Repasse falhou: ${resRepasse.error}`);
  assert.ok(resRepasse.novoToken, "Deve retornar novo token de acesso");
  assert.notStrictEqual(resRepasse.novoToken, tokenOriginal, "Novo token deve ser diferente do token antigo");

  // 5.1 Verifica se o vínculo CotaParticipante agora aponta para o novo usuário
  const vinculoAtualizado = await prisma.cotaParticipante.findUnique({
    where: { id: participanteVinculo.id },
    include: { usuario: true },
  });

  assert.strictEqual(vinculoAtualizado.usuario.name, novoNome, "Novo titular deve estar vinculado à cota");
  assert.strictEqual(vinculoAtualizado.usuario.telefone, "(21) 98888-7777", "Telefone deve estar devidamente mascarado");
  assert.strictEqual(vinculoAtualizado.tokenAcesso, resRepasse.novoToken, "Token da cota deve ser o novo token");

  // 5.2 Verifica se as parcelas foram divididas corretamente pelo ciclo de corte
  const parcelasAntigas = await prisma.contribuicao.findMany({
    where: {
      cotaId: cotaAlvo.id,
      usuarioId: participanteAntigo.id,
    },
    orderBy: { numeroCiclo: "asc" },
  });

  const parcelasNovas = await prisma.contribuicao.findMany({
    where: {
      cotaId: cotaAlvo.id,
      usuarioId: vinculoAtualizado.usuarioId,
    },
    orderBy: { numeroCiclo: "asc" },
  });

  for (const p of parcelasAntigas) {
    assert.ok(
      p.numeroCiclo < cicloCorte,
      `Parcela de ciclo ${p.numeroCiclo} não deveria mais pertencer ao participante antigo`
    );
  }

  for (const p of parcelasNovas) {
    assert.ok(
      p.numeroCiclo >= cicloCorte,
      `Parcela de ciclo ${p.numeroCiclo} deveria pertencer ao novo titular`
    );
  }

  // 5.3 Verifica o registro detalhado de auditoria
  const logRepasse = await prisma.auditoriaLog.findFirst({
    where: {
      consorcioId: consorcio.id,
      tipoAcao: "SUBSTITUICAO_PARTICIPANTE_COTA",
    },
    orderBy: { createdAt: "desc" },
  });

  assert.ok(logRepasse, "Deve existir log de auditoria de substituição");
  const detalhesRepasse = JSON.parse(logRepasse.detalhes);
  assert.strictEqual(detalhesRepasse.cotaNumero, cotaAlvo.numero);
  assert.strictEqual(detalhesRepasse.aPartirDoCiclo, cicloCorte);
  assert.strictEqual(detalhesRepasse.participanteAntigo.name, participanteAntigo.name);
  assert.strictEqual(detalhesRepasse.novoParticipante.name, novoNome);
  assert.strictEqual(
    detalhesRepasse.acertoFinanceiroInfo,
    "Participante antigo recebeu acerto direto com o novo titular."
  );
  assert.strictEqual(logRepasse.justificativa, "Desistência por motivos pessoais acordada com o grupo.");

  console.log("✅ Teste 5: Substituição por novo titular, corte de ciclos e log de auditoria aprovados.");

  // Teste 6: Substituição de volta para o participante original (Usuário Existente)
  console.log("Testando substituição de cota escolhendo usuário existente...");

  const resRepasseExistente = await executarSubstituicaoParticipante({
    consorcioId: consorcio.id,
    cotaId: cotaAlvo.id,
    participanteAntigoId: vinculoAtualizado.usuarioId,
    gestorUserId: criador.id,
    modoNovoParticipante: "EXISTENTE",
    novoUsuarioId: participanteAntigo.id,
    aPartirDoCiclo: 1,
    justificativa: "Retorno do participante titular original à cota.",
  });

  assert.strictEqual(resRepasseExistente.success, true, `Repasse existente falhou: ${resRepasseExistente.error}`);

  const vinculoRestaurado = await prisma.cotaParticipante.findUnique({
    where: { id: participanteVinculo.id },
  });
  assert.strictEqual(vinculoRestaurado.usuarioId, participanteAntigo.id, "Titular restaurado com sucesso");

  console.log("✅ Teste 6: Substituição utilizando participante existente aprovada.");

  // Teste 7: Rejeição ao tentar substituir pelo mesmo participante
  console.log("Testando rejeição de substituição para a mesma pessoa...");
  const resMesmaPessoa = await executarSubstituicaoParticipante({
    consorcioId: consorcio.id,
    cotaId: cotaAlvo.id,
    participanteAntigoId: participanteAntigo.id,
    gestorUserId: criador.id,
    modoNovoParticipante: "EXISTENTE",
    novoUsuarioId: participanteAntigo.id,
    aPartirDoCiclo: 1,
    justificativa: "Tentando substituir por si mesmo",
  });

  assert.strictEqual(resMesmaPessoa.success, false, "Deve rejeitar substituir participante por ele mesmo");
  assert.ok(resMesmaPessoa.error?.includes("diferente"));
  console.log("✅ Teste 7: Rejeição de substituição idêntica aprovada.");

  // Limpeza de dados gerados exclusivamente para este teste
  if (consorcioCriadoNesteTeste) {
    await prisma.consorcio.delete({ where: { id: consorcio.id } });
    if (participanteCriadoNesteTeste) {
      await prisma.user.delete({ where: { id: participanteAntigo.id } });
    }
  }

  console.log("\n🎉 Todos os 7 testes de Edição e Substituição de Participantes passaram com 100% de sucesso!");
}

runTests()
  .catch((err) => {
    console.error("❌ Erro durante execução dos testes:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
