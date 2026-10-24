# Diretrizes para Agentes de IA - Clube da Cota

Este documento estabelece as regras, convenções e boas práticas obrigatórias para qualquer agente de IA ou desenvolvedor atuando neste repositório.

---

## 1. Regra de Ouro da Documentação (OKF / Repositório Local)
* **Toda documentação do projeto reside exclusivamente em `docs/`** no padrão Open Knowledge Format (OKF) com YAML frontmatter.
* **Não utilizamos mais integrações com Notion ou serviços externos de documentação.**
* **Ao criar ou modificar qualquer funcionalidade significativa:**
  1. Atualize o módulo correspondente em `docs/modulos/`.
  2. Caso tenha tomado uma decisão arquitetural relevante, crie um novo registro em `docs/decisoes/` (ADR).
  3. Mantenha `docs/pendencias.md` atualizado com débitos técnicos e próximas tarefas.
  4. O commit do código e da documentação deve ser realizado de forma atômica no mesmo commit.

---

## 2. Padrões de Código e Stack Tecnológica
* **Framework:** Next.js 14 (App Router) + React 18 + TypeScript.
* **Estilização:** Tailwind CSS v3 utilizando variáveis CSS dinâmicas (`--theme-main`, `--theme-dark`, `--theme-light`, `--theme-text`, `--theme-accent`).
* **Banco de Dados & ORM:** SQLite local com Prisma ORM (`prisma/schema.prisma`).
* **Segurança de Dados:** Antes de retornar dados ao cliente em `src/app/actions.ts`, use sempre a função `sanitizarParaCliente` (`src/lib/sanitize.ts`) para nunca expor segredos (`passwordHash`, `resetToken`, etc.).
* **Controle de Acesso (RBAC):** 4 níveis hierárquicos: `COMUM` < `PRO` < `PRO_MASTER` < `SUPER_ADMIN`.
  * Trilha de auditoria e governança é restrita estritamente a `PRO_MASTER` e `SUPER_ADMIN`.

---

## 3. Checklist Obrigatório Pré-Commit
Antes de finalizar qualquer alteração ou solicitar autorização de commit:
1. `npx tsc --noEmit` deve passar com 0 erros.
2. `npm test` deve passar com 100% de sucesso em todas as suítes (financeira, autenticação, sanitização e notificações).
3. O servidor Next.js (`npm run dev`) deve responder com status 200 em `http://localhost:3000`.
4. Respeitar a regra de autorização: **NUNCA comitar ou fazer push sem a autorização explícita do usuário.**
