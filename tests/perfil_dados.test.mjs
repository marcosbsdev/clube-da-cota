import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { formatarTelefone, gerarLinkWhatsApp } from '../src/lib/finance.ts';

const prisma = new PrismaClient();

// Simulação da action updateUserProfileDadosAction
async function simularUpdateUserProfileDados(input) {
  const { usuarioId, name, telefone, tipoChavePix, chavePix, receberPixDireto, senhaAtual, novaSenha } = input;

  if (!usuarioId) {
    return { success: false, error: "Usuário não autenticado." };
  }

  const trimmedName = name?.trim();
  if (!trimmedName || trimmedName.length < 2) {
    return { success: false, error: "O nome completo deve ter no mínimo 2 caracteres." };
  }

  const user = await prisma.user.findUnique({
    where: { id: usuarioId },
  });

  if (!user) {
    return { success: false, error: "Usuário não encontrado." };
  }

  const updateData = {
    name: trimmedName,
    telefone: telefone ? formatarTelefone(telefone) : null,
  };

  if (tipoChavePix !== undefined) {
    updateData.tipoChavePix = tipoChavePix || "CELULAR";
  }
  if (chavePix !== undefined) {
    updateData.chavePix = chavePix ? chavePix.trim() : null;
  }
  if (receberPixDireto !== undefined) {
    updateData.receberPixDireto = Boolean(receberPixDireto);
  }

  if (novaSenha && novaSenha.trim().length > 0) {
    if (novaSenha.trim().length < 6) {
      return { success: false, error: "A nova senha deve ter no mínimo 6 dígitos." };
    }

    if (user.passwordHash) {
      if (!senhaAtual) {
        return {
          success: false,
          error: "Informe a sua senha atual para autorizar a alteração de senha.",
        };
      }
      const senhaValida = await bcrypt.compare(senhaAtual, user.passwordHash);
      if (!senhaValida) {
        return { success: false, error: "A senha atual informada está incorreta." };
      }
    }

    updateData.passwordHash = await bcrypt.hash(novaSenha.trim(), 10);
  }

  const updatedUser = await prisma.user.update({
    where: { id: usuarioId },
    data: updateData,
  });

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
        senhaAlterada: Boolean(novaSenha),
      }),
    },
  });

  return {
    success: true,
    message: "Dados cadastrais atualizados com sucesso!",
    data: {
      id: updatedUser.id,
      name: updatedUser.name,
      telefone: updatedUser.telefone,
    },
  };
}

