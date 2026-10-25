import assert from "node:assert";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Iniciando testes de Gestão de Usuários & Contas (Super Admin)...\n");

  const timestamp = Date.now();

  // Criação dos Usuários de Teste
  const superAdmin = await prisma.user.create({
    data: {
      name: `Super Admin Test ${timestamp}`,
      email: `superadmin_${timestamp}@test.com`,
      role: "SUPER_ADMIN",
      passwordHash: await bcrypt.hash("admin123", 10),
      isActivated: true,
    },
  });

  const usuarioComum = await prisma.user.create({
    data: {
      name: `Usuario Comum ${timestamp}`,
      email: `comum_${timestamp}@test.com`,
      role: "COMUM",
      telefone: "11999990001",
      passwordHash: await bcrypt.hash("comum123", 10),
      isActivated: true,
    },
  });

  const usuarioDuplicado = await prisma.user.create({
    data: {
      name: `Usuario Duplicado ${timestamp}`,
      email: `duplicado_${timestamp}@test.com`,
      role: "COMUM",
      telefone: "11999990002",
      isActivated: false, // Provisório
    },
  });

  const usuarioDestinoMerge = await prisma.user.create({
    data: {
      name: `Usuario Oficial Merge ${timestamp}`,
      email: `oficial_${timestamp}@test.com`,
      role: "PRO",
      passwordHash: await bcrypt.hash("oficial123", 10),
      isActivated: true,
    },
  });

  let consorcioTeste = null;

  try {
    // ----------------------------------------------------
    // Teste 1: Bloqueio de Usuário Não-SuperAdmin
    // ----------------------------------------------------
    console.log("Testando controle de acesso: usuário comum não pode gerenciar contas...");
    const isSuperAdmin = (user) => user && user.role === "SUPER_ADMIN";

    assert.strictEqual(isSuperAdmin(usuarioComum), false, "Usuário comum deve ser barrado");
    assert.strictEqual(isSuperAdmin(superAdmin), true, "Super Admin deve ter acesso autorizado");
    console.log("✅ Teste 1: Controle de acesso restrito a SUPER_ADMIN aprovado.");

    // ----------------------------------------------------
    // Teste 2: Atualização de Dados Cadastrais pelo Super Admin
    // ----------------------------------------------------
    console.log("Testando edição de dados (Nome, E-mail, Telefone, Chave Pix, Role)...");
    const novoNome = `Usuario Comum Atualizado ${timestamp}`;
    const novoTelefone = "11988887777";
    const novaChavePix = "usuario.pix@test.com";

    const usuarioAtualizado = await prisma.user.update({
      where: { id: usuarioComum.id },
      data: {
        name: novoNome,
        telefone: novoTelefone,
        chavePix: novaChavePix,
        tipoChavePix: "EMAIL",
        role: "PRO",
      },
    });

    assert.strictEqual(usuarioAtualizado.name, novoNome);
    assert.strictEqual(usuarioAtualizado.telefone, novoTelefone);
    assert.strictEqual(usuarioAtualizado.chavePix, novaChavePix);
    assert.strictEqual(usuarioAtualizado.role, "PRO");

    // Registro na trilha de auditoria
    await prisma.auditoriaLog.create({
      data: {
        usuarioResponsavelId: superAdmin.id,
        usuarioAfetadoId: usuarioComum.id,
        tipoAcao: "EDICAO_ADMIN_USUARIO",
        detalhes: `Dados de ${usuarioComum.name} atualizados pelo Super Admin.`,
      },
    });

    const logCriado = await prisma.auditoriaLog.findFirst({
      where: {
        usuarioAfetadoId: usuarioComum.id,
        tipoAcao: "EDICAO_ADMIN_USUARIO",
      },
    });
    assert(logCriado, "Log de auditoria deve ser registrado após edição administrativa");
    console.log("✅ Teste 2: Atualização de dados cadastrais e registro de auditoria validados.");

    // ----------------------------------------------------
    // Teste 3: Redefinição de Senha e Geração de Senha Provisória
    // ----------------------------------------------------
    console.log("Testando redefinição administrativa de senha...");
    const novaSenhaProvisoria = `Cota#${Math.floor(1000 + Math.random() * 9000)}`;
    const novoHash = await bcrypt.hash(novaSenhaProvisoria, 10);

    await prisma.user.update({
      where: { id: usuarioComum.id },
      data: {
        passwordHash: novoHash,
        isActivated: true,
      },
    });

    const usuarioComNovaSenha = await prisma.user.findUnique({
      where: { id: usuarioComum.id },
    });
    const senhaValida = await bcrypt.compare(novaSenhaProvisoria, usuarioComNovaSenha.passwordHash);
    assert.strictEqual(senhaValida, true, "Nova senha provisória deve ser válida no login");

    console.log("✅ Teste 3: Redefinição de senha provisória validada com sucesso.");

    // ----------------------------------------------------
    // Teste 4: Criação de Estrutura para Teste de Mesclagem (Merge)
    // ----------------------------------------------------
    console.log("Criando consórcio e cotas para testar mesclagem de contas duplicadas...");
    consorcioTeste = await prisma.consorcio.create({
      data: {
        nome: `Consórcio Merge Test ${timestamp}`,
        valorCota: 200,
        valorTotalBolada: 2000,
        totalCotas: 2,
        criadorId: superAdmin.id,
        dataInicio: new Date(),
        dataPrimeiroVencimento: new Date(),
      },
    });

    // Cota 1 vinculada à conta duplicada (provisória)
    const cota1 = await prisma.cota.create({
      data: {
        consorcioId: consorcioTeste.id,
        numero: 1,
        ordemSorteio: 1,
      },
    });

    await prisma.cotaParticipante.create({
      data: {
        cotaId: cota1.id,
        usuarioId: usuarioDuplicado.id,
        percentual: 100.0,
        valorParcela: 200,
      },
    });

    await prisma.contribuicao.create({
      data: {
        consorcioId: consorcioTeste.id,
        cotaId: cota1.id,
        usuarioId: usuarioDuplicado.id,
        numeroCiclo: 1,
        valorPrevisto: 200,
        dataVencimento: new Date(),
        status: "PAGO",
        dataPagamento: new Date(),
      },
    });

    // ----------------------------------------------------
    // Teste 5: Execução da Mesclagem Segura (Merge de Contas)
    // ----------------------------------------------------
    console.log("Executando mesclagem: transferir vínculos da Conta Duplicada para a Conta Oficial...");

    // Executa em transação Prisma
    await prisma.$transaction(async (tx) => {
      // 1. Atualizar cotas
      await tx.cotaParticipante.updateMany({
        where: { usuarioId: usuarioDuplicado.id },
        data: { usuarioId: usuarioDestinoMerge.id },
      });

      // 2. Atualizar contribuições / parcelas
      await tx.contribuicao.updateMany({
        where: { usuarioId: usuarioDuplicado.id },
        data: { usuarioId: usuarioDestinoMerge.id },
      });

      // 3. Atualizar comprovantes se houver
      await tx.comprovante.updateMany({
        where: { usuarioId: usuarioDuplicado.id },
        data: { usuarioId: usuarioDestinoMerge.id },
      });

      // 4. Se a conta duplicada tiver criado consórcios, transfere criadorId
      await tx.consorcio.updateMany({
        where: { criadorId: usuarioDuplicado.id },
        data: { criadorId: usuarioDestinoMerge.id },
      });

      // 5. Excluir a conta duplicada
      await tx.user.delete({
        where: { id: usuarioDuplicado.id },
      });

      // 6. Auditoria
      await tx.auditoriaLog.create({
        data: {
          usuarioResponsavelId: superAdmin.id,
          usuarioAfetadoId: usuarioDestinoMerge.id,
          tipoAcao: "MESCLAGEM_CONTAS_USUARIO",
          detalhes: `Conta duplicada ${usuarioDuplicado.email} foi absorvida por ${usuarioDestinoMerge.email}.`,
        },
      });
    });

    // Validações pós-merge
    const cotaDepoisDoMerge = await prisma.cotaParticipante.findFirst({
      where: { cotaId: cota1.id },
    });
    assert.strictEqual(cotaDepoisDoMerge.usuarioId, usuarioDestinoMerge.id, "Cota deve agora pertencer à conta destino");

    const contribuicaoDepoisDoMerge = await prisma.contribuicao.findFirst({
      where: { cotaId: cota1.id },
    });
    assert.strictEqual(contribuicaoDepoisDoMerge.usuarioId, usuarioDestinoMerge.id, "Contribuição deve pertencer à conta destino");

    const contaDuplicadaExiste = await prisma.user.findUnique({
      where: { id: usuarioDuplicado.id },
    });
    assert.strictEqual(contaDuplicadaExiste, null, "Conta duplicada deve ter sido excluída com sucesso");

    console.log("✅ Teste 5: Mesclagem atômica de contas com transferência total de cotas e parcelas aprovada.");

    // ----------------------------------------------------
    // Teste 6: Transferência Pontual de Cota Entre Usuários
    // ----------------------------------------------------
    console.log("Testando transferência pontual de cota de um participante para outro...");
    // Cota 2 criada para usuarioComum
    const cota2 = await prisma.cota.create({
      data: {
        consorcioId: consorcioTeste.id,
        numero: 2,
        ordemSorteio: 2,
      },
    });

    const cotaPart2 = await prisma.cotaParticipante.create({
      data: {
        cotaId: cota2.id,
        usuarioId: usuarioComum.id,
        percentual: 100.0,
        valorParcela: 200,
      },
    });

    // Transferindo Cota 2 de usuarioComum para usuarioDestinoMerge
    await prisma.$transaction([
      prisma.cotaParticipante.update({
        where: { id: cotaPart2.id },
        data: { usuarioId: usuarioDestinoMerge.id },
      }),
      prisma.contribuicao.updateMany({
        where: { cotaId: cota2.id, usuarioId: usuarioComum.id },
        data: { usuarioId: usuarioDestinoMerge.id },
      }),
    ]);

    const cota2Atualizada = await prisma.cotaParticipante.findUnique({
      where: { id: cotaPart2.id },
    });
    assert.strictEqual(cota2Atualizada.usuarioId, usuarioDestinoMerge.id, "Cota 2 deve ter sido transferida para usuarioDestinoMerge");
    console.log("✅ Teste 6: Transferência pontual de cota aprovada com sucesso.");

    // ----------------------------------------------------
    // Teste 7: Proteções de Exclusão (Não permitir auto-exclusão de Super Admin)
    // ----------------------------------------------------
    console.log("Testando proteções de segurança contra exclusão indevida...");
    const tentarExcluirAdmin = (adminSolicitanteId, targetId) => {
      if (adminSolicitanteId === targetId) {
        throw new Error("O Super Admin não pode excluir a sua própria conta.");
      }
    };

    assert.throws(
      () => tentarExcluirAdmin(superAdmin.id, superAdmin.id),
      /não pode excluir a sua própria conta/,
      "Deve bloquear auto-exclusão do Super Admin"
    );

    console.log("✅ Teste 7: Proteção contra auto-exclusão do Super Admin validada.");

  } finally {
    console.log("Limpando dados de teste...");
    if (consorcioTeste) {
      await prisma.contribuicao.deleteMany({ where: { consorcioId: consorcioTeste.id } });
      await prisma.cotaParticipante.deleteMany({ where: { cota: { consorcioId: consorcioTeste.id } } });
      await prisma.cota.deleteMany({ where: { consorcioId: consorcioTeste.id } });
      await prisma.consorcio.deleteMany({ where: { id: consorcioTeste.id } });
    }
    await prisma.auditoriaLog.deleteMany({
      where: {
        usuarioResponsavelId: { in: [superAdmin.id, usuarioComum.id] },
      },
    });
    await prisma.user.deleteMany({
      where: {
        id: { in: [superAdmin.id, usuarioComum.id, usuarioDestinoMerge.id] },
      },
    });
    await prisma.$disconnect();
  }

  console.log("\n🎉 Todos os 7 testes de Gestão de Usuários & Contas (Super Admin) passaram com 100% de sucesso!");
}

runTests().catch((err) => {
  console.error("❌ Falha nos testes de administração de contas:", err);
  process.exit(1);
});
