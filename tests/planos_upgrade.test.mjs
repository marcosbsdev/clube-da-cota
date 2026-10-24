import assert from "node:assert";
import { DADOS_PAGAMENTO_UPGRADE, PLANOS_INFO } from "../src/lib/plans.ts";
import { gerarLinkWhatsApp } from "../src/lib/finance.ts";

console.log("🧪 Iniciando testes de Limites de Planos e Mensagem Padrão de Upgrade Pix...\n");

// Teste 1: Validação das constantes oficiais de upgrade e Pix para Marcos Batista
{
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.favorecido, "Marcos Batista");
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.chavePix, "markos.system@gmail.com");
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.whatsapp, "(11) 96303-0266");
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.whatsappSanitizado, "11963030266");
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.proValor, "R$ 19,90/mês");
  assert.strictEqual(DADOS_PAGAMENTO_UPGRADE.proMasterValor, "R$ 29,90/mês");
  assert.ok(DADOS_PAGAMENTO_UPGRADE.mensagemPadrao.includes("Marcos Batista"));
  assert.ok(DADOS_PAGAMENTO_UPGRADE.mensagemPadrao.includes("markos.system@gmail.com"));
  assert.ok(DADOS_PAGAMENTO_UPGRADE.mensagemPadrao.includes("96303-0266"));
  assert.ok(DADOS_PAGAMENTO_UPGRADE.mensagemPadrao.includes("19,90"));
  assert.ok(DADOS_PAGAMENTO_UPGRADE.mensagemPadrao.includes("29,90"));

  const link = gerarLinkWhatsApp({
    telefone: DADOS_PAGAMENTO_UPGRADE.whatsapp,
    mensagem: "Olá Marcos Batista! Segue comprovante",
  });
  assert.ok(link.startsWith("https://wa.me/5511963030266?text="));

  console.log("✅ Teste 1: Dados de pagamento Pix e WhatsApp para Marcos Batista ((11) 96303-0266) validados.");
}

// Teste 2: Validação da matriz de recursos por plano
{
  assert.strictEqual(PLANOS_INFO.COMUM.maxConsorciosAtivos, 1);
  assert.strictEqual(PLANOS_INFO.COMUM.maxParticipantesPorConsorcio, 10);
  assert.strictEqual(PLANOS_INFO.COMUM.temAuditoria, false);

  assert.strictEqual(PLANOS_INFO.PRO.maxConsorciosAtivos, 3);
  assert.strictEqual(PLANOS_INFO.PRO.maxParticipantesPorConsorcio, 20);
  assert.strictEqual(PLANOS_INFO.PRO.valorMensal, 19.9);

  assert.strictEqual(PLANOS_INFO.PRO_MASTER.maxConsorciosAtivos, Infinity);
  assert.strictEqual(PLANOS_INFO.PRO_MASTER.maxParticipantesPorConsorcio, Infinity);
  assert.strictEqual(PLANOS_INFO.PRO_MASTER.valorMensal, 29.9);
  assert.strictEqual(PLANOS_INFO.PRO_MASTER.temAuditoria, true);
  console.log("✅ Teste 2: Matriz de regras e limites dos 3 planos aprovada.");
}

// Teste 3: Simulação das mensagens de erro padrão do servidor ao atingir limites
function simularValidacaoCriacaoConsorcio({ role, consorciosAtivos, totalParticipantes }) {
  if (role === "COMUM" && consorciosAtivos >= 1) {
    return {
      success: false,
      error:
        "Você atingiu o limite de 1 consórcio ativo do Plano Comum. Para gerenciar novos grupos, realize a migração de plano via Pix para Marcos Batista (markos.system@gmail.com): Plano Pro (R$ 19,90/mês para até 3 consórcios) ou Pro Master (R$ 29,90/mês para consórcios ilimitados).",
    };
  }
  if (role === "PRO" && consorciosAtivos >= 3) {
    return {
      success: false,
      error:
        "Você atingiu o limite de 3 consórcios ativos do Plano Pro. Para criar grupos ilimitados, realize a migração para o Plano Pro Master (R$ 29,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
    };
  }
  if (role === "COMUM" && totalParticipantes > 10) {
    return {
      success: false,
      error:
        "O Plano Comum permite no máximo 10 participantes por consórcio. Para grupos de até 20 participantes, realize a migração para o Plano Pro (R$ 19,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
    };
  }
  if (role === "PRO" && totalParticipantes > 20) {
    return {
      success: false,
      error:
        "O Plano Pro permite no máximo 20 participantes por consórcio. Para participantes ilimitados, realize a migração para o Plano Pro Master (R$ 29,90/mês) via Pix para Marcos Batista (markos.system@gmail.com).",
    };
  }
  return { success: true };
}

{
  // Comum com 1 consórcio tenta criar 2º
  const resComumConsorcio = simularValidacaoCriacaoConsorcio({
    role: "COMUM",
    consorciosAtivos: 1,
    totalParticipantes: 5,
  });
  assert.strictEqual(resComumConsorcio.success, false);
  assert.ok(resComumConsorcio.error.includes("Marcos Batista"));
  assert.ok(resComumConsorcio.error.includes("19,90"));

  // Comum tenta criar com 11 participantes
  const resComumParticipantes = simularValidacaoCriacaoConsorcio({
    role: "COMUM",
    consorciosAtivos: 0,
    totalParticipantes: 11,
  });
  assert.strictEqual(resComumParticipantes.success, false);
  assert.ok(resComumParticipantes.error.includes("10 participantes"));
  assert.ok(resComumParticipantes.error.includes("Marcos Batista"));

  // Pro com 3 consórcios tenta criar 4º
  const resProConsorcio = simularValidacaoCriacaoConsorcio({
    role: "PRO",
    consorciosAtivos: 3,
    totalParticipantes: 15,
  });
  assert.strictEqual(resProConsorcio.success, false);
  assert.ok(resProConsorcio.error.includes("Pro Master (R$ 29,90/mês)"));
  assert.ok(resProConsorcio.error.includes("Marcos Batista"));

  // Pro tenta criar com 21 participantes
  const resProParticipantes = simularValidacaoCriacaoConsorcio({
    role: "PRO",
    consorciosAtivos: 1,
    totalParticipantes: 21,
  });
  assert.strictEqual(resProParticipantes.success, false);
  assert.ok(resProParticipantes.error.includes("20 participantes"));

  // Pro Master cria sem limite
  const resProMaster = simularValidacaoCriacaoConsorcio({
    role: "PRO_MASTER",
    consorciosAtivos: 10,
    totalParticipantes: 50,
  });
  assert.strictEqual(resProMaster.success, true);

  console.log("✅ Teste 3: Validação de limites e mensagens de upgrade via Pix para Marcos Batista aprovadas.");
}

console.log("\n🎉 Todos os 3 testes de Planos e Upgrade passaram com 100% de sucesso!");
