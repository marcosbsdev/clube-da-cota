import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const cotas = await prisma.cota.findMany({
    include: {
      participantes: {
        include: { usuario: true }
      }
    },
    orderBy: { numero: 'asc' }
  });

  for (const c of cotas) {
    const nomes = c.participantes.map(p => p.usuario?.name).join(" & ");
    console.log(`Cota #${c.numero} (Ciclo #${c.ordemSorteio || c.numero}): ${nomes}`);
  }

  await prisma.$disconnect();
}

run();
