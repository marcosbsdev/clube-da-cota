import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const deleted = await prisma.auditoriaLog.deleteMany({
    where: {
      justificativa: {
        contains: 'Teste automatizado'
      }
    }
  });
  console.log("Logs de teste excluídos:", deleted.count);

  const logs = await prisma.auditoriaLog.findMany({
    include: { usuarioResponsavel: true },
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("Logs restantes no banco:");
  for (const l of logs) {
    console.log("- ", l.tipoAcao, "|", l.detalhes?.slice(0, 100), "|", l.justificativa);
  }

  await prisma.$disconnect();
}

run();
