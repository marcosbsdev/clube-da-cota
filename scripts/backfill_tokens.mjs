import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function gerarTokenCota() {
  return 'cota_' + crypto.randomBytes(6).toString('hex');
}

function gerarTokenParticipante() {
  return 'cp_' + crypto.randomBytes(6).toString('hex');
}

async function main() {
  console.log('🔄 Gerando tokens de acesso para Cotas e Participantes existentes...');

  const cotas = await prisma.cota.findMany({
    where: { tokenAcesso: null },
  });

  for (const c of cotas) {
    await prisma.cota.update({
      where: { id: c.id },
      data: { tokenAcesso: gerarTokenCota() },
    });
  }
  console.log(`✅ ${cotas.length} cotas atualizadas com token.`);

  const participantes = await prisma.cotaParticipante.findMany({
    where: { tokenAcesso: null },
  });

  for (const p of participantes) {
    await prisma.cotaParticipante.update({
      where: { id: p.id },
      data: { tokenAcesso: gerarTokenParticipante() },
    });
  }
  console.log(`✅ ${participantes.length} participantes atualizados com token.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
