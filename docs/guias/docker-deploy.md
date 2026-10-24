---
type: guide
title: "Guia de Execução Local com Docker e Deploy em Servidor Dedicado"
description: "Manual prático para rodar o Clube da Cota localmente via Docker Compose e implantar em servidor independente/VPS com PostgreSQL."
tags: [docker, docker-compose, postgresql, deploy, vps, servidor-dedicado]
---

# 🐳 Guia de Execução com Docker & Deploy em Servidor

Este guia explica como executar o **Clube da Cota** em containers Docker localmente e como realizar o deploy em um servidor independente (VPS ou bare-metal).

---

## 🚀 1. Executando Localmente com Docker

### Pré-requisitos
* Ter o **Docker Desktop** instalado e em execução na máquina.

### Passo a Passo
1. Abra o terminal na raiz do projeto:
   ```bash
   cd clube-da-cota
   ```

2. Inicie os containers com build automático:
   ```bash
   npm run docker:up
   # ou diretamente:
   docker compose up --build -d
   ```

3. O Docker Compose iniciará:
   * **`clube-da-cota-db`**: Banco PostgreSQL 16 na porta `5432` com volume persistente `postgres_data`.
   * **`clube-da-cota-app`**: Aplicação Next.js compilada em modo standalone na porta `3000`.

4. O script de inicialização (`docker-entrypoint.sh`):
   * Aguarda a conexão do PostgreSQL ficar pronta.
   * Executa `prisma db push` para criar/sincronizar todas as tabelas.
   * Se for a primeira inicialização, executa o seed criando o Super Admin **Marcos Batista** (`markos.system@gmail.com` / senha: `123456`).

5. Acesse no navegador:
   👉 **`http://localhost:3000`**

### Comandos Úteis
* **Ver logs em tempo real:**
  ```bash
  npm run docker:logs
  # ou:
  docker compose logs -f app
  ```
* **Parar os containers:**
  ```bash
  npm run docker:down
  # ou:
  docker compose down
  ```
* **Parar e apagar os dados do banco para recomeçar do zero:**
  ```bash
  docker compose down -v
  ```

---

## 🌐 2. Deploy em Servidor Dedicado / VPS (Hetzner, DigitalOcean, Linode, AWS)

Para colocar em produção no seu servidor independente:

### Passo 1: Clonar o Repositório no Servidor
```bash
git clone https://github.com/marcosbsdev/clube-da-cota.git
cd clube-da-cota
```

### Passo 2: Configurar o arquivo `.env`
Copie o exemplo e configure uma senha forte para o banco de dados:
```bash
cp .env.example .env
```
Altere no `.env` e no `docker-compose.yml` a senha do PostgreSQL (`POSTGRES_PASSWORD`).

### Passo 3: Iniciar a Aplicação
```bash
docker compose up --build -d
```

### Passo 4: Configurar SSL / HTTPS Automático (com Caddy ou Nginx)
Recomendamos o **Caddy** como reverse proxy, pois ele gera e renova certificados SSL (HTTPS) da Let's Encrypt automaticamente.

Exemplo de `Caddyfile` no servidor:
```caddy
seusite.com.br {
    reverse_proxy localhost:3000
}
```

---

## 🔄 3. Alternando entre SQLite Local e PostgreSQL

Para desenvolvedores que desejam alternar o schema do Prisma localmente:

* **Para usar PostgreSQL / Supabase:**
  ```bash
  npm run db:use:postgres
  ```
* **Para voltar para SQLite local:**
  ```bash
  npm run db:use:sqlite
  ```
