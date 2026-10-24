---
type: decision
title: "ADR 003 - Sanitização Estrita de Dados Sensíveis no Cliente"
description: "Eliminação do vazamento de hashes de senhas e tokens de acesso retornados nas consultas do Prisma."
status: "APROVADO"
tags: [adr, seguranca, sanitizacao, prisma, hashes]
timestamp: 2026-10-24T09:08:00Z
---

# ADR 003: Sanitização de Dados Sensíveis no Retorno do Servidor

## Contexto
Durante uma auditoria de dados no payload retornado por `getConsorcioData`, identificou-se que a consulta Prisma utilizava `include` profundo sem seleção restritiva de campos. Como consequência, o hash Bcrypt da senha (`passwordHash`) de dezenas de usuários e os tokens de acesso direto de cotas (`tokenAcesso`) estavam sendo enviados inadvertidamente no JSON consumido pelo navegador.

## Decisão
1. **Criação do Módulo de Sanitização (`src/lib/sanitize.ts`):** Função recursiva pura `sanitizarParaCliente` que percorre todas as entidades da árvore de resposta.
2. **Remoção Absoluta de Segredos:** `passwordHash`, `resetToken`, `inviteToken` e datas de expiração associadas nunca saem do servidor em hipótese alguma.
3. **Restrição de Tokens de Acesso:** O campo `tokenAcesso` só é mantido na resposta se o usuário logado for o criador do consórcio ou um administrador geral (`SUPER_ADMIN` ou `PRO_MASTER`). Participantes comuns nunca recebem os links de acesso dos outros membros.
4. **Cobertura por Testes:** Criada suíte automatizada (`tests/sanitize.test.mjs`) integrada ao `npm test` para impedir regressões.

## Consequências
* Segurança imediata restaurada contra ataques de força bruta offline em hashes vazados.
* Links de acesso protegidos contra visualização por participantes não autorizados.
