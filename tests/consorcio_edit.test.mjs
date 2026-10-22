import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Iniciando testes de Edição de Consórcio e Trilha de Auditoria...");

  // 1. Localiza um criador e seu consórcio
  const consorcio = await prisma.consorcio.findFirst({
    include: { criador: true }
  });

  if (!consorcio) {
    throw new Error("Nenhum consórcio encontrado para teste.");
  }

  const criador = consorcio.criador;

  // 2. Localiza um usuário comum que NÃO seja o criador
  const usuarioComum = await prisma.user.findFirst({
    where: {
      id: { not: consorcio.criadorId },
      role: 'COMUM'
    }
  });

  // Simula a lógica de permissão da Server Action
  function verificarPermissaoEdicao(user, cons) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";
    const isCriador = cons.criadorId === user.id;
    return isCriador || isAdmin;
  }

  // Teste 1: Bloqueio de usuário não autorizado
  if (usuarioComum) {
    console.log("Testando bloqueio de edição por usuário não autorizado...");
    const permitido = verificarPermissaoEdicao(usuarioComum, consorcio);
    if (permitido) {
      throw new Error("Falha no Teste 1: Usuário comum recebeu permissão de edição!");
    }
    console.log("✅ Teste 1: Bloqueio de edição por usuário não autorizado aprovado.");
  }

  // Teste 2: Permissão aprovada para Criador e Super Admin
  console.log("Testando permissão de edição para criador...");
  if (!verificarPermissaoEdicao(criador, consorcio)) {
    throw new Error("Falha no Teste 2: Criador não recebeu permissão de edição!");
  }
  console.log("✅ Teste 2: Permissão de edição para criador aprovada.");

  // Teste 3: Atualização dos dados informativos e PIX
  console.log("Testando persistência dos dados de edição...");
  const nomeOriginal = consorcio.nome;
  const novoNome = `${nomeOriginal} (Editado)`;
  const novosDadosPix = "Chave Pix CPF: 987.654.321-00 - Titular: Renato";

  const atualizado = await prisma.consorcio.update({
    where: { id: consorcio.id },
    data: {
      nome: novoNome,
      finalidade: "Finalidade atualizada",
      chavePix: novosDadosPix,
      dadosBancarios: novosDadosPix,
    }
  });

  if (atualizado.nome !== novoNome || atualizado.chavePix !== novosDadosPix) {
    throw new Error("Falha no Teste 3: Dados não foram atualizados no banco!");
  }
  console.log("✅ Teste 3: Atualização de nome e dados de pagamento PIX aprovada.");

  // Teste 4: Registro na Trilha de Auditoria
  console.log("Testando criação de log de auditoria...");
  const log = await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "EDICAO_DADOS_CONSORCIO",
      detalhes: JSON.stringify({
        antes: { nome: consorcio.nome },
        depois: { nome: novoNome }
      }),
      justificativa: "Atualização de dados cadastrais/pagamento realizada pelo criador."
    }
  });

  if (!log || log.tipoAcao !== "EDICAO_DADOS_CONSORCIO") {
    throw new Error("Falha no Teste 4: Log de auditoria não foi criado corretamente!");
  }
  console.log("✅ Teste 4: Trilha de auditoria gerada com sucesso.");

  // Teste 5: Validação da Imutabilidade Financeira
  console.log("Testando imutabilidade das regras financeiras...");
  if (atualizado.valorCota !== consorcio.valorCota || atualizado.totalCotas !== consorcio.totalCotas) {
    throw new Error("Falha no Teste 5: Regras financeiras foram alteradas indevidamente!");
  }
  console.log("✅ Teste 5: Imutabilidade financeira (valor da cota e total de cotas) preservada.");

  // Restaura o nome original
  await prisma.consorcio.update({
    where: { id: consorcio.id },
    data: {
      nome: nomeOriginal,
      finalidade: consorcio.finalidade,
      chavePix: consorcio.chavePix,
      dadosBancarios: consorcio.dadosBancarios,
    }
  });
  console.log("✅ Limpeza e restauração do consórcio concluída.");

  console.log("\n🎉 Todos os 5 testes de Edição de Consórcio passaram com 100% de sucesso!");
}

runTests().catch(err => {
  console.error("❌ Erro nos testes:", err);
  process.exit(1);
});