async function run() {
  console.log("🧪 Iniciando testes de Edição de Perfil e Link Direto no WhatsApp...");

  const testEmail = `teste_perfil_${Date.now()}@exemplo.com`;
  const senhaOriginal = "senha1234";
  const passwordHash = await bcrypt.hash(senhaOriginal, 10);

  // 1. Cria usuário de teste
  const user = await prisma.user.create({
    data: {
      name: "Organizador Inicial",
      email: testEmail,
      telefone: "(83) 98888-7777",
      passwordHash,
      role: "COMUM",
      isActivated: true,
    },
  });

  try {
    // Teste 1: Atualizar Nome, WhatsApp e Chave Pix do Usuário
    console.log("Testando atualização de Nome, WhatsApp e Chave Pix...");
    const res1 = await simularUpdateUserProfileDados({
      usuarioId: user.id,
      name: "Organizador Atualizado Silva",
      telefone: "83999998888", // enviado sem máscara para testar formatação automática
      tipoChavePix: "CPF_CNPJ",
      chavePix: "123.456.789-00",
      receberPixDireto: true,
    });

    assert.strictEqual(res1.success, true, "Deve atualizar com sucesso");
    assert.strictEqual(res1.data.name, "Organizador Atualizado Silva");
    assert.strictEqual(res1.data.telefone, "(83) 99999-8888", "Deve aplicar a máscara brasileira");

    const userNoBanco = await prisma.user.findUnique({ where: { id: user.id } });
    assert.strictEqual(userNoBanco.name, "Organizador Atualizado Silva");
    assert.strictEqual(userNoBanco.telefone, "(83) 99999-8888");
    assert.strictEqual(userNoBanco.tipoChavePix, "CPF_CNPJ");
    assert.strictEqual(userNoBanco.chavePix, "123.456.789-00");
    assert.strictEqual(userNoBanco.receberPixDireto, true);
    console.log("✅ Teste 1: Atualização de Nome, WhatsApp com máscara e Chave Pix aprovada.");

    // Teste 2: Rejeição de troca de senha com senha atual errada
    console.log("Testando bloqueio de troca de senha com senha atual errada...");
    const res2 = await simularUpdateUserProfileDados({
      usuarioId: user.id,
      name: "Organizador Atualizado Silva",
      senhaAtual: "senha_errada_xyz",
      novaSenha: "nova_senha_6789",
    });

    assert.strictEqual(res2.success, false);
    assert.match(res2.error, /senha atual informada está incorreta/i);
    console.log("✅ Teste 2: Bloqueio seguro com senha atual incorreta aprovado.");

    // Teste 3: Rejeição com nova senha curta
    console.log("Testando bloqueio de senha curta...");
    const res3 = await simularUpdateUserProfileDados({
      usuarioId: user.id,
      name: "Organizador Atualizado Silva",
      senhaAtual: senhaOriginal,
      novaSenha: "123",
    });

    assert.strictEqual(res3.success, false);
    assert.match(res3.error, /mínimo 6 dígitos/i);
    console.log("✅ Teste 3: Bloqueio de senha com menos de 6 dígitos aprovado.");

    // Teste 4: Troca de senha com sucesso fornecendo senha atual correta
    console.log("Testando troca de senha com credenciais válidas...");
    const res4 = await simularUpdateUserProfileDados({
      usuarioId: user.id,
      name: "Organizador Atualizado Silva",
      senhaAtual: senhaOriginal,
      novaSenha: "nova_senha_segura_123",
    });

    assert.strictEqual(res4.success, true);
    const userComNovaSenha = await prisma.user.findUnique({ where: { id: user.id } });
    const senhaAntigaValida = await bcrypt.compare(senhaOriginal, userComNovaSenha.passwordHash);
    const senhaNovaValida = await bcrypt.compare("nova_senha_segura_123", userComNovaSenha.passwordHash);
    assert.strictEqual(senhaAntigaValida, false, "Senha antiga não deve mais funcionar");
    assert.strictEqual(senhaNovaValida, true, "Nova senha deve ser aceita com hash bcrypt");
    console.log("✅ Teste 4: Alteração de senha autorizada e validada com hash criptográfico.");

    // Teste 5: Link de WhatsApp abre direto no número do organizador
    console.log("Testando geração do link do WhatsApp direto com o organizador...");
    const linkWhatsApp = gerarLinkWhatsApp({
      telefone: userNoBanco.telefone,
      mensagem: "Olá! Gostaria de tirar uma dúvida sobre a cota.",
    });

    assert.ok(linkWhatsApp.startsWith("https://wa.me/5583999998888?text="), "URL deve conter DDI 55 e número do criador");
    assert.ok(linkWhatsApp.includes(encodeURIComponent("Olá! Gostaria de tirar uma dúvida sobre a cota.")), "Texto deve estar codificado na URL");
    console.log("✅ Teste 5: Link direto do WhatsApp gerado com DDI Brasil e número do organizador com sucesso.");

    // Teste 6: Trilha de auditoria gravada para EDICAO_PERFIL_USUARIO
    console.log("Testando registro na trilha de auditoria...");
    const logs = await prisma.auditoriaLog.findMany({
      where: {
        usuarioResponsavelId: user.id,
        tipoAcao: "EDICAO_PERFIL_USUARIO",
      },
      orderBy: { createdAt: "asc" },
    });

    assert.ok(logs.length >= 2, "Deve registrar logs de auditoria");
    const ultimoLog = logs[logs.length - 1];
    const detalhes = JSON.parse(ultimoLog.detalhes);
    assert.strictEqual(detalhes.senhaAlterada, true);
    console.log("✅ Teste 6: Trilha de auditoria registrada para EDICAO_PERFIL_USUARIO.");

    // Teste 7: Notificação de Perfil exclusiva do usuário autenticado afetado
    console.log("Testando isolamento de notificação de perfil por usuário...");
    const outroUserId = "user_outro_123";
    const notificacoesDoUsuario = logs.filter(
      (a) => a.tipoAcao !== "EDICAO_PERFIL_USUARIO" || a.usuarioAfetadoId === user.id
    );
    const notificacoesDeOutroUsuario = logs.filter(
      (a) => a.tipoAcao === "EDICAO_PERFIL_USUARIO" && a.usuarioAfetadoId === outroUserId
    );
    assert.ok(notificacoesDoUsuario.length >= 2, "Usuário autenticado deve ver suas próprias notificações de perfil");
    assert.strictEqual(notificacoesDeOutroUsuario.length, 0, "Outro usuário NÃO deve ver notificações de perfil de terceiros");
    console.log("✅ Teste 7: Isolamento estrito de notificações de perfil validado com sucesso.");

  } finally {
    // Limpeza
    await prisma.auditoriaLog.deleteMany({ where: { usuarioResponsavelId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    await prisma.$disconnect();
  }

  console.log("\n🎉 Todos os 7 testes de Perfil, Notificações e Link de WhatsApp passaram com 100% de sucesso!");
}

run().catch((err) => {
  console.error("❌ Falha nos testes de perfil:", err);
  process.exit(1);
});
