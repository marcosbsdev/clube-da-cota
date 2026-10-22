# 🤝 Clube da Cota - MVP

Aplicação web moderna e responsiva (PWA) para organização e gerenciamento financeiro de consórcios informais entre amigos, colegas de trabalho e familiares.

> **Objetivo:** O sistema atua exclusivamente como ferramenta de **controle e registro financeiro transparente**, proporcionando previsibilidade e confiabilidade aos participantes sem intermediar movimentações bancárias diretamente.

---

## ✨ Funcionalidades Principais

* **🔐 Módulo de Autenticação Real:** Login com senha criptografada via `bcrypt`, cadastro de novas contas, recuperação e redefinição de senha com tokens de uso único temporizados (1h), e sessões seguras em cookies HTTP.
* **📂 Arquitetura Multiconsórcios:**
  * **Central "Meus Consórcios Administrados":** Visão panorâmica em cards com status, cotas, valor da parcela, bolada prevista, número de membros e barra de progresso de arrecadação em tempo real.
  * **Dashboards Exclusivos por Consórcio:** Cada consórcio possui seu próprio painel com 4 KPIs (Total Previsto, Total Recebido, Pendente no Prazo e Em Atraso), aprovação de comprovantes, tabela de parcelas com exportação CSV e histórico de auditoria.
  * **Seletor Global no Header:** Alternância rápida entre grupos com um toque a partir de qualquer página, tanto no desktop quanto no mobile.
* **👥 Flexibilidade Total em Participantes e Cotas:**
  * O criador pode optar por apenas administrar ou adquirir 1 ou mais cotas.
  * Suporte nativo a **Cotas Compartilhadas** (50/50 entre 2 amigos) com controle de quantidade.
  * **Regra de Negócio:** Mínimo obrigatório de 2 participantes por consórcio (validação em tempo real no frontend e backend).
* **📱 Design Responsivo Mobile-First & PWA:** Totalmente otimizado para celulares, tablets e computadores, com barra de navegação inferior estilo aplicativo e suporte a instalação PWA.
* **🎨 Sistema de Temas Personalizáveis:** 5 paletas de cores (Azul Real, Escuro/Grafite, Roxo Moderno, Azul Oceano e Coral) salvas nas preferências de cada usuário.

---

## 🚀 Como Executar Localmente

### 1. Pré-requisitos
* Node.js v18+ (recomendado v20 ou v24)
* NPM

### 2. Instalação e Configuração
```bash
# Clonar o repositório
git clone https://github.com/marcosbsdev/clube-da-cota.git
cd clube-da-cota

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Inicializar o banco de dados e popular com dados de demonstração
npx prisma db push
npm run db:seed
```

### 3. Executar o Servidor de Desenvolvimento
```bash
npm run dev
```
Acesse no seu navegador: **`http://localhost:3000`**

---

## 🧪 Testes Automatizados

Suítes de testes unitários integradas para garantia de qualidade e integridade das regras:

```bash
# Testes das regras financeiras e de consórcio (6 cenários)
node tests/finance.test.mjs

# Testes do módulo de autenticação e segurança (5 cenários)
node tests/auth.test.mjs
```

---

## 👥 Níveis de Acesso e Usuários de Demonstração (Seed)

| Nome | E-mail | Senha Padrão | Nível | Papel no MVP |
| :--- | :--- | :--- | :--- | :--- |
| **Marcos Batista** | `markos.system@gmail.com` | `123456` | **Super Admin** | Criador dos consórcios, gestão total e auditoria |
| **Fábio Augusto** | `fabio@exemplo.com` | `123456` | **Comum** | Participante individual |
| **Patrick Dias** | `patrick@exemplo.com` | `123456` | **Comum** | Cota compartilhada 50% |
| **Josivan Costa** | `josivan@exemplo.com` | `123456` | **Comum** | Cota compartilhada 50% |
| **Tatiane** | `tatiane@exemplo.com` | `123456` | **Comum** | Participante individual |

---

## 🛠️ Tecnologias Utilizadas

* **Next.js 14** (App Router, Server Actions, API Routes)
* **React 18** & **TypeScript**
* **Tailwind CSS** (Design system responsivo com temas dinâmicos)
* **Prisma ORM** com **SQLite** (preparado para **PostgreSQL / Supabase**)
* **Bcryptjs** para hash seguro de senhas
* **Lucide React** (Ícones modernos)
* **PWA Web Manifest** para instalação nativa em smartphones
