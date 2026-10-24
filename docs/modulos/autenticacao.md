---
type: module
title: "Módulo Autenticação, Perfis & Sanitização de Dados"
description: "Estrutura de usuários, 4 níveis de acesso RBAC, proteção de rotas e sanitização contra vazamento de segredos."
resource: "src/lib/sanitize.ts"
tags: [autenticacao, rbac, perfis, seguranca, sanitizacao]
timestamp: 2026-10-24T09:30:00Z
---

# 🔐 Módulo Autenticação, Perfis & Sanitização

## Visão Geral
O sistema de autenticação e controle de perfis garante que cada usuário opere estritamente dentro dos limites concedidos pelo seu plano ou papel no consórcio.

---

## 1. Os 4 Níveis de Acesso (RBAC)
1. **`COMUM`:** Participante regular de consórcios. Pode visualizar suas cotas, anexar comprovantes e participar de grupos.
2. **`PRO`:** Criador profissional. Pode gerenciar consórcios múltiplos, trocar posições de cotas e dar baixa em contribuições.
3. **`PRO_MASTER`:** Gestor corporativo avançado. Possui acesso liberado à **Trilha de Auditoria & Governança** e conformidade do grupo.
4. **`SUPER_ADMIN`:** Administrador global do sistema. Possui permissão para alterar o nível de acesso de qualquer usuário na tela de Perfil e acessar auditorias globais.

---

## 2. Sanitização Estrita de Dados Sensíveis (`src/lib/sanitize.ts`)
Para garantir conformidade com as melhores práticas de cibersegurança:
* **Campos Nunca Enviados ao Cliente:**
  * `passwordHash`: Hash Bcrypt da senha do usuário.
  * `resetToken` e `resetExpiresAt`: Tokens de recuperação de senha.
  * `inviteToken` e `inviteExpiresAt`: Tokens de ativação/convite.
* **Campos Restritos a Gestores:**
  * `tokenAcesso`: Os links de acesso direto individual de cotas são enviados apenas para o criador do consórcio e administradores (para possibilitar o compartilhamento). Participantes comuns nunca recebem os links de acesso dos demais participantes.

A função `sanitizarParaCliente` limpa recursivamente toda a árvore de dados retornada por `getConsorcioData` antes que ela saia do servidor Next.js.
