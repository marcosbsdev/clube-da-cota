import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import {
  analisarCicloConsorcio,
  gerarMensagemFollowupConsorcio,
  gerarLinkWhatsApp,
} from "../src/lib/finance.ts";

const prisma = new PrismaClient();

console.log("🧪 Iniciando testes do Radar de Consórcios Concluídos, Follow-up e CRM de Upgrade...\n");

// Teste 1: Consórcio em andamento (último vencimento no futuro)
{
  const futuro = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  const status = analisarCicloConsorcio({
    contribuicoes: [
      { numeroCiclo: 1, dataVencimento: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), status: "PAGO" },
      { numeroCiclo: 2, dataVencimento: futuro, status: "PENDENTE" },
    ],
  });

  assert.strictEqual(status.isCicloConcluido, false);
  assert.strictEqual(status.diasDecorridos, 0);
  assert.strictEqual(status.totalContribuicoes, 2);
  assert.strictEqual(status.totalPagas, 1);
  assert.strictEqual(status.totalPendentes, 1);
  assert.strictEqual(status.is100PorcentoQuitado, false);
  assert.strictEqual(status.porcentagemQuitado, 50);

  console.log("✅ Teste 1: Consórcio em andamento detectado corretamente como NÃO concluído.");
}

// Teste 2: Consórcio com último vencimento no passado e 100% quitado
{
  const passado10Dias = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
  const passado40Dias = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);

  const status = analisarCicloConsorcio({
    contribuicoes: [
      { numeroCiclo: 1, dataVencimento: passado40Dias, status: "PAGO" },
      { numeroCiclo: 2, dataVencimento: passado10Dias, status: "PAGO" },
    ],
  });

  assert.strictEqual(status.isCicloConcluido, true);
  assert.ok(status.diasDecorridos >= 9 && status.diasDecorridos <= 11);
  assert.strictEqual(status.totalContribuicoes, 2);
  assert.strictEqual(status.totalPagas, 2);
  assert.strictEqual(status.totalPendentes, 0);
  assert.strictEqual(status.is100PorcentoQuitado, true);
  assert.strictEqual(status.porcentagemQuitado, 100);

  console.log("✅ Teste 2: Consórcio com ciclo concluído e 100% quitado detectado com precisão.");
}

// Teste 3: Consórcio vencido mas com parcelas pendentes
{
  const passado5Dias = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
  const status = analisarCicloConsorcio({
    contribuicoes: [
      { numeroCiclo: 1, dataVencimento: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000), status: "PAGO" },
      { numeroCiclo: 2, dataVencimento: passado5Dias, status: "EM_ATRASO" },
    ],
  });

  assert.strictEqual(status.isCicloConcluido, true);
  assert.strictEqual(status.is100PorcentoQuitado, false);
  assert.strictEqual(status.totalPendentes, 1);
  assert.strictEqual(status.porcentagemQuitado, 50);

  console.log("✅ Teste 3: Consórcio vencido com parcelas pendentes identificado com sucesso.");
}

// Teste 4: Geração de Mensagem de Follow-up para Plano Comum (100% Quitado -> Sugere Encerramento ou Upgrade)
{
  const msgComum = gerarMensagemFollowupConsorcio({
    nomeCriador: "Carlos Eduardo Silva",
    nomeConsorcio: "Consórcio da Família",
    isQuitado: true,
    totalPendentes: 0,
    planoCriador: "COMUM",
  });

  assert.ok(msgComum.includes("Carlos"));
  assert.ok(msgComum.includes("Consórcio da Família"));
  assert.ok(msgComum.includes("100% quitados"));
  assert.ok(msgComum.includes("liberar sua vaga no Plano Comum"));
  assert.ok(msgComum.includes("upgrade para o Plano Pro"));

  console.log("✅ Teste 4: Mensagem de follow-up para Plano Comum quitado aprovada.");
}

// Teste 5: Geração de Mensagem de Follow-up para Plano Pro (100% Quitado)
{
  const msgPro = gerarMensagemFollowupConsorcio({
    nomeCriador: "Mariana Costa",
    nomeConsorcio: "Grupo Amigos da Obra",
    isQuitado: true,
    totalPendentes: 0,
    planoCriador: "PRO",
  });

  assert.ok(msgPro.includes("Mariana"));
  assert.ok(msgPro.includes("Grupo Amigos da Obra"));
  assert.ok(msgPro.includes("liberar limite na sua assinatura Pro"));

  console.log("✅ Teste 5: Mensagem de follow-up para Plano Pro aprovada.");
}

