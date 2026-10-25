import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  console.log("🧹 Excluindo contas de teste e garantindo apenas o Super Admin oficial...\n");

  const oficialSuperAdmin = await prisma.user.findFirst({
    where: { email: 'markos.system@gmail.com' },
  });

  if (!oficialSuperAdmin) {
    console.error("❌ ERRO: Super Admin oficial 'markos.system@gmail.com' não encontrado!");
    process.exit(1);
  }

  // Excluir qualquer usuário que não seja o Super Admin oficial
  const delUsers = await prisma.user.deleteMany({
    where: {
      id: { not: oficialSuperAdmin.id },
    },
  });

  console.log(`- Contas adicionais/testes excluídas: ${delUsers.count}`);

  const remainingUsers = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
  });
  const remainingConsorcios = await prisma.consorcio.findMany({});

  console.log("\n✅ Estado final do banco de dados:");
  console.log("Usuários restantes (exatamente 1):", JSON.stringify(remainingUsers, null, 2));
  console.log(`Consórcios restantes: ${remainingConsorcios.length}`);

  await prisma.$disconnect();
}

run().catch(async (e) => {
  console.error("Erro:", e);
  await prisma.$disconnect();
  process.exit(1);
});
