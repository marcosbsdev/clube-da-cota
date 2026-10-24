import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import {
  getVigenciaPlano,
  calcularNovaDataExpiracao,
  PLANOS_INFO,
} from "../src/lib/plans.ts";

const prisma = new PrismaClient();

console.log("🧪 Iniciando testes do Módulo de Gerenciamento de Assinaturas e Planos SaaS...\n");

// Teste 1: Regras e cálculos de vigência de planos
{
  // Usuário COMUM
  const vigComum = getVigenciaPlano({ role: "COMUM" });
  assert.strictEqual(vigComum.status, "PERMANENTE");
  assert.strictEqual(vigComum.isAtivo, true);
  assert.strictEqual(vigComum.alertaRenovacao, false);

  // Usuário SUPER_ADMIN
  const vigAdmin = getVigenciaPlano({ role: "SUPER_ADMIN" });
  assert.strictEqual(vigAdmin.status, "PERMANENTE");
  assert.strictEqual(vigAdmin.isAtivo, true);
  assert.strictEqual(vigAdmin.alertaRenovacao, false);

  // Usuário PRO com planoExpiraEm nulo (fallback retrocompatível)
  const vigProSemData = getVigenciaPlano({ role: "PRO", planoExpiraEm: null });
  assert.strictEqual(vigProSemData.status, "VIGENTE");
  assert.strictEqual(vigProSemData.isAtivo, true);
  assert.strictEqual(vigProSemData.alertaRenovacao, false);

  // Usuário PRO com 20 dias restantes
  const daquiA20Dias = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000);
  const vigPro20Dias = getVigenciaPlano({ role: "PRO", planoExpiraEm: daquiA20Dias });
  assert.strictEqual(vigPro20Dias.status, "VIGENTE");
  assert.strictEqual(vigPro20Dias.isAtivo, true);
  assert.strictEqual(vigPro20Dias.alertaRenovacao, false);
  assert.strictEqual(vigPro20Dias.diasRestantes, 20);

  // Usuário PRO com 3 dias restantes (A_VENCER)
  const daquiA3Dias = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  const vigPro3Dias = getVigenciaPlano({ role: "PRO", planoExpiraEm: daquiA3Dias });
  assert.strictEqual(vigPro3Dias.status, "A_VENCER");
  assert.strictEqual(vigPro3Dias.isAtivo, true);
  assert.strictEqual(vigPro3Dias.alertaRenovacao, true);
  assert.strictEqual(vigPro3Dias.diasRestantes, 3);

  // Usuário PRO com data no passado (EXPIRADO)
  const passado = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const vigProExpirado = getVigenciaPlano({ role: "PRO", planoExpiraEm: passado });
  assert.strictEqual(vigProExpirado.status, "EXPIRADO");
  assert.strictEqual(vigProExpirado.isAtivo, false);
  assert.strictEqual(vigProExpirado.alertaRenovacao, true);
  assert.strictEqual(vigProExpirado.diasRestantes, 0);

  console.log("✅ Teste 1: Regras matemáticas e estados de vigência de planos aprovados.");
}

