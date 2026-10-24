import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const target = process.argv[2];

if (target !== "postgres" && target !== "sqlite") {
  console.error("Uso: node scripts/switch-db.mjs [postgres|sqlite]");
  process.exit(1);
}

const sourceFile =
  target === "postgres"
    ? path.join("prisma", "schema.postgresql.prisma")
    : path.join("prisma", "schema.sqlite.prisma");

const destFile = path.join("prisma", "schema.prisma");

if (!fs.existsSync(sourceFile)) {
  console.error(`Arquivo fonte não encontrado: ${sourceFile}`);
  process.exit(1);
}

fs.copyFileSync(sourceFile, destFile);
console.log(`✅ Schema Prisma alterado com sucesso para [${target.toUpperCase()}].`);
console.log("⚙️  Executando npx prisma generate...");

try {
  execSync("npx prisma generate", { stdio: "inherit" });
  console.log(`🎉 Prisma Client atualizado para ${target.toUpperCase()}!`);
} catch (e) {
  console.error("Erro ao rodar prisma generate:", e.message);
  process.exit(1);
}
