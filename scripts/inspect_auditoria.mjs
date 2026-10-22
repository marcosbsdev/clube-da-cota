import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const logs = await prisma.auditoriaLog.findMany({
    include: {
      usuarioResponsavel: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });

  console.log("LOGS:");
  for (const log of logs) {
    console.log({
      id: log.id,
      tipoAcao: log.tipoAcao,
      detalhes: log.detalhes,
      justificativa: log.justificativa,
      responsavel: log.usuarioResponsavel?.name,
      createdAt: log.createdAt,
    });
  }
  await prisma.$disconnect();
}

run();
