#!/bin/sh
set -e

echo "🚀 Iniciando Clube da Cota..."

# Aguarda o banco de dados responder caso DATABASE_URL esteja definida
if [ -n "$DATABASE_URL" ]; then
  echo "📡 Verificando disponibilidade do banco de dados..."
  node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function check() {
      for (let i = 0; i < 30; i++) {
        try {
          await prisma.\$connect();
          console.log('✅ Banco de dados conectado com sucesso!');
          await prisma.\$disconnect();
          process.exit(0);
        } catch (e) {
          console.log('⏳ Aguardando banco de dados (' + (i + 1) + '/30)...');
          await new Promise(r => setTimeout(r, 1000));
        }
      }
      console.error('❌ Tempo limite esgotado para conexão com o banco.');
      process.exit(1);
    }
    check();
  "

  # Aplica migrações versionadas do Prisma Migrate no PostgreSQL
  echo "📦 Aplicando migrações do Prisma Migrate no PostgreSQL..."
  if [ -f "node_modules/prisma/build/index.js" ]; then
    node node_modules/prisma/build/index.js migrate deploy
  fi

  # Verifica se o banco está vazio e roda o seed inicial com o usuário Marcos Batista
  SEED_STATUS=$(node -e "
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    prisma.user.count().then(count => {
      console.log(count === 0 ? 'SEED_NEEDED' : 'OK');
      process.exit(0);
    }).catch(() => {
      console.log('ERROR');
      process.exit(0);
    });
  ")

  if [ "$SEED_STATUS" = "SEED_NEEDED" ] && [ -f "prisma/seed.mjs" ]; then
    echo "🌱 Banco recém-criado detectado. Criando administrador Marcos Batista e dados iniciais..."
    node prisma/seed.mjs || true
  fi
fi

if [ $# -gt 0 ]; then
  echo "⚡ Executando comando customizado: $@"
  exec "$@"
fi

echo "✨ Servidor Clube da Cota pronto na porta $PORT!"
exec node server.js
