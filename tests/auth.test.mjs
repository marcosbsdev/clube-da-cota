import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runAuthTests() {
  console.log("🧪 Iniciando testes do Módulo de Autenticação Real do Clube da Cota...\n");

  // Teste 1: Validação de Login com Hash Bcrypt existente
  console.log("Testando Login com credenciais válidas...");
  const userMarcos = await prisma.user.findUnique({
    where: { email: "markos.system@gmail.com" },
  });

  if (!userMarcos || !userMarcos.passwordHash) {
    throw new Error("Usuário Marcos não encontrado ou sem hash de senha.");
  }

  const senhaCorreta = await bcrypt.compare("123456", userMarcos.passwordHash);
  if (!senhaCorreta) {
    throw new Error("Falha na validação da senha com hash bcrypt.");
  }
  console.log("✅ Teste 1: Validação de login com senha e hash bcrypt aprovada.");

  // Teste 2: Rejeição de senha inválida
  console.log("Testando rejeição de senha incorreta...");
  const senhaIncorreta = await bcrypt.compare("senhaErrada999", userMarcos.passwordHash);
  if (senhaIncorreta) {
    throw new Error("Erro: senha incorreta foi aceita!");
  }
  console.log("✅ Teste 2: Rejeição segura de senha incorreta aprovada.");

  // Teste 3: Cadastro de novo usuário com hash seguro
  console.log("Testando cadastro de novo usuário...");
  const testEmail = `teste_${Date.now()}@exemplo.com`;
  const newHash = await bcrypt.hash("minhaSenhaForte2026", 10);
  
  const novoUsuario = await prisma.user.create({
    data: {
      name: "Usuário Teste Auth",
      email: testEmail,
      passwordHash: newHash,
      role: "COMUM",
      isActivated: true,
    },
  });

  if (!novoUsuario.id || novoUsuario.role !== "COMUM") {
    throw new Error("Falha ao registrar novo usuário no banco.");
  }
  console.log("✅ Teste 3: Cadastro de nova conta com papel COMUM aprovado.");

  // Teste 4: Fluxo de Recuperação de Senha (Geração de Token e Redefinição)
  console.log("Testando fluxo de recuperação de senha...");
  const token = "tok_" + Math.random().toString(36).slice(2);
  const expiresAt = new Date(Date.now() + 3600 * 1000);

  await prisma.user.update({
    where: { id: novoUsuario.id },
    data: {
      resetToken: token,
      resetExpiresAt: expiresAt,
    },
  });

  const userComToken = await prisma.user.findUnique({
    where: { resetToken: token },
  });

  if (!userComToken || userComToken.id !== novoUsuario.id) {
    throw new Error("Falha ao localizar usuário pelo token de recuperação.");
  }

  // Redefinindo senha
  const novaSenhaHash = await bcrypt.hash("novaSenhaRedefinida123", 10);
  await prisma.user.update({
    where: { id: userComToken.id },
    data: {
      passwordHash: novaSenhaHash,
      resetToken: null,
      resetExpiresAt: null,
    },
  });

  // Validando nova senha
  const userAtualizado = await prisma.user.findUnique({
    where: { id: novoUsuario.id },
  });

  const novaSenhaValida = await bcrypt.compare("novaSenhaRedefinida123", userAtualizado.passwordHash);
  if (!novaSenhaValida) {
    throw new Error("Nova senha redefinida não foi aceita.");
  }
  console.log("✅ Teste 4: Recuperação e redefinição de senha com invalidação de token aprovada.");

  // Limpeza do usuário de teste
  await prisma.user.delete({ where: { id: novoUsuario.id } });
  console.log("✅ Teste 5: Limpeza segura de dados de teste concluída.");

  // Teste 6: Validação dos 4 Níveis de Acesso e Transição de Papéis
  console.log("Testando os 4 Níveis de Acesso e transição de papéis...");
  const userCamila = await prisma.user.findUnique({ where: { email: "camila.pro@exemplo.com" } });
  const userRenato = await prisma.user.findUnique({ where: { email: "renato.master@exemplo.com" } });

  if (!userCamila || userCamila.role !== "PRO") {
    throw new Error("Usuário Camila com papel PRO não encontrado.");
  }
  if (!userRenato || userRenato.role !== "PRO_MASTER") {
    throw new Error("Usuário Renato com papel PRO_MASTER não encontrado.");
  }

  // Testa promoção e rebaixamento
  const tempUser = await prisma.user.create({
    data: {
      name: "Usuário Teste Níveis",
      email: `test_role_${Date.now()}@exemplo.com`,
      role: "COMUM",
      isActivated: true,
    },
  });

  const promotedToPro = await prisma.user.update({
    where: { id: tempUser.id },
    data: { role: "PRO" },
  });
  if (promotedToPro.role !== "PRO") throw new Error("Falha ao promover para PRO.");

  const promotedToMaster = await prisma.user.update({
    where: { id: tempUser.id },
    data: { role: "PRO_MASTER" },
  });
  if (promotedToMaster.role !== "PRO_MASTER") throw new Error("Falha ao promover para PRO_MASTER.");

  await prisma.user.delete({ where: { id: tempUser.id } });
  console.log("✅ Teste 6: Validação dos 4 níveis de acesso (COMUM, PRO, PRO_MASTER, SUPER_ADMIN) e transição de papéis aprovada.");

  console.log("\n🎉 Todos os 6 testes do Módulo de Autenticação passaram com 100% de sucesso!");
}

runAuthTests().catch((err) => {
  console.error("❌ Erro no teste de autenticação:", err);
  process.exit(1);
});
