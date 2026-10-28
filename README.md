# 🤝 Clube da Cota

> **Plataforma SaaS moderna e responsiva (PWA) para organização, automação e gerenciamento financeiro transparente de consórcios entre amigos, colegas de trabalho e familiares.**

O **Clube da Cota** atua como uma ferramenta profissional de **controle e registro financeiro**, proporcionando clareza matemática, previsibilidade de recebimento e confiabilidade absoluta aos participantes e administradores.

---

## 🚀 Como Executar o Projeto Localmente

Você pode rodar a aplicação de duas formas: **100% no Docker** (recomendado para testes rápidos de ponta a ponta) ou no **Modo Híbrido** (desenvolvimento local com o banco de dados no Docker).

### Pré-requisitos
* **Node.js** v20+ (caso rode o Next.js localmente)
* **Docker Desktop** (com suporte a Docker Compose)
* **Git**

---

### Opção A: Execução 100% via Docker (Recomendado)

Com apenas um comando, sobem a aplicação Next.js, o banco PostgreSQL 16 e o Prisma Studio:

```bash
# 1. Clonar o repositório
git clone https://github.com/marcosbsdev/clube-da-cota.git
cd clube-da-cota

# 2. Subir todos os serviços em segundo plano
docker compose up -d
```

Pronto! Os serviços estarão disponíveis em:
* 🌐 **Aplicação Web:** [http://localhost:3000](http://localhost:3000)
* 🗄️ **Prisma Studio (Visualizador do Banco):** [http://localhost:5555](http://localhost:5555)
* 🐘 **PostgreSQL:** `localhost:5434` (banco: `clube_da_cota`, user/senha: `postgres`/`postgres`)

Para parar os serviços:
```bash
docker compose down
```

---

### Opção B: Modo Desenvolvimento Local (Host + Docker DB)

Ideal para desenvolvimento ativo com Hot Reload do Next.js:

```bash
# 1. Clonar e entrar no repositório
git clone https://github.com/marcosbsdev/clube-da-cota.git
cd clube-da-cota

# 2. Instalar dependências
npm install

# 3. Subir apenas o container do PostgreSQL
docker compose up -d db

# 4. Configurar as variáveis de ambiente
cp .env.example .env
```

Verifique se o seu arquivo `.env` está apontando para a porta `5434`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/clube_da_cota?schema=public"
PORT=3000
NODE_ENV=development
```

```bash
# 5. Aplicar as migrações do banco e popular com dados de demonstração
npm run db:migrate
npm run db:seed

# 6. Iniciar o servidor de desenvolvimento
npm run dev
```

Acesse a aplicação em **[http://localhost:3000](http://localhost:3000)**.

Para abrir o visualizador de banco de dados (Prisma Studio) a qualquer momento:
```bash
npm run db:studio
# Acesse: http://localhost:5555
```

---

## 🗂️ Estrutura do Projeto

```plaintext
clube-da-cota/
├── .github/                     # Workflows e automações de CI/CD
├── docs/                        # Guias e documentos detalhados de arquitetura
├── prisma/
│   ├── migrations/              # Histórico versionado de migrações (Prisma Migrate)
│   ├── schema.prisma            # Schema de dados oficial (PostgreSQL)
│   └── seed.mjs                 # Script de seed com usuários e consórcio de teste
├── public/                      # Assets estáticos, ícones e manifest PWA
├── scripts/                     # Scripts utilitários e de importação de consórcios
├── src/
│   ├── app/                     # Rotas e páginas do Next.js 14 (App Router)
│   │   ├── admin/               # Painel de Gestão de Usuários (Super Admin)
│   │   ├── api/                 # Endpoints REST e Server Actions
│   │   ├── dashboard/           # Visão panorâmica dos consórcios e criação de novos
│   │   ├── participante/[token] # Portal exclusivo do participante via link sem login
│   │   └── planos/              # Página de planos e assinaturas SaaS
│   ├── components/              # Componentes reutilizáveis de UI
│   │   ├── Header.tsx           # Barra superior com notificações, temas e perfil
│   │   ├── NavigationBar.tsx    # Barra de navegação mobile e desktop
│   │   ├── ToastModal.tsx       # Modal padrão do sistema para alertas e confirmações
│   │   └── views/               # Telas completas (Visão Gestor, Participante, etc.)
│   └── lib/                     # Regras de negócio, cálculos financeiros e utilitários
│       ├── auth.ts              # Sessões e autenticação via cookies criptografados
│       ├── db.ts                # Singleton do Prisma Client
│       ├── finance.ts           # Cálculos de bolada, parcelas, Pix e cronograma
│       └── sanitize.ts          # Sanitização de dados sensíveis antes de enviar ao client
├── tests/                       # 16 suítes de testes unitários automatizados
├── docker-compose.yml           # Orquestração dos containers (App, DB e Studio)
├── docker-entrypoint.sh         # Script de boot com verificação de DB e migrações
├── Dockerfile                   # Build multi-stage enxuto (~150MB) para produção
└── package.json                 # Dependências e scripts do ecossistema
```

---

## ✨ Funcionalidades e Regras de Negócio

### 1. 🔐 Autenticação & 4 Níveis de Acesso
* Senhas criptografadas com `bcryptjs`.
* Recuperação de senha com tokens de uso único temporizados.
* Sanitização automática de payloads (senhas e tokens nunca chegam ao navegador).
* **Níveis de Acesso:**
  * **`COMUM`**: Acesso às suas cotas e parcelas como participante.
  * **`PRO`**: Criação de até 3 consórcios simultâneos (até 20 cotas cada).
  * **`PRO_MASTER`**: Consórcios ilimitados, relatórios avançados e exportação.
  * **`SUPER_ADMIN`**: Controle global, gestão de contas, auditoria e mesclagem de usuários duplicados.

### 2. ⚡ Regra de Pix Inteligente do Participante
Ao acessar a parcela do mês, o sistema determina dinamicamente o favorecido do Pix:
* **Pix Direto ao Contemplado:** Se o participante contemplado do ciclo marcou `receberPixDireto: true` e cadastrou sua chave Pix, o sistema exibe a chave dele com badge `⚡ Pix Direto ao Contemplado`.
* **Pix Centralizado:** Se o contemplado marcou `false` ou não cadastrou chave, o sistema direciona o pagamento para a chave centralizada do consórcio (`💳 Chave Pix do Consórcio`).

### 3. 🔗 Portal do Participante Sem Login (`/participante/[token]`)
* Cada cota possui um link único e seguro criptografado com token de acesso.
* O participante pode visualizar o cronograma completo, datas de vencimento, status de suas parcelas e copiar a chave Pix com um toque, sem a fricção de criar senha.

### 4. 🎲 Sorteio Aleatório & Definição de Ordem
* Algoritmo de sorteio aleatório matematicamente justo (Fisher-Yates).
* **Trava de Segurança:** Uma vez realizado o Sorteio #1, as posições são congeladas para garantir transparência.
* Suporte a troca manual de posições (*swap*) antes do sorteio definitivo.

### 5. 📸 Exportação de Imagem do Cronograma (PNG)
* Geração instantânea de imagem em alta definição do cronograma de parcelas e contemplações via HTML Canvas para compartilhamento direto em grupos de WhatsApp.

### 6. 🛡️ Gestão de Usuários & Mesclagem (Super Admin)
* Painel exclusivo para o Super Admin gerenciar todas as contas da plataforma.
* **Mesclagem de Contas Duplicadas:** Se um organizador cadastrou um amigo pelo apelido e depois ele criou uma conta oficial com e-mail, o Super Admin pode mesclar ambas em uma operação atômica, transferindo histórico, cotas e comprovantes sem perda de dados.

---

## 🧪 Testes Automatizados

A aplicação conta com **16 suítes de testes unitários** cobrindo 100% das regras críticas de negócio:

```bash
# Executar todos os testes de uma só vez
npm test
```

### O que as suítes cobrem:
1. `finance.test.mjs`: Fórmulas matemáticas, cálculo de bolada, datas de vencimento e juros progressivos.
2. `auth.test.mjs`: Criptografia bcrypt, fluxo de login, recuperação de senha e papéis de acesso.
3. `sanitize.test.mjs`: Remoção estrita de tokens e hashes antes de responder requisições frontend.
4. `participantes_repasse.test.mjs`: Edição de participantes, repasse e transferência de cotas.
5. `planos_upgrade.test.mjs`: Limites de consórcios por plano e transições de assinatura.
6. `assinaturas_gestao.test.mjs`: Histórico financeiro e ciclo de faturamento SaaS.
7. `consorcio_ciclo_vida.test.mjs`: Criação, ativação, andamento e encerramento de consórcios.
8. `consorcio_vencido_gestao.test.mjs`: Bloqueios e regras de quitação de consórcios finalizados.
9. `notifications.test.mjs`: Emissão de alertas e sininho de notificações no header.
10. `cadastro_participante_link.test.mjs`: Geração e validação de tokens únicos de participantes.
11. `perfil_dados.test.mjs`: Atualização de dados pessoais, temas e preferências.
12. `agenda_vinculo_participante.test.mjs`: Vínculo inteligente de participantes a partir de contatos existentes.
13. `sorteio_ordem_contemplacao.test.mjs`: Sorteio Fisher-Yates, congelamento e swap manual.
14. `export_cronograma_image.test.mjs`: Sanitização de dados e exportação de cronograma para WhatsApp.
15. `admin_gestao_usuarios.test.mjs`: Edição administrativa, mesclagem atômica de contas e exclusão segura.
16. `pix_pagamento_participante.test.mjs`: Resolução dinâmica de chave Pix (Direto vs Consórcio).

---

## 👥 Usuários Padrão para Testes (Seed)

Após executar `npm run db:seed`, os seguintes usuários estarão disponíveis:

| Nome | E-mail | Senha | Nível | Propósito |
| :--- | :--- | :--- | :--- | :--- |
| **Marcos Batista** | `markos.system@gmail.com` | `123456` | **SUPER_ADMIN** | Administrador do sistema e criador dos consórcios |
| **Renato Master** | `renato.master@exemplo.com` | `123456` | **PRO_MASTER** | Gestor profissional sem limite de grupos |
| **Camila Pro** | `camila.pro@exemplo.com` | `123456` | **PRO** | Gestora intermediária (até 3 consórcios) |
| **Fábio Augusto** | `fabio@exemplo.com` | `123456` | **COMUM** | Participante individual com cota ativa |
| **Patrick Dias** | `patrick@exemplo.com` | `123456` | **COMUM** | Participante de cota compartilhada (50%) |
| **Josivan Costa** | `josivan@exemplo.com` | `123456` | **COMUM** | Participante de cota compartilhada (50%) |

---

## 📜 Scripts do `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm run dev` | Inicia o Next.js em modo desenvolvimento no host (`http://localhost:3000`) |
| `npm run build` | Compila a aplicação otimizada para produção |
| `npm run start` | Inicia a aplicação compilada em modo produção |
| `npm test` | Executa todas as 16 suítes de testes unitários |
| `npm run db:migrate` | Executa o Prisma Migrate em desenvolvimento para aplicar novas migrações |
| `npm run db:deploy` | Aplica migrações pendentes em ambiente de produção |
| `npm run db:studio` | Abre a interface visual do Prisma Studio no navegador (`http://localhost:5555`) |
| `npm run db:seed` | Popula o banco com os usuários e dados padrão de teste |
| `npm run docker:up` | Sobe todos os containers da aplicação via Docker Compose |
| `npm run docker:down` | Para e remove os containers do Docker Compose |
| `npm run docker:studio` | Inicia o container do Prisma Studio isoladamente |
| `npm run docker:logs` | Exibe os logs do container da aplicação Next.js em tempo real |

---

## 🛠️ Stack Tecnológica

* **Framework Full-Stack:** [Next.js 14](https://nextjs.org/) (App Router, Server Actions, API Routes)
* **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
* **Interface & Estilo:** [React 18](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Lucide React](https://lucide.dev/)
* **Banco de Dados:** [PostgreSQL 16](https://www.postgresql.org/) rodando via Docker
* **ORM & Migrations:** [Prisma ORM](https://www.prisma.io/) com Prisma Migrate
* **Visualizador de Dados:** [Prisma Studio](https://www.prisma.io/studio)
* **Segurança:** `bcryptjs` para hashing de senhas, cookies seguros HTTP-only
* **Infraestrutura:** Docker & Docker Compose com multi-stage build enxuto
