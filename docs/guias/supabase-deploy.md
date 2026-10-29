# ⚡ Guia de Deploy: Vercel + Supabase (Produção / PRD)

Este guia documenta a arquitetura de produção do **Clube da Cota** utilizando **Vercel** (Frontend e Serverless Next.js) e **Supabase** (PostgreSQL Gerenciado).

---

## 1. Arquitetura em Produção

```mermaid
flowchart LR
    A["Cliente / Cotista (Web / PWA)"] --> B["Vercel Edge Network (Next.js 14)"]
    B -->|Prisma ORM com SSL| C["Supabase PostgreSQL 17 (Pooler 5432)"]
    D["Registro.br (Domínio Customizado)"] -->|DNS A / CNAME| B
```

- **Frontend & Server Actions:** Vercel (Hobby / Pro) com build automático conectado ao GitHub.
- **Banco de Dados:** Supabase PostgreSQL 17 gerenciado com backups, SSL obrigatório e Session Pooler.
- **Domínio & Segurança:** Registro.br com certificado SSL/TLS automático emitido pela Vercel.

---

## 2. Variáveis de Ambiente na Vercel

No painel da Vercel (**Settings ➔ Environment Variables**), configure:

| Variável | Descrição | Exemplo |
| :--- | :--- | :--- |
| `DATABASE_URL` | Connection String do Supabase com senha codificada em URL | `postgresql://postgres.[REF]:[SENHA_ENCODED]@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require` |
| `JWT_SECRET` | Chave secreta para criptografia de sessões | `clube-da-cota-secret-key-prod-2026-super-secure` |

> [!NOTE]
> Caracteres especiais na senha do banco (como `?`, `!`, `+`, `$`) devem estar codificados em formato URI (`%3F`, `%21`, `%2B`, `%24`) para evitar falhas de parse de URL pelo Prisma e Node.js.

---

## 3. Comandos Úteis de Manutenção

- **Aplicar novas alterações de schema no Supabase:**
  ```bash
  $env:DATABASE_URL="sua-connection-string"; npx prisma db push --skip-generate
  ```
- **Criar ou restaurar o Super Admin oficial:**
  ```bash
  $env:DATABASE_URL="sua-connection-string"; node scripts/seed-admin.mjs
  ```