// Teste 6: Geração de Mensagem de Apoio para Consórcio com Pendências
{
  const msgPendencias = gerarMensagemFollowupConsorcio({
    nomeCriador: "Roberto Santos",
    nomeConsorcio: "Viagem Fim de Ano",
    isQuitado: false,
    totalPendentes: 2,
    planoCriador: "COMUM",
  });

  assert.ok(msgPendencias.includes("Roberto"));
  assert.ok(msgPendencias.includes("Viagem Fim de Ano"));
  assert.ok(msgPendencias.includes("2 parcela(s) pendente(s)"));
  assert.ok(msgPendencias.includes("suporte"));

  console.log("✅ Teste 6: Mensagem de suporte para consórcio com pendências aprovada.");
}

// Teste 7: Geração de Link WhatsApp sanitizado com código DDI
{
  const urlWhatsapp = gerarLinkWhatsApp({
    telefone: "(11) 98765-4321",
    mensagem: "Mensagem de teste",
  });

  assert.strictEqual(
    urlWhatsapp,
    "https://wa.me/5511987654321?text=Mensagem%20de%20teste"
  );

  console.log("✅ Teste 7: Link do WhatsApp com DDI e sanitização de telefone aprovado.");
}

// Testes 8 e 9: Integração de banco de dados e ações administrativas
async function runIntegrationTests() {
  const ts = Date.now();
  const emailCriador = `criador_vencido_${ts}@test.com`;
  const emailAdmin = `admin_vencido_${ts}@test.com`;

  try {
    const criador = await prisma.user.create({
      data: {
        name: "Organizador Vencido Teste",
        email: emailCriador,
        telefone: "(11) 99999-1234",
        role: "COMUM",
        passwordHash: "hash_teste",
      },
    });

    const superAdmin = await prisma.user.create({
      data: {
        name: "Super Admin Teste",
        email: emailAdmin,
        telefone: "(11) 96303-0266",
        role: "SUPER_ADMIN",
        passwordHash: "hash_teste",
      },
    });

    const consorcioVencido = await prisma.consorcio.create({
      data: {
        nome: `Consórcio Concluído ${ts}`,
        finalidade: "Consórcio para teste de follow-up",
        valorCota: 200,
        valorTotalBolada: 400,
        totalCotas: 2,
        dataInicio: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        dataPrimeiroVencimento: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        status: "ATIVO",
        criadorId: criador.id,
      },
    });

    const cota1 = await prisma.cota.create({
      data: { consorcioId: consorcioVencido.id, numero: 1, status: "CONTEMPLADA" },
    });
    const cota2 = await prisma.cota.create({
      data: { consorcioId: consorcioVencido.id, numero: 2, status: "CONTEMPLADA" },
    });

    // Contribuições no passado quitadas
    await prisma.contribuicao.create({
      data: {
        consorcioId: consorcioVencido.id,
        cotaId: cota1.id,
        usuarioId: criador.id,
        numeroCiclo: 1,
        valorPrevisto: 200,
        dataVencimento: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000),
        status: "PAGO",
      },
    });

    await prisma.contribuicao.create({
      data: {
        consorcioId: consorcioVencido.id,
        cotaId: cota2.id,
        usuarioId: criador.id,
        numeroCiclo: 2,
        valorPrevisto: 200,
        dataVencimento: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        status: "PAGO",
      },
    });

    // Funções simuladas da Server Action
    async function buscarConsorciosConcluidosAdmin(adminId) {
      const admin = await prisma.user.findUnique({ where: { id: adminId } });
      if (!admin || admin.role !== "SUPER_ADMIN") {
        return { success: false, error: "Acesso restrito ao Super Admin." };
      }

      const consorciosAtivos = await prisma.consorcio.findMany({
        where: { status: "ATIVO" },
        include: {
          criador: {
            select: { id: true, name: true, email: true, telefone: true, role: true, planoExpiraEm: true },
          },
          cotas: { select: { id: true, numero: true } },
          contribuicoes: {
            select: { id: true, numeroCiclo: true, dataVencimento: true, status: true, valorPrevisto: true },
            orderBy: { dataVencimento: "asc" },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const consorciosConcluidos = consorciosAtivos
        .map((c) => {
          const statusCiclo = analisarCicloConsorcio(c);
          if (!statusCiclo.isCicloConcluido) return null;

          const mensagemWhatsapp = gerarMensagemFollowupConsorcio({
            nomeCriador: c.criador?.name || "Organizador",
            nomeConsorcio: c.nome,
            isQuitado: statusCiclo.is100PorcentoQuitado,
            totalPendentes: statusCiclo.totalPendentes,
            planoCriador: c.criador?.role || "COMUM",
          });

          const linkWhatsapp = gerarLinkWhatsApp({
            telefone: c.criador?.telefone,
            mensagem: mensagemWhatsapp,
          });

          return {
            id: c.id,
            nome: c.nome,
            status: c.status,
            criador: c.criador,
            statusCiclo,
            mensagemWhatsapp,
            linkWhatsapp,
          };
        })
        .filter(Boolean);

      return { success: true, data: consorciosConcluidos };
    }

    async function encerrarConsorcioAdmin(input) {
      const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
      if (!user) return { success: false, error: "Usuário não encontrado." };

      const consorcio = await prisma.consorcio.findUnique({ where: { id: input.consorcioId } });
      if (!consorcio) return { success: false, error: "Consórcio não encontrado." };

      const isAutorizado =
        user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER" || consorcio.criadorId === user.id;
      if (!isAutorizado) return { success: false, error: "Sem permissão." };

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

      return { success: true };
    }

    // Teste 8: Validação de que consórcio vencido é retornado no radar do painel
    const resBloqueioComum = await buscarConsorciosConcluidosAdmin(criador.id);
    assert.strictEqual(resBloqueioComum.success, false);

    const resPainel = await buscarConsorciosConcluidosAdmin(superAdmin.id);
    assert.strictEqual(resPainel.success, true);
    assert.ok(resPainel.data.length >= 1);

    const encontrado = resPainel.data.find((c) => c.id === consorcioVencido.id);
    assert.ok(encontrado);
    assert.strictEqual(encontrado.statusCiclo.isCicloConcluido, true);
    assert.strictEqual(encontrado.statusCiclo.is100PorcentoQuitado, true);
    assert.ok(encontrado.linkWhatsapp.includes("wa.me"));

    console.log("✅ Teste 8: Radar do Super Admin identificou o consórcio vencido e gerou mensagem de CRM.");

    // Teste 9: Super Admin encerra consórcio concluído e libera vaga no Modelo A
    const resEncerramento = await encerrarConsorcioAdmin({
      consorcioId: consorcioVencido.id,
      usuarioId: superAdmin.id,
      motivo: "Encerramento acordado via WhatsApp com o organizador.",
    });

    assert.strictEqual(resEncerramento.success, true);

    const consorcioApos = await prisma.consorcio.findUnique({
      where: { id: consorcioVencido.id },
    });
    assert.strictEqual(consorcioApos.status, "ENCERRADO");

    // Verifica que o criador Comum agora possui 0 consórcios ativos e tem vaga liberada
    const ativosDoCriador = await prisma.consorcio.count({
      where: { criadorId: criador.id, status: "ATIVO" },
    });
    assert.strictEqual(ativosDoCriador, 0);

    console.log("✅ Teste 9: Super Admin encerrou consórcio e liberou vaga para o usuário Comum no Modelo A.");

    // Limpeza de registros de teste
    await prisma.auditoriaLog.deleteMany({ where: { consorcioId: consorcioVencido.id } });
    await prisma.contribuicao.deleteMany({ where: { consorcioId: consorcioVencido.id } });
    await prisma.cota.deleteMany({ where: { consorcioId: consorcioVencido.id } });
    await prisma.consorcio.delete({ where: { id: consorcioVencido.id } });
    await prisma.user.delete({ where: { id: criador.id } });
    await prisma.user.delete({ where: { id: superAdmin.id } });

    console.log("✅ Teste 10: Limpeza de dados de teste concluída com sucesso.");
  } catch (err) {
    console.error("❌ Falha nos testes de integração:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

await runIntegrationTests();

console.log("\n🎉 Todos os 10 testes do Radar de Consórcios Concluídos passaram com 100% de sucesso!");