// Teste 2: Cálculo seguro de nova data de expiração (+30 dias sem perda de saldo)
{
  const agora = new Date();
  const novaDataSemBase = calcularNovaDataExpiracao(null, 30);
  const diffDiasSemBase = Math.round(
    (novaDataSemBase.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
  );
  assert.strictEqual(diffDiasSemBase, 30);

  // Se o usuário ainda tem 10 dias restantes, somar 30 dias deve resultar em 40 dias
  const futuro10Dias = new Date(agora.getTime() + 10 * 24 * 60 * 60 * 1000);
  const novaDataComSaldo = calcularNovaDataExpiracao(futuro10Dias, 30);
  const diffDiasComSaldo = Math.round(
    (novaDataComSaldo.getTime() - agora.getTime()) / (1000 * 60 * 60 * 24)
  );
  assert.strictEqual(diffDiasComSaldo, 40);

  console.log("✅ Teste 2: Cálculo cumulativo de renovação de vigência aprovado.");
}

// Funções de simulação das ações administrativas para teste de integração
async function executarSolicitacaoAssinatura(input) {
  const user = await prisma.user.findUnique({ where: { id: input.usuarioId } });
  if (!user) return { success: false, error: "Usuário não encontrado." };

  const valor = input.plano === "PRO" ? 19.9 : 29.9;
  const pendente = await prisma.assinaturaPlano.findFirst({
    where: { usuarioId: user.id, status: "PENDENTE" },
  });

  let assinatura;
  if (pendente) {
    assinatura = await prisma.assinaturaPlano.update({
      where: { id: pendente.id },
      data: {
        plano: input.plano,
        valor,
        comprovanteNome: input.comprovanteNome,
        comprovanteUrl: input.comprovanteUrl,
        observacoes: input.observacoes,
        solicitadoEm: new Date(),
        status: "PENDENTE",
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

  await prisma.auditoriaLog.create({
    data: {
      usuarioResponsavelId: user.id,
      usuarioAfetadoId: user.id,
      tipoAcao: "SOLICITACAO_UPGRADE_PLANO",
      detalhes: `Solicitação do Plano ${input.plano} por R$ ${valor.toFixed(2)}.`,
    },
  });

  return { success: true, assinaturaId: assinatura.id };
}

async function executarAprovacaoAssinatura(input) {
  const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return { success: false, error: "Apenas Super Admin pode aprovar assinaturas." };
  }

  const assinatura = await prisma.assinaturaPlano.findUnique({
    where: { id: input.assinaturaId },
    include: { usuario: true },
  });
  if (!assinatura) return { success: false, error: "Assinatura não encontrada." };

  const dias = input.diasAdicionais || 30;
  const novaDataFim = calcularNovaDataExpiracao(assinatura.usuario.planoExpiraEm, dias);

  await prisma.$transaction([
    prisma.assinaturaPlano.update({
      where: { id: assinatura.id },
      data: {
        status: "APROVADO",
        dataInicio: new Date(),
        dataFim: novaDataFim,
        aprovadoPorId: admin.id,
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
        detalhes: `Assinatura ${assinatura.plano} aprovada até ${novaDataFim.toISOString()}.`,
      },
    }),
  ]);

  return { success: true, novaDataFim };
}

async function executarRenovacaoManual(input) {
  const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return { success: false, error: "Apenas Super Admin pode renovar assinaturas." };
  }

  const targetUser = await prisma.user.findUnique({ where: { id: input.usuarioId } });
  if (!targetUser) return { success: false, error: "Usuário não encontrado." };

  const targetPlano = input.plano || targetUser.role;
  const dias = input.diasAdicionais || 30;
  const novaDataFim = calcularNovaDataExpiracao(targetUser.planoExpiraEm, dias);
  const valor = targetPlano === "PRO" ? 19.9 : 29.9;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUser.id },
      data: { role: targetPlano, planoExpiraEm: novaDataFim },
    }),
    prisma.assinaturaPlano.create({
      data: {
        usuarioId: targetUser.id,
        plano: targetPlano,
        valor,
        mesesVigencia: 1,
        status: "APROVADO",
        dataInicio: new Date(),
        dataFim: novaDataFim,
        aprovadoPorId: admin.id,
        observacoes: input.observacoes,
      },
    }),
  ]);

  return { success: true, novaDataFim };
}

async function executarCancelamento(input) {
  const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return { success: false, error: "Apenas Super Admin." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: input.usuarioId },
      data: { role: "COMUM", planoExpiraEm: null },
    }),
    prisma.assinaturaPlano.updateMany({
      where: { usuarioId: input.usuarioId, status: "APROVADO" },
      data: { status: "CANCELADO" },
    }),
  ]);

  return { success: true };
}

async function executarRecusa(input) {
  const admin = await prisma.user.findUnique({ where: { id: input.adminId } });
  if (!admin || admin.role !== "SUPER_ADMIN") {
    return { success: false, error: "Apenas Super Admin." };
  }

  await prisma.assinaturaPlano.update({
    where: { id: input.assinaturaId },
    data: {
      status: "RECUSADO",
      motivoRecusa: input.motivoRecusa,
      aprovadoPorId: admin.id,
    },
  });

  return { success: true };
}

