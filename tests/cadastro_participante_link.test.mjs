import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Funções de formatação e ações simuladas diretamente com o banco de dados
function formatarTelefone(valor) {
  if (!valor) return "";
  const digits = valor.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

async function simularCompletarCadastro(input) {
  const { token, nome, email, telefone, senha, tipoChavePix, chavePix, receberPixDireto } = input;

  if (!token) return { success: false, error: "Link de acesso inválido ou ausente." };

  // Busca o participante pelo token
  const cp = await prisma.cotaParticipante.findUnique({
    where: { tokenAcesso: token },
    include: { usuario: true, cota: true },
  });

  if (!cp) return { success: false, error: "Link de acesso inválido ou expirado." };

  const usuarioAtual = cp.usuario;
  const consorcioId = cp.cota.consorcioId;

  const nomeLimpo = nome?.trim() || usuarioAtual.name;
  const emailLimpo = email?.trim().toLowerCase();
  const telefoneLimpo = telefone ? formatarTelefone(telefone) : usuarioAtual.telefone;

  if (!nomeLimpo || nomeLimpo.length < 2) return { success: false, error: "Informe seu nome completo." };
  if (!emailLimpo || !emailLimpo.includes("@") || !emailLimpo.includes(".")) {
    return { success: false, error: "Informe um e-mail válido para acessar sua conta." };
  }
  if (!senha || senha.length < 6) return { success: false, error: "A senha deve ter no mínimo 6 caracteres." };

  const tipoPixEfetivo = tipoChavePix || "CELULAR";
  const chavePixEfetiva = chavePix?.trim() || null;
  const receberPixDiretoEfetivo = Boolean(receberPixDireto && chavePixEfetiva);

  const usuarioExistente = await prisma.user.findUnique({
    where: { email: emailLimpo },
  });

  let usuarioFinalId = usuarioAtual.id;

  if (usuarioExistente && usuarioExistente.id !== usuarioAtual.id) {
    if (usuarioExistente.passwordHash) {
      const senhaCorreta = await bcrypt.compare(senha, usuarioExistente.passwordHash);
      if (!senhaCorreta) {
        return {
          success: false,
          error: "Já existe uma conta com este e-mail no Clube da Cota. Informe a senha correta da sua conta para vincular este consórcio ao seu perfil existente.",
        };
      }
    }

    const novoPasswordHash = usuarioExistente.passwordHash || (await bcrypt.hash(senha, 10));

    await prisma.$transaction([
      prisma.cotaParticipante.updateMany({
        where: { usuarioId: usuarioAtual.id },
        data: { usuarioId: usuarioExistente.id },
      }),
      prisma.contribuicao.updateMany({
        where: { usuarioId: usuarioAtual.id },
        data: { usuarioId: usuarioExistente.id },
      }),
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
      prisma.user.delete({
        where: { id: usuarioAtual.id },
      }),
    ]);

    usuarioFinalId = usuarioExistente.id;
  } else {
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

  return {
    success: true,
    usuarioId: usuarioFinalId,
    message: "Cadastro concluído com sucesso!",
  };
}

async function simularUpdatePix(token, tipoChavePix, chavePix, receberPixDireto) {
  const cp = await prisma.cotaParticipante.findUnique({
    where: { tokenAcesso: token },
  });
  if (!cp) return { success: false, error: "Não encontrado." };

  await prisma.user.update({
    where: { id: cp.usuarioId },
    data: {
      tipoChavePix,
      chavePix,
      receberPixDireto: Boolean(receberPixDireto && chavePix),
    },
  });

  return { success: true };
}

async function runTests() {
  console.log("🧪 Iniciando testes de Completar Cadastro Oficial pelo Link do Participante...\n");

  let criadorTeste = null;
  let consorcioTeste = null;
  let userTemp = null;
  let cotaTeste = null;
  let cpTeste = null;
  let userExistenteTeste = null;
  let userTemp2 = null;
  let cotaTeste2 = null;
  let cpTeste2 = null;

  try {
    // Setup inicial de teste
    const randomSuffix = Date.now().toString(36);
    criadorTeste = await prisma.user.create({
      data: {
        name: `Criador Teste ${randomSuffix}`,
        email: `criador_${randomSuffix}@teste.com`,
        role: "PRO",
      },
    });

    consorcioTeste = await prisma.consorcio.create({
      data: {
        nome: `Consórcio Cadastro Teste ${randomSuffix}`,
        criadorId: criadorTeste.id,
        valorCota: 100,
        valorTotalBolada: 500,
        totalCotas: 5,
        dataInicio: new Date(),
        dataPrimeiroVencimento: new Date(),
      },
    });

    // 1. Cria usuário temporário sem senha
    userTemp = await prisma.user.create({
      data: {
        name: "Participante Provisório",
        email: `participante_${randomSuffix}@clubedacota.local`,
        isActivated: false,
      },
    });

    const tokenLink = `cp_teste_${randomSuffix}`;
    cotaTeste = await prisma.cota.create({
      data: {
        consorcioId: consorcioTeste.id,
        numero: 1,
        ordemSorteio: 1,
        tokenAcesso: `cota_teste_${randomSuffix}`,
      },
    });

    cpTeste = await prisma.cotaParticipante.create({
      data: {
        cotaId: cotaTeste.id,
        usuarioId: userTemp.id,
        percentual: 100,
        valorParcela: 100,
        tokenAcesso: tokenLink,
      },
    });

    await prisma.contribuicao.create({
      data: {
        consorcioId: consorcioTeste.id,
        cotaId: cotaTeste.id,
        usuarioId: userTemp.id,
        numeroCiclo: 1,
        valorPrevisto: 100,
        dataVencimento: new Date(),
        status: "PENDENTE",
      },
    });

    console.log("Testando conclusão de cadastro de novo usuário a partir do link...");
    const emailNovoReal = `novo_membro_${randomSuffix}@gmail.com`;
    const resCadastro = await simularCompletarCadastro({
      token: tokenLink,
      nome: "Patrick Dias Real",
      email: emailNovoReal,
      telefone: "11987654321",
      senha: "SenhaSegura@2026",
      tipoChavePix: "CELULAR",
      chavePix: "(11) 98765-4321",
      receberPixDireto: true,
    });

    assert(resCadastro.success, "Cadastro deve ser concluído com sucesso");
    assert.strictEqual(resCadastro.usuarioId, userTemp.id);

    // Valida no banco
    const userAtualizado = await prisma.user.findUnique({ where: { id: userTemp.id } });
    assert.strictEqual(userAtualizado.name, "Patrick Dias Real");
    assert.strictEqual(userAtualizado.email, emailNovoReal);
    assert.strictEqual(userAtualizado.telefone, "(11) 98765-4321");
    assert.strictEqual(userAtualizado.isActivated, true);
    assert.strictEqual(userAtualizado.tipoChavePix, "CELULAR");
    assert.strictEqual(userAtualizado.chavePix, "(11) 98765-4321");
    assert.strictEqual(userAtualizado.receberPixDireto, true);
    assert(userAtualizado.passwordHash, "Deve ter gerado hash de senha");

    const senhaOk = await bcrypt.compare("SenhaSegura@2026", userAtualizado.passwordHash);
    assert(senhaOk, "Senha deve ser verificada pelo hash bcrypt");
    console.log("✅ Teste 1: Cadastro completo de novo usuário a partir do link validado com sucesso.");

    // 2. Testando atualização de chave Pix via token
    console.log("Testando atualização de chave Pix via token...");
    const resPix = await simularUpdatePix(tokenLink, "EMAIL", "pix_patrick@gmail.com", true);
    assert(resPix.success);
    const userPixAtualizado = await prisma.user.findUnique({ where: { id: userTemp.id } });
    assert.strictEqual(userPixAtualizado.tipoChavePix, "EMAIL");
    assert.strictEqual(userPixAtualizado.chavePix, "pix_patrick@gmail.com");
    console.log("✅ Teste 2: Atualização de chave Pix via token aprovada.");

    // 3. Testando rejeição quando e-mail já existe e senha fornecida é INCORRETA
    console.log("Testando tentativa de vinculação com senha incorreta de conta existente...");
    const emailExistente = `titular_existente_${randomSuffix}@gmail.com`;
    const hashExistente = await bcrypt.hash("SenhaCorretaExistente@2026", 10);
    userExistenteTeste = await prisma.user.create({
      data: {
        name: "Titular Existente",
        email: emailExistente,
        passwordHash: hashExistente,
        isActivated: true,
      },
    });

    // Cria outro participante temporário para testar vinculação
    userTemp2 = await prisma.user.create({
      data: {
        name: "Outro Participante Temp",
        email: `outro_temp_${randomSuffix}@clubedacota.local`,
        isActivated: false,
      },
    });

    const tokenLink2 = `cp_teste2_${randomSuffix}`;
    cotaTeste2 = await prisma.cota.create({
      data: {
        consorcioId: consorcioTeste.id,
        numero: 2,
        ordemSorteio: 2,
        tokenAcesso: `cota_teste2_${randomSuffix}`,
      },
    });

    cpTeste2 = await prisma.cotaParticipante.create({
      data: {
        cotaId: cotaTeste2.id,
        usuarioId: userTemp2.id,
        percentual: 100,
        valorParcela: 100,
        tokenAcesso: tokenLink2,
      },
    });

    const resSenhaIncorreta = await simularCompletarCadastro({
      token: tokenLink2,
      nome: "Tentativa Invasão",
      email: emailExistente,
      senha: "SenhaErradaQualquer",
    });

    assert.strictEqual(resSenhaIncorreta.success, false);
    assert(resSenhaIncorreta.error.includes("Já existe uma conta com este e-mail"));
    console.log("✅ Teste 3: Rejeição segura contra senha incorreta em conta existente aprovada.");

    // 4. Testando vinculação e mesclagem com senha CORRETA de conta existente
    console.log("Testando vinculação de cota com senha CORRETA de conta existente...");
    const resVinculacao = await simularCompletarCadastro({
      token: tokenLink2,
      nome: "Titular Existente",
      email: emailExistente,
      senha: "SenhaCorretaExistente@2026",
      tipoChavePix: "CPF_CNPJ",
      chavePix: "123.456.789-00",
      receberPixDireto: true,
    });

    assert(resVinculacao.success, "Vinculação com senha correta deve ter sucesso");
    assert.strictEqual(resVinculacao.usuarioId, userExistenteTeste.id, "ID final deve ser do usuário existente");

    // Valida que a cotaParticipante foi transferida para userExistenteTeste
    const cpTransferida = await prisma.cotaParticipante.findUnique({
      where: { tokenAcesso: tokenLink2 },
    });
    assert.strictEqual(cpTransferida.usuarioId, userExistenteTeste.id, "Cota deve pertencer ao usuário existente");

    // Valida que o usuário temporário órfão foi deletado
    const tempDeletado = await prisma.user.findUnique({ where: { id: userTemp2.id } });
    assert.strictEqual(tempDeletado, null, "Usuário provisório órfão deve ter sido removido");

    console.log("✅ Teste 4: Vinculação de cota à conta existente e mesclagem limpa aprovadas.");

    console.log("\n🎉 Todos os 4 testes de Cadastro e Vinculação de Participantes passaram com 100% de sucesso!");
  } finally {
    // Limpeza rigorosa dos dados de teste
    try {
      if (consorcioTeste) {
        await prisma.contribuicao.deleteMany({ where: { consorcioId: consorcioTeste.id } });
        await prisma.cotaParticipante.deleteMany({ where: { cota: { consorcioId: consorcioTeste.id } } });
        await prisma.cota.deleteMany({ where: { consorcioId: consorcioTeste.id } });
        await prisma.consorcio.delete({ where: { id: consorcioTeste.id } });
      }
      if (userTemp) await prisma.user.deleteMany({ where: { id: userTemp.id } });
      if (userTemp2) await prisma.user.deleteMany({ where: { id: userTemp2.id } });
      if (userExistenteTeste) await prisma.user.deleteMany({ where: { id: userExistenteTeste.id } });
      if (criadorTeste) await prisma.user.deleteMany({ where: { id: criadorTeste.id } });
    } catch (e) {
      // Ignora erro de limpeza
    }
    await prisma.$disconnect();
  }
}

runTests().catch((err) => {
  console.error("❌ Falha nos testes de cadastro de participante:", err);
  process.exit(1);
});
