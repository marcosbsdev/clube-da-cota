import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Inicializando conta do Super Admin em Produção...");

  const emailAdmin = process.env.ADMIN_EMAIL || "markos.system@gmail.com";
  const nomeAdmin = process.env.ADMIN_NAME || "Marcos Batista";
  const senhaPadrao = process.env.ADMIN_PASSWORD || "123456";

  const existente = await prisma.user.findUnique({
    where: { email: emailAdmin },
  });

  if (existente) {
    console.log(`⚠️ Usuário ${emailAdmin} já existe com o papel ${existente.role}.`);
    if (existente.role !== "SUPER_ADMIN") {
      await prisma.user.update({
        where: { id: existente.id },
        data: { role: "SUPER_ADMIN" },
      });
      console.log(`✅ Papel do usuário ${emailAdmin} atualizado para SUPER_ADMIN.`);
    }
    return;
  }

  const passwordHash = await bcrypt.hash(senhaPadrao, 10);

  const admin = await prisma.user.create({
    data: {
      name: nomeAdmin,
      email: emailAdmin,
      passwordHash,
      role: "SUPER_ADMIN",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  console.log(`\n🎉 Super Admin criado com sucesso!`);
  console.log(`- Nome: ${admin.name}`);
  console.log(`- E-mail: ${admin.email}`);
  console.log(`- Papel: ${admin.role}`);
  console.log(`- Senha inicial: ${senhaPadrao}`);
  console.log(`\n💡 Lembre-se de alterar sua senha na aba "Perfil" após o primeiro login.`);
}

main()
  .catch((e) => {
    console.error("❌ Erro ao criar conta de admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