// Teste 3: Fluxo Completo no Banco de Dados
async function rodarTestesBanco() {
  try {
    // Localizar ou criar Super Admin (Marcos Batista)
    let admin = await prisma.user.findFirst({ where: { role: "SUPER_ADMIN" } });
    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: "Marcos Batista",
          email: `marcos.teste.${Date.now()}@gmail.com`,
          role: "SUPER_ADMIN",
          isActivated: true,
        },
      });
    }

    // Criar usuário comum para teste de assinatura
    const userTeste = await prisma.user.create({
      data: {
        name: "Carlos Teste Assinatura",
        email: `carlos.assinatura.${Date.now()}@teste.com`,
        role: "COMUM",
        isActivated: true,
        telefone: "(11) 99999-1234",
      },
    });

    // 1. Usuário solicita upgrade para PRO
    const resSolicitacao = await executarSolicitacaoAssinatura({
      usuarioId: userTeste.id,
      plano: "PRO",
      comprovanteNome: "comprovante_pix_1990.png",
      comprovanteUrl: "data:image/png;base64,mock",
      observacoes: "Transferência Pix realizada pelo Nubank",
    });

    assert.strictEqual(resSolicitacao.success, true);
    assert.ok(resSolicitacao.assinaturaId);

    // Checar se solicitação está PENDENTE
    const solicitacaoNoBanco = await prisma.assinaturaPlano.findUnique({
      where: { id: resSolicitacao.assinaturaId },
    });
    assert.strictEqual(solicitacaoNoBanco.status, "PENDENTE");
    assert.strictEqual(solicitacaoNoBanco.plano, "PRO");
    assert.strictEqual(solicitacaoNoBanco.valor, 19.9);

    console.log("✅ Teste 3.1: Solicitação de upgrade com comprovante Pix registrada com sucesso.");

    // 2. Super Admin aprova a solicitação (+30 dias)
    const resAprovacao = await executarAprovacaoAssinatura({
      assinaturaId: resSolicitacao.assinaturaId,
      adminId: admin.id,
      diasAdicionais: 30,
    });
    assert.strictEqual(resAprovacao.success, true);

    // Verificar se o usuário foi promovido para PRO e recebeu data de vigência
    const userAtualizado = await prisma.user.findUnique({ where: { id: userTeste.id } });
    assert.strictEqual(userAtualizado.role, "PRO");
    assert.ok(userAtualizado.planoExpiraEm !== null);

    const vigUser = getVigenciaPlano(userAtualizado);
    assert.strictEqual(vigUser.isAtivo, true);
    assert.strictEqual(vigUser.status, "VIGENTE");
    assert.strictEqual(vigUser.diasRestantes, 30);

    console.log("✅ Teste 3.2: Super Admin aprovou solicitação, ativou plano PRO e vigência de 30 dias.");

    // 3. Super Admin renova manualmente (+30 dias adicionais)
    const resRenovacao = await executarRenovacaoManual({
      usuarioId: userTeste.id,
      adminId: admin.id,
      diasAdicionais: 30,
      observacoes: "Renovação confirmada no extrato bancário",
    });
    assert.strictEqual(resRenovacao.success, true);

    const userRenovado = await prisma.user.findUnique({ where: { id: userTeste.id } });
    const vigRenovada = getVigenciaPlano(userRenovado);
    assert.strictEqual(vigRenovada.diasRestantes, 60);

    console.log("✅ Teste 3.3: Renovação manual acumulou +30 dias com sucesso (saldo de 60 dias).");

    // 4. Super Admin cancela a assinatura
    const resCancelamento = await executarCancelamento({
      usuarioId: userTeste.id,
      adminId: admin.id,
      motivo: "Solicitação do participante",
    });
    assert.strictEqual(resCancelamento.success, true);

    const userCancelado = await prisma.user.findUnique({ where: { id: userTeste.id } });
    assert.strictEqual(userCancelado.role, "COMUM");
    assert.strictEqual(userCancelado.planoExpiraEm, null);

    console.log("✅ Teste 3.4: Cancelamento de assinatura retornou usuário para COMUM e limpou vigência.");

    // 5. Teste de Recusa de solicitação com justificativa
    const resNovaSolicitacao = await executarSolicitacaoAssinatura({
      usuarioId: userTeste.id,
      plano: "PRO_MASTER",
      comprovanteNome: "recibo_invalido.png",
    });
    assert.strictEqual(resNovaSolicitacao.success, true);

    const resRecusa = await executarRecusa({
      assinaturaId: resNovaSolicitacao.assinaturaId,
      adminId: admin.id,
      motivoRecusa: "Valor transferido não corresponde ao plano Pro Master (R$ 29,90).",
    });
    assert.strictEqual(resRecusa.success, true);

    const assinaturaRecusada = await prisma.assinaturaPlano.findUnique({
      where: { id: resNovaSolicitacao.assinaturaId },
    });
    assert.strictEqual(assinaturaRecusada.status, "RECUSADO");
    assert.ok(assinaturaRecusada.motivoRecusa.includes("29,90"));

    console.log("✅ Teste 3.5: Recusa de comprovante com justificativa registrada com sucesso.");

    // Limpeza do usuário de teste
    await prisma.assinaturaPlano.deleteMany({ where: { usuarioId: userTeste.id } });
    await prisma.auditoriaLog.deleteMany({ where: { usuarioAfetadoId: userTeste.id } });
    await prisma.user.delete({ where: { id: userTeste.id } });

    console.log("\n🎉 Todos os testes do Módulo de Assinaturas e Planos SaaS passaram com 100% de sucesso!");
  } catch (error) {
    console.error("❌ Erro nos testes do banco:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rodarTestesBanco();
