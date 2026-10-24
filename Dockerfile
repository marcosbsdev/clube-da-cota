# ==========================================
# CLUBE DA COTA - DOCKERFILE MULTI-STAGE
# Otimizado para Produção, Standalone (~150MB) e Multiplataforma (x86_64 / ARM64)
# ==========================================

# Estágio 1: Imagem Base com OpenSSL para Prisma
FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Estágio 2: Instalação de Dependências
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Estágio 3: Compilação da Aplicação
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# No container, utiliza o schema PostgreSQL para produção e migrations
COPY prisma/schema.postgresql.prisma prisma/schema.prisma

ENV BUILD_STANDALONE=true
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx prisma generate
RUN npm run build

# Estágio 4: Imagem Final de Execução (Runner)
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário de sistema sem privilégios de root por segurança
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos e bundle standalone enxuto
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

# Script de inicialização e sincronização do banco
COPY --chown=nextjs:nodejs docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
