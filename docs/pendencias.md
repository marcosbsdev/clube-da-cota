---
type: backlog
title: "Pendências Técnicas & Checklist de Produção"
description: "Relação de itens pendentes, melhorias arquiteturais e plano de segurança antes da publicação."
tags: [backlog, seguranca, producao, checklist]
timestamp: 2026-10-24T09:30:00Z
---

# 📋 Pendências & Checklist para Produção

Este documento consolida os débitos técnicos e o plano de hardening de segurança que devem ser executados antes de colocar o Clube da Cota em produção com usuários reais.

---

## 🔒 1. Segurança & Autenticação (Alta Prioridade)

| Item | Situação Atual | O que deve ser feito |
|---|---|---|
| **Sessão em Cookie** | O cookie `clube_cota_session` guarda o ID do usuário em texto puro. | Implementar assinatura digital HMAC-SHA256 (`src/lib/session.ts`) com segredo de ambiente `SESSION_SECRET`. |
| **Login Rápido de Teste** | `quickLoginAction` permite autenticação com 1 clique sem senha para qualquer ID. | Restringir estritamente ao ambiente de desenvolvimento (`process.env.NODE_ENV !== "production"`). |
| **Lista de Usuários no Login** | `todosUsuarios` é enviado ao visitante antes da autenticação. | Enviar array vazio antes do login; disponibilizar apenas para Super Admin gerenciar papéis. |
| **Recuperação de Senha** | O token de recuperação é retornado diretamente na resposta da API. | Integrar serviço de envio transacional de e-mails (ex: Resend) e retornar mensagem genérica sem revelar se o e-mail existe. |
| **Autorização de Ações** | Algumas server actions recebem o ID do usuário pelo parâmetro do cliente. | Extrair a identidade do usuário diretamente da sessão assinada no servidor. |

---

## 🚀 2. Infraestrutura & Deploy
* **Banco de Dados para Produção:** O banco SQLite local (`prisma/dev.db`) é ideal para desenvolvimento na máquina local, mas provedores serverless como a Vercel possuem sistema de arquivos somente-leitura e efêmero. Avaliar migração para PostgreSQL (ex: Supabase, Neon ou Railway).
* **Service Worker PWA:** Implementar service worker para possibilitar funcionamento e cache offline básico.
