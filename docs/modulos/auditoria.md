---
type: module
title: "Módulo Governança & Trilha de Auditoria"
description: "Rastreabilidade completa de ações operacionais, restrição de visualização RBAC e conformidade."
resource: "src/components/CriadorView.tsx"
tags: [auditoria, governanca, rbac, compliance, historico]
timestamp: 2026-10-24T09:30:00Z
---

# 🛡️ Módulo Governança & Trilha de Auditoria

## Visão Geral
Para garantir que a gestão do consórcio seja segura, transparente e livre de fraudes, o Clube da Cota mantém um **registro cronológico imutável** de todas as operações sensíveis que ocorrem no grupo.

---

## 1. Eventos Registrados na Auditoria
Toda ação relevante gera uma entrada na tabela `AuditoriaLog`:
* `CONFIRMACAO_PAGAMENTO`: Baixa de mensalidade realizada pelo criador.
* `ESTORNO_PAGAMENTO`: Reversão de pagamento confirmado com justificativa obrigatória.
* `RECUSA_COMPROVANTE`: Recusa de comprovante enviado com motivo informado.
* `CONTEMPLACAO_MARCADA` / `DESMARCADA`: Mudança de status da cota contemplada.
* `TROCA_POSICOES`: Permutação de ordem de contemplação entre dois participantes (com motivo obrigatório).
* `EDICAO_CONSORCIO`: Alterações cadastrais nas regras ou dados do grupo.
* `EDICAO_DADOS_PARTICIPANTE`: Atualização de dados cadastrais (Nome, WhatsApp, Pix) de um cotista com snapshot antes/depois.
* `SUBSTITUICAO_PARTICIPANTE_COTA`: Repasse de titularidade de cota com novo token de acesso, reatribuição de parcelas a partir do ciclo informado e justificativa obrigatória.

---

## 2. Controle de Acesso e Restrição RBAC
* **Exclusividade Governança:** O acesso à **Trilha de Auditoria** é restrito estritamente a usuários com papéis **`PRO_MASTER`** e **`SUPER_ADMIN`**.
* Usuários com perfis `COMUM` e `PRO` **não têm acesso** a essa aba, visualizando apenas o Painel Operacional em largura total.
* **Navegação Inteligente:** No menu superior ([`Header.tsx`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/components/Header.tsx)), ao clicar em notificações ou avisos de auditoria:
  * Administradores e Pro Masters são redirecionados diretamente para a aba de Auditoria com scroll automático.
  * Usuários comuns são direcionados para o Painel Operacional regular.

---

## 3. Recursos do Painel de Auditoria
* **4 Cards de Resumo:** Total de Eventos, Pagamentos Baixados, Contemplações & Trocas e Edições/Criação.
* **Filtros por Tipo de Evento:** `Todos`, `Pagamentos`, `Contemplações`, `Trocas` e `Edições` com contadores dinâmicos.
* **Busca em Tempo Real:** Campo de busca que pesquisa instantaneamente por responsável, cotas participantes ou termos contidos na justificativa.
* **Grid Otimizado:** Exibição em grid responsivo de 2 colunas com altura máxima e rolagem suave (`max-h-[600px]`), mantendo a página sempre compacta.

---

## 4. Apresentação Humanizada & Trava Anti-JSON
* **Eliminação de JSON Bruto:** Eventos com cargas úteis complexas (ex: quitação em lote de 9 ciclos ou contemplações de múltiplos cotistas) são transformados dinamicamente em cards visuais temáticos ([ADR 012](../decisoes/012-humanizacao-notificacoes-e-auditoria-sem-json-bruto.md)).
* **Sininho de Notificações (`Header.tsx`):** O dropdown de notificações conta com badges semânticos coloridos e texto corrido amigável, protegido por uma trava universal que impede que qualquer caractere `{` ou `[` vaze para a interface.
