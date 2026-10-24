---
type: decision
title: "ADR 002 - Sub-Abas na Gestão do Grupo e Restrição RBAC da Auditoria"
description: "Isolamento da Trilha de Auditoria com acesso exclusivo para Pro Master e Super Admin e expansão do Painel Operacional em Full Width."
status: "APROVADO"
tags: [adr, rbac, gestao, auditoria, layout]
timestamp: 2026-10-23T20:54:00Z
---

# ADR 002: Sub-Abas na Gestão e Isolamento da Auditoria

## Contexto
A tela de Gestão do Grupo possuía excesso de informação condensada. Uma barra lateral de 4 colunas dedicada ao Histórico de Auditoria espremia a área de controle operacional em 8 colunas. Além disso, participantes comuns e criadores básicos não deveriam ter acesso a logs internos de governança e auditoria corporativa.

## Decisão
1. **Sub-Abas no Topo da Gestão:** Criadas duas sub-abas no topo da visão do criador:
   * **[📋 Painel Operacional]:** Ocupa 100% da largura útil da tela (Full Width), sem nenhuma barra lateral espremendo os dados. Visível para todos os criadores.
   * **[🛡️ Trilha de Auditoria]:** Painel dedicado de compliance e governança com 4 indicadores, filtros por tipo de evento, pesquisa textual e grid de 2 colunas.
2. **Controle de Acesso RBAC Exclusivo:** Apenas usuários com papel `PRO_MASTER` e `SUPER_ADMIN` podem ver o seletor de abas e acessar a Trilha de Auditoria. Usuários `COMUM` e `PRO` visualizam apenas a visão operacional.
3. **Redirecionamento Inteligente:** No menu superior, o atalho de notificações direciona diretamente para a aba de Auditoria com scroll automático apenas para usuários com permissão de governança.

## Consequências
* O Painel Operacional ganhou mais de 400px de largura útil no desktop.
* Conformidade corporativa garantida através de controle de acesso hierárquico.
