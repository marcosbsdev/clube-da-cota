import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Inserindo usuários PRO e PRO_MASTER no banco ativo...");

  const passwordHash = await bcrypt.hash("123456", 10);

  // 1. Camila Pro
  let camila = await prisma.user.findUnique({
    where: { email: "camila.pro@exemplo.com" },
  });

  if (!camila) {
    camila = await prisma.user.create({
      data: {
        name: "Camila Pro",
        email: "camila.pro@exemplo.com",
        passwordHash,
        role: "PRO",
        preferredTheme: "purple",
        isActivated: true,
      },
    });
    console.log("✅ Usuária Camila Pro criada com nível PRO.");
  } else {
    camila = await prisma.user.update({
      where: { id: camila.id },
      data: { role: "PRO" },
    });
    console.log("ℹ️ Camila Pro já existia e foi atualizada para PRO.");
  }

  // 2. Renato Master
  let renato = await prisma.user.findUnique({
    where: { email: "renato.master@exemplo.com" },
  });

  if (!renato) {
    renato = await prisma.user.create({
      data: {
        name: "Renato Master",
        email: "renato.master@exemplo.com",
        passwordHash,
        role: "PRO_MASTER",
        preferredTheme: "dark",
        isActivated: true,
      },
    });
    console.log("✅ Usuário Renato Master criado com nível PRO_MASTER.");
  } else {
    renato = await prisma.user.update({
      where: { id: renato.id },
      data: { role: "PRO_MASTER" },
    });
    console.log("ℹ️ Renato Master já existia e foi atualizado para PRO_MASTER.");
  }

  // 3. Consórcio de demonstração da Camila Pro (se ainda não existir)
  const consorcioExistente = await prisma.consorcio.findFirst({
    where: { criadorId: camila.id },
  });

  if (!consorcioExistente) {
    const consorcioPro = await prisma.consorcio.create({
      data: {
        nome: "Consórcio Viagem 2026 - Pro",
        finalidade: "Fundo para viagem de fim de ano",
        regras: "Vencimentos mensais até o dia 10.",
        dataInicio: new Date("2026-11-01"),
        dataPrimeiroVencimento: new Date("2026-11-10"),
        frequencia: "MENSAL",
        valorCota: 800.0,
        valorTotalBolada: 4000.0,
        totalCotas: 5,
        criadorId: camila.id,
        chavePix: "camila.pro@exemplo.com",
      },
    });

    for (let i = 1; i <= 5; i++) {
      const cota = await prisma.cota.create({
        data: { consorcioId: consorcioPro.id, numero: i, isCompartilhada: false },
      });
      const uid = i === 1 ? camila.id : i === 2 ? renato.id : camila.id;
      await prisma.cotaParticipante.create({
        data: { cotaId: cota.id, usuarioId: uid, percentual: 100.0, valorParcela: 800.0 },
      });
      await prisma.contribuicao.create({
        data: {
          consorcioId: consorcioPro.id,
          cotaId: cota.id,
          usuarioId: uid,
          numeroCiclo: 1,
          valorPrevisto: 800.0,
          dataVencimento: new Date("2026-11-10"),
          status: i === 1 ? "PAGO" : "PENDENTE",
        },
      });
    }
    console.log("✅ Consórcio Viagem 2026 - Pro criado para Camila Pro.");
  }

  console.log("🎉 Concluído com sucesso!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
