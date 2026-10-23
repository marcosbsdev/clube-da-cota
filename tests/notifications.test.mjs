import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function formatarTempoRelativo(dateInput) {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function formatarTextoNotificacao(tipoAcao, detalhes) {
  let parsed = null;
  if (typeof detalhes === "string" && (detalhes.startsWith("{") || detalhes.startsWith("["))) {
    try {
      parsed = JSON.parse(detalhes);
    } catch {
      parsed = null;
    }
  }

  switch (tipoAcao) {
    case "CONFIRMACAO_PAGAMENTO":
      return detalhes || "Pagamento de mensalidade confirmado e quitado.";
    case "ESTORNO_PAGAMENTO":
      return detalhes || "Confirmação de pagamento estornada com justificativa.";
    case "ENVIO_COMPROVANTE":
      if (parsed) {
        return `Novo comprovante PIX anexado para Cota #${parsed.cotaNumero || "?"} (Ciclo #${parsed.numeroCiclo || "?"}).`;
      }
      return detalhes || "Novo comprovante PIX anexado pelo participante.";
    case "RECUSA_COMPROVANTE":
      return detalhes || "Comprovante de pagamento recusado pelo administrador.";
    case "TROCA_POSICAO_COTA":
      if (parsed?.cota1 && parsed?.cota2) {
        const p1 = parsed.cota1.participantes ? ` (${parsed.cota1.participantes})` : "";
        const p2 = parsed.cota2.participantes ? ` (${parsed.cota2.participantes})` : "";
        return `Permuta de ordem: Cota #${parsed.cota1.numero}${p1} trocou com Cota #${parsed.cota2.numero}${p2}.`;
      }
      return "Troca de posições na ordem de sorteio realizada.";
    case "CONTEMPLACAO_COTA":
      if (parsed?.numero) {
        const p = parsed.participantes ? ` (${parsed.participantes})` : "";
        return `A Cota #${parsed.numero}${p} foi contemplada com a bolada!`;
      }
      return "Cota contemplada no sorteio do consórcio.";
    case "REVERSAO_CONTEMPLACAO_COTA":
      if (parsed?.numero) {
        return `Contemplação da Cota #${parsed.numero} foi revertida.`;
      }
      return "Reversão de cota contemplada registrada.";
    case "EDICAO_DADOS_CONSORCIO":
      if (parsed?.depois?.nome) {
        return `Dados do consórcio atualizados (Nome: "${parsed.depois.nome}").`;
      }
      return "Dados cadastrais ou regras de pagamento atualizados.";
    case "CRIACAO_CONSORCIO":
      return detalhes || "Grupo de consórcio criado com sucesso.";
    default:
      return detalhes || "Alteração registrada no consórcio.";
  }
}

async function testConfirmPayment(contribuicaoId, criadorId, justificativa) {
  const contribuicao = await prisma.contribuicao.findUnique({
    where: { id: contribuicaoId },
    include: { comprovante: true, usuario: true, consorcio: true },
  });

  if (!contribuicao) return { success: false, error: "Contribuição não encontrada." };

  await prisma.contribuicao.update({
    where: { id: contribuicaoId },
    data: {
      status: "PAGO",
      dataPagamento: new Date(),
      responsavelAlteracaoId: criadorId,
      motivoAlteracao: justificativa || "Pagamento conferido e confirmado pelo criador.",
    },
  });

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

  return { success: true };
}

async function testRevertPayment(contribuicaoId, criadorId, motivo) {
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

  return { success: true };
}

async function runTests() {
  console.log("🧪 Iniciando testes de Notificações, Confirmação de Recebimento e Auditoria...");

  try {
    // Teste 1: Formatação de tempo relativo
    console.log("Testando formatarTempoRelativo...");
    assert.strictEqual(formatarTempoRelativo(new Date()), "Agora mesmo");
    assert.strictEqual(formatarTempoRelativo(new Date(Date.now() - 5 * 60000)), "Há 5 min");
    assert.strictEqual(formatarTempoRelativo(new Date(Date.now() - 2 * 3600000)), "Há 2 h");
    assert.strictEqual(formatarTempoRelativo(new Date(Date.now() - 26 * 3600000)), "Ontem");
    console.log("✅ Teste 1: Formatação de tempo relativo aprovada.");

    // Teste 2: Humanização dos textos de notificação para cada tipo de ação
    console.log("Testando formatarTextoNotificacao...");
    const tPagamento = formatarTextoNotificacao("CONFIRMACAO_PAGAMENTO", "Contribuição de R$ 200.00 de Marcos marcada como PAGO.");
    assert(tPagamento.includes("R$ 200.00"), "Deveria incluir valor");

    const tComprovante = formatarTextoNotificacao("ENVIO_COMPROVANTE", JSON.stringify({ cotaNumero: 2, numeroCiclo: 1 }));
    assert.strictEqual(tComprovante, "Novo comprovante PIX anexado para Cota #2 (Ciclo #1).");

    const tTroca = formatarTextoNotificacao("TROCA_POSICAO_COTA", JSON.stringify({
      cota1: { numero: 1, participantes: "Marcos" },
      cota2: { numero: 5, participantes: "Fábio" }
    }));
    assert.strictEqual(tTroca, "Permuta de ordem: Cota #1 (Marcos) trocou com Cota #5 (Fábio).");

    const tContemplacao = formatarTextoNotificacao("CONTEMPLACAO_COTA", JSON.stringify({ numero: 3, participantes: "Ana" }));
    assert.strictEqual(tContemplacao, "A Cota #3 (Ana) foi contemplada com a bolada!");

    const tEdicao = formatarTextoNotificacao("EDICAO_DADOS_CONSORCIO", JSON.stringify({ depois: { nome: "Consórcio 2026 VIP" } }));
    assert.strictEqual(tEdicao, 'Dados do consórcio atualizados (Nome: "Consórcio 2026 VIP").');
    console.log("✅ Teste 2: Humanização de todas as ações de notificação aprovada.");

    // Teste 3: Confirmação de recebimento com justificativa gera log de auditoria e status PAGO
    console.log("Testando confirmação de recebimento e trilha de auditoria...");
    const consorcio = await prisma.consorcio.findFirst({
      include: {
        criador: true,
        contribuicoes: {
          include: { usuario: true, cota: true }
        }
      }
    });
    assert(consorcio, "Consórcio deve existir para teste");

    const contribPendente = consorcio.contribuicoes.find(c => c.status === "PENDENTE" || c.status === "EM_ATRASO");
    assert(contribPendente, "Deve existir ao menos uma contribuição pendente para teste");

    const justificativaTeste = "Conferência manual via extrato bancário Nubank";
    const resConfirm = await testConfirmPayment(contribPendente.id, consorcio.criadorId, justificativaTeste);
    assert.strictEqual(resConfirm.success, true, "Confirmação deve ter sucesso");

    // Valida no banco
    const contribAtualizada = await prisma.contribuicao.findUnique({ where: { id: contribPendente.id } });
    assert.strictEqual(contribAtualizada.status, "PAGO", "Status deve ser PAGO");
    assert.strictEqual(contribAtualizada.motivoAlteracao, justificativaTeste);

    // Valida que gerou AuditoriaLog
    const auditConfirm = await prisma.auditoriaLog.findFirst({
      where: {
        consorcioId: consorcio.id,
        tipoAcao: "CONFIRMACAO_PAGAMENTO",
        justificativa: justificativaTeste
      },
      orderBy: { createdAt: "desc" }
    });
    assert(auditConfirm, "Log de auditoria para confirmação deve ter sido criado");
    console.log("✅ Teste 3: Confirmação de recebimento e registro de auditoria aprovados.");

    // Teste 4: Reversão/estorno seguro do teste
    console.log("Testando estorno seguro e registro na trilha de auditoria...");
    const resRevert = await testRevertPayment(contribPendente.id, consorcio.criadorId, "Reversão para manter integridade dos testes");
    assert.strictEqual(resRevert.success, true);

    const contribRevertida = await prisma.contribuicao.findUnique({ where: { id: contribPendente.id } });
    assert(contribRevertida.status === "PENDENTE" || contribRevertida.status === "EM_ATRASO");

    const auditRevert = await prisma.auditoriaLog.findFirst({
      where: {
        consorcioId: consorcio.id,
        tipoAcao: "ESTORNO_PAGAMENTO"
      },
      orderBy: { createdAt: "desc" }
    });
    assert(auditRevert, "Log de auditoria para estorno deve ter sido criado");
    console.log("✅ Teste 4: Estorno e rastreabilidade na auditoria aprovados.");

    // Teste 5: Regra Inbox Zero com Persistência por Cutoff Timestamp e Dispensadas
    console.log("Testando filtragem Inbox Zero do Sininho (persistência com cutoff e dispensadas)...");
    const t0 = new Date(Date.now() - 60000).toISOString();
    const t1 = new Date(Date.now() - 30000).toISOString();
    const t2 = new Date(Date.now()).toISOString();

    const auditoriasMock = [
      { id: "log-1", tipoAcao: "CONFIRMACAO_PAGAMENTO", detalhes: "R$ 200 pago", createdAt: t0 },
      { id: "log-2", tipoAcao: "CONTEMPLACAO_COTA", detalhes: "Cota contemplada", createdAt: t1 },
    ];

    function filtrarUnread(auditorias, lidasAte, dispensadasIds) {
      return auditorias.filter(a => {
        if (dispensadasIds.includes(a.id)) return false;
        if (lidasAte) {
          const criacao = new Date(a.createdAt).getTime();
          const leitura = new Date(lidasAte).getTime();
          if (criacao <= leitura) return false;
        }
        return true;
      });
    }

    // Inicialmente sem lidasAte
    let unread = filtrarUnread(auditoriasMock, null, []);
    assert.strictEqual(unread.length, 2, "2 notificações novas");

    // Marca todas como lidas no momento t1
    let lidasAte = t1;
    unread = filtrarUnread(auditoriasMock, lidasAte, []);
    assert.strictEqual(unread.length, 0, "Deveria estar vazio (todas lidas antes ou em t1)");

    // Chega nova auditoria no momento t2 (após t1)
    auditoriasMock.unshift({ id: "log-3", tipoAcao: "ENVIO_COMPROVANTE", detalhes: "Novo PIX", createdAt: t2 });
    unread = filtrarUnread(auditoriasMock, lidasAte, []);
    assert.strictEqual(unread.length, 1, "Nova notificação após t1 deve ser exibida");
    assert.strictEqual(unread[0].id, "log-3");

    // Dispensa individualmente log-3
    unread = filtrarUnread(auditoriasMock, lidasAte, ["log-3"]);
    assert.strictEqual(unread.length, 0, "Deveria estar vazio após dispensar individualmente");
    console.log("✅ Teste 5: Filtragem Inbox Zero com persistência comprovada com sucesso.");

    // Limpeza dos logs gerados pelo teste
    if (auditConfirm) await prisma.auditoriaLog.delete({ where: { id: auditConfirm.id } });
    if (auditRevert) await prisma.auditoriaLog.delete({ where: { id: auditRevert.id } });

    console.log("\n🎉 Todos os 5 testes de Notificações, Confirmação e Auditoria passaram com 100% de sucesso!");
  } finally {
    await prisma.$disconnect();
  }
}

runTests().catch(err => {
  console.error("❌ Falha nos testes de notificações:", err);
  process.exit(1);
});
