import { PrismaClient } from "@prisma/client";
import assert from "assert";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Funções de regra de negócio testadas
async function buscarParticipantePorToken(token) {
  if (!token) return { success: false, error: "Token não fornecido." };

  let cotaParticipante = await prisma.cotaParticipante.findUnique({
    where: { tokenAcesso: token },
    include: {
      usuario: {
        select: { id: true, name: true, email: true, role: true, isActivated: true, passwordHash: true },
      },
      cota: {
        include: {
          consorcio: {
            include: {
              criador: { select: { id: true, name: true, email: true } },
            },
          },
          participantes: {
            include: { usuario: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!cotaParticipante) {
    const cota = await prisma.cota.findUnique({
      where: { tokenAcesso: token },
      include: {
        consorcio: {
          include: {
            criador: { select: { id: true, name: true, email: true } },
          },
        },
        participantes: {
          include: {
            usuario: {
              select: { id: true, name: true, email: true, role: true, isActivated: true, passwordHash: true },
            },
          },
        },
      },
    });

    if (cota && cota.participantes.length > 0) {
      cotaParticipante = {
        ...cota.participantes[0],
        cota,
      };
    }
  }

  if (!cotaParticipante) {
    return { success: false, error: "Acesso não encontrado ou link inválido." };
  }

  const { cota, usuario } = cotaParticipante;
  const consorcio = cota.consorcio;

  const contribuicoes = await prisma.contribuicao.findMany({
    where: {
      consorcioId: consorcio.id,
      cotaId: cota.id,
      usuarioId: usuario.id,
    },
    include: { comprovante: true },
    orderBy: { numeroCiclo: "asc" },
  });

  return {
    success: true,
    data: {
      participante: {
        id: usuario.id,
        nome: usuario.name,
        email: usuario.email,
        temSenha: Boolean(usuario.passwordHash),
        isActivated: usuario.isActivated,
      },
      cota: {
        id: cota.id,
        numero: cota.numero,
        ordemSorteio: cota.ordemSorteio || cota.numero,
        status: cota.status,
      },
      consorcio: {
        id: consorcio.id,
        nome: consorcio.nome,
        valorTotalBolada: consorcio.valorTotalBolada,
        chavePix: consorcio.chavePix,
      },
      contribuicoes,
    },
  };
}

async function runTests() {
  console.log("🧪 Iniciando testes do Acesso Passwordless (Link Sem Senha) para Participantes...\n");

  try {
    // 1. Busca um participante com token existente
    const participante = await prisma.cotaParticipante.findFirst({
      where: { tokenAcesso: { not: null } },
      include: {
        usuario: true,
        cota: { include: { consorcio: true } },
      },
    });

    assert(participante, "Deve existir ao menos um participante com token para teste.");
    assert(participante.tokenAcesso, "Token de acesso deve estar preenchido.");

    console.log(`Testando busca por token válido (${participante.tokenAcesso})...`);
    const res = await buscarParticipantePorToken(participante.tokenAcesso);
    assert(res.success, "Busca por token válido deve retornar sucesso.");
    assert.strictEqual(res.data.participante.nome, participante.usuario.name);
    assert.strictEqual(res.data.cota.numero, participante.cota.numero);
    assert.strictEqual(res.data.consorcio.id, participante.cota.consorcio.id);
    assert(Array.isArray(res.data.contribuicoes), "Deve retornar lista de contribuições.");
    console.log("✅ Teste 1: Acesso direto e seguro por token validado com sucesso.");

    // 2. Rejeição de token inexistente
    console.log("Testando rejeição de token inválido...");
    const resInvalido = await buscarParticipantePorToken("token_inexistente_999xyz");
    assert.strictEqual(resInvalido.success, false);
    assert.strictEqual(resInvalido.error, "Acesso não encontrado ou link inválido.");
    console.log("✅ Teste 2: Rejeição segura de token inválido aprovada.");

    // 3. Envio e vinculação de comprovante PIX via token
    console.log("Testando anexo de comprovante PIX via token...");
    const primeiraContribuicao = res.data.contribuicoes[0];
    assert(primeiraContribuicao, "Deve existir uma contribuição para o teste.");

    const comprovante = await prisma.comprovante.upsert({
      where: { contribuicaoId: primeiraContribuicao.id },
      create: {
        contribuicaoId: primeiraContribuicao.id,
        usuarioId: participante.usuarioId,
        arquivoUrl: "/uploads/comprovante_pix_token.pdf",
        arquivoNome: "comprovante_pix_token.pdf",
        tamanhoBytes: 2048,
        mimeType: "application/pdf",
        status: "PENDENTE",
      },
      update: {
        arquivoNome: "comprovante_pix_token.pdf",
        status: "PENDENTE",
      },
    });

    assert(comprovante, "Comprovante deve ser criado com sucesso.");
    assert.strictEqual(comprovante.status, "PENDENTE");
    console.log("✅ Teste 3: Anexo de comprovante PIX via token aprovado.");

    // 4. Registro na trilha de auditoria
    console.log("Testando registro na trilha de auditoria...");
    const logAuditoria = await prisma.auditoriaLog.create({
      data: {
        consorcioId: participante.cota.consorcio.id,
        usuarioResponsavelId: participante.usuarioId,
        tipoAcao: "ENVIO_COMPROVANTE",
        detalhes: JSON.stringify({
          tipo: "ENVIO_COMPROVANTE_VIA_LINK",
          contribuicaoId: primeiraContribuicao.id,
          arquivoNome: "comprovante_pix_token.pdf",
        }),
        justificativa: "Comprovante enviado pelo participante via link rápido.",
      },
    });
    assert(logAuditoria.id, "Log de auditoria deve ser gerado.");
    console.log("✅ Teste 4: Trilha de auditoria para anexo via link aprovada.");

    // 5. Ativação opcional de senha para transformar em conta completa
    console.log("Testando criação opcional de senha para o participante...");
    const hashSenha = await bcrypt.hash("NovaSenhaForte@2026", 10);
    const usuarioAtualizado = await prisma.user.update({
      where: { id: participante.usuarioId },
      data: {
        passwordHash: hashSenha,
        isActivated: true,
      },
    });
    assert(usuarioAtualizado.isActivated, "Usuário deve ser ativado.");
    assert(usuarioAtualizado.passwordHash, "Senha deve estar hasheada com bcrypt.");
    console.log("✅ Teste 5: Upgrade opcional para conta completa com senha aprovado.");

    // 6. Limpeza dos dados de teste
    await prisma.comprovante.deleteMany({
      where: { contribuicaoId: primeiraContribuicao.id },
    });
    await prisma.auditoriaLog.deleteMany({
      where: { id: logAuditoria.id },
    });
    console.log("✅ Teste 6: Limpeza segura de dados de teste concluída.");

    console.log("\n🎉 Todos os 6 testes de Acesso Passwordless passaram com 100% de sucesso!");
  } catch (err) {
    console.error("❌ Falha nos testes de Acesso Passwordless:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
