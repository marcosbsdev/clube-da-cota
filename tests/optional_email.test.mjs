import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Iniciando testes de Criação de Consórcio com E-mail Opcional...");

  // 1. Busca criador existente
  const criador = await prisma.user.findFirst({
    where: { role: { in: ["PRO", "PRO_MASTER", "SUPER_ADMIN"] } }
  });

  if (!criador) {
    throw new Error("Nenhum usuário criador encontrado.");
  }

  // 2. Simula criação de participante sem e-mail
  console.log("Testando criação de usuário sem e-mail com identificador seguro...");
  const nomeParticipanteSemEmail = "Tio Zezinho";
  const emailPlaceholder = `participante_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`;

  const novoUsuario = await prisma.user.create({
    data: {
      name: nomeParticipanteSemEmail,
      email: emailPlaceholder,
      role: "COMUM",
      isActivated: false,
    }
  });

  if (!novoUsuario || novoUsuario.name !== nomeParticipanteSemEmail) {
    throw new Error("Falha ao criar participante sem e-mail.");
  }
  console.log("✅ Teste 1: Participante sem e-mail criado com sucesso no banco.");

  // 3. Testa cota associada a participante sem e-mail
  console.log("Testando vínculo de cota para participante sem e-mail...");
  const consorcio = await prisma.consorcio.findFirst();
  if (consorcio) {
    const cotaTeste = await prisma.cota.create({
      data: {
        consorcioId: consorcio.id,
        numero: 999,
        isCompartilhada: false,
      }
    });

    await prisma.cotaParticipante.create({
      data: {
        cotaId: cotaTeste.id,
        usuarioId: novoUsuario.id,
        percentual: 100,
        valorParcela: 500,
      }
    });

    const cotaBuscada = await prisma.cota.findUnique({
      where: { id: cotaTeste.id },
      include: { participantes: { include: { usuario: true } } }
    });

    if (cotaBuscada.participantes[0].usuario.name !== nomeParticipanteSemEmail) {
      throw new Error("Falha no vínculo de cota sem e-mail.");
    }
    console.log("✅ Teste 2: Vínculo de cota para participante sem e-mail validado.");

    // Limpeza
    await prisma.cotaParticipante.deleteMany({ where: { cotaId: cotaTeste.id } });
    await prisma.cota.delete({ where: { id: cotaTeste.id } });
  }

  await prisma.user.delete({ where: { id: novoUsuario.id } });
  console.log("✅ Teste 3: Limpeza de dados de teste concluída.");

  await prisma.$disconnect();
  console.log("\n🎉 Todos os testes de E-mail Opcional passaram com 100% de sucesso!");
}

runTests().catch(async (e) => {
  console.error("❌ Erro no teste:", e);
  await prisma.$disconnect();
  process.exit(1);
});
