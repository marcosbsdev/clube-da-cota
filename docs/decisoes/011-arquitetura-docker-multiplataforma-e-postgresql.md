---
type: adr
title: "ADR 011: Arquitetura Docker Multi-Stage, Multiplataforma e Suporte Nativo a PostgreSQL"
status: "Aceito"
date: 2026-10-24
tags: [docker, docker-compose, postgresql, standalone, multi-stage, devops, infra]
---

# ADR 011: Arquitetura Docker Multi-Stage, Multiplataforma e Suporte Nativo a PostgreSQL

## Contexto
O projeto Clube da Cota foi inicialmente desenvolvido para rodar com Node.js nativo e banco de dados SQLite (`dev.db`). Com o planejamento de implantar a aplicação em um servidor independente (VPS ou bare-metal) e viabilizar a transição para bancos relacionais escaláveis (como PostgreSQL ou Supabase), fez-se necessária a containerização da aplicação com Docker.

## Decisão

### 1. Build Standalone Otimizado do Next.js
* Configurado `output: process.env.BUILD_STANDALONE === "true" ? "standalone" : undefined` em `next.config.mjs`.
* No build de produção dentro do container Docker, a flag `BUILD_STANDALONE=true` gera o bundle enxuto com Node.js embutido (`server.js`), reduzindo a imagem final para ~150 MB.
* No ambiente host (Windows), a compilação padrão ocorre sem problemas de links simbólicos ou restrições de permissão.

### 2. Dockerfile Multi-Stage Multiplataforma
* **Base:** `node:20-alpine` com pacotes `libc6-compat` e `openssl` (necessários para os binários nativos do Prisma no Alpine Linux).
* **Compatibilidade:** Funciona em arquiteturas `x86_64/amd64` (servidores padrão) e `arm64` (Apple Silicon, AWS Graviton, Raspberry Pi).
* **Segurança:** A execução final roda com o usuário não-root `nextjs:nodejs` (UID 1001).
* **Schema PostgreSQL no Container:** Durante o estágio de compilação, o container copia `prisma/schema.postgresql.prisma` para `prisma/schema.prisma`, garantindo que a aplicação seja empacotada com o client nativo do PostgreSQL.

### 3. Orquestração com Docker Compose (`docker-compose.yml`)
* **Serviço `app`:** Next.js rodando na porta 3000, interligado com o banco via rede interna Docker.
* **Serviço `db`:** PostgreSQL 16 Alpine na porta 5432, com volume persistente `postgres_data` e `healthcheck` ativo (`pg_isready`).
* **Inicialização Automatizada (`docker-entrypoint.sh`):**
  * Aguarda o PostgreSQL estar pronto para receber conexões.
  * Executa `prisma db push` automaticamente para criar/sincronizar tabelas.
  * Se o banco estiver recém-criado, roda `prisma/seed.mjs` populando o Super Admin inicial Marcos Batista (`markos.system@gmail.com`).

### 4. Flexibilidade no Ambiente Local
* Criados os schemas de referência:
  * `prisma/schema.postgresql.prisma` (PostgreSQL / Supabase / Docker)
  * `prisma/schema.sqlite.prisma` (SQLite local offline)
* Scripts cross-platform em `package.json`:
  * `npm run db:use:postgres`
  * `npm run db:use:sqlite`
  * `npm run docker:up` / `docker:down` / `docker:logs`

## Consequências
* A aplicação agora roda localmente com um único comando (`docker compose up --build -d`).
* Totalmente compatível com qualquer VPS ou servidor dedicado Linux.
* Preservada a execução offline dos 57 testes automatizados no ambiente local.
