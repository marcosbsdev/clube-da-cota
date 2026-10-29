# 🚀 Guia de Implantação do Clube da Cota na Vercel (Produção / PRD)

Este guia orienta o processo de deploy do **Clube da Cota** na **Vercel** com um banco de dados **PostgreSQL Serverless** na nuvem e apontamento de domínio próprio (ex: Registro.br).

---

## 1. Pré-Requisitos

1. Código versionado no repositório GitHub (já sincronizado).
2. Conta criada na [Vercel](https://vercel.com).
3. Conta criada no [Neon.tech](https://neon.tech/) (ou uso do *Vercel Postgres*).

---

## 2. Passo 1: Criar o Banco PostgreSQL na Nuvem (Neon Tech)

1. Acesse **[neon.tech](https://neon.tech)** e faça login com sua conta do GitHub.
2. Crie um novo projeto (ex: `clube-da-cota-prd`).
3. No painel do projeto, copie a **Connection String** (selecione a opção `Pooled connection` ou `Direct connection`).
   - Ela terá o formato:
     ```env
     DATABASE_URL="postgresql://neondb_owner:SENHA@ep-xyz.us-east-2.aws.neon.tech/neondb?sslmode=require"
     ```

---

## 3. Passo 2: Criar as Tabelas no Banco da Nuvem

No seu terminal local (ou máquina de desenvolvimento), aponte temporariamente o Prisma para a URL da nuvem para criar as tabelas e o usuário inicial:

```bash
# Executar as migrations no banco Neon
npx prisma db push --schema=prisma/schema.prisma
```

Para criar a sua conta oficial como **SUPER_ADMIN** no banco de produção:
```bash
# Executar seed ou cadastrar a sua conta diretamente
npx prisma db seed
```
*(Você também pode simplesmente se cadastrar na tela inicial e promover seu usuário no banco para `SUPER_ADMIN`).*

---

## 4. Passo 3: Importar o Projeto na Vercel

1. Acesse o dashboard da **[Vercel](https://vercel.com/new)**.
2. Clique em **"Add New..."** ➔ **"Project"**.
3. Selecione o repositório **`clube-da-cota`** da sua conta GitHub.
4. Na seção **Environment Variables**, adicione as seguintes variáveis:
   - `DATABASE_URL`: A connection string do Neon copiada no Passo 1.
   - `JWT_SECRET`: Uma chave secreta forte (ex: uma sequência aleatória de 32+ caracteres).
5. Clique no botão **"Deploy"**.

A Vercel executará o comando `postinstall` (`prisma generate`), compilará a aplicação e disponibilizará a URL pública (ex: `https://clube-da-cota.vercel.app`).

---

## 5. Passo 4: Configurar seu Domínio Próprio (Registro.br)

1. No painel do projeto na Vercel, acesse **Settings** ➔ **Domains**.
2. Digite o seu domínio (ex: `clubedacota.com.br` ou `app.seudominio.com.br`) e clique em **Add**.
3. A Vercel exibirá as entradas DNS necessárias:
   - Para domínio raiz (`seudominio.com.br`):
     - Tipo: **A** | Nome: `@` | Valor: `76.76.21.21`
   - Para subdomínio (`www` ou `app`):
     - Tipo: **CNAME** | Nome: `www` (ou `app`) | Valor: `cname.vercel-dns.com`
4. Acesse sua conta no **[Registro.br](https://registro.br)**, vá em **DNS** ➔ **Editar Zona** e insira esses apontamentos.
5. Em poucos minutos, a Vercel emitirá o certificado **SSL/HTTPS gratuito** automaticamente.
