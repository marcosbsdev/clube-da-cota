---
type: adr
title: "ADR 012 - Humanização Completa de Notificações e Auditoria (Eliminação de JSON Bruto)"
status: aceito
date: 2026-10-24
tags: [notificacoes, auditoria, ui, ux, json, humanizacao, governanca]
---

# ADR 012: Humanização Completa de Notificações e Auditoria (Eliminação de JSON Bruto)

## Contexto
Na versão anterior, eventos que gravavam payloads estruturados no campo `detalhes` da tabela `AuditoriaLog` (tais como quitação em lote de parcelas, marcação de múltiplos ciclos contemplados, consolidação de trocas e criação de consórcios retroativos) exibiam a string JSON crua diretamente para o usuário no dropdown de notificações do cabeçalho ([`Header.tsx`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/components/Header.tsx)) e no card de fallback da Trilha de Auditoria ([`CriadorView.tsx`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/components/CriadorView.tsx)).

Exemplo de como aparecia antes:
`{"contemplados":["Ciclo 1: Junior Brito","Ciclo 2: Patrick Guedes", ...]}`
`{"ciclosQuitados":"1 ao 9 (Fevereiro a Outubro de 2026)","totalParcelas":90,"valorArrecadado":10800}`

Essa visualização técnica comprometia a experiência visual do usuário em um aplicativo que se propõe a ser amigável e acessível para leigos no celular.

---

## Decisão de Arquitetura

Implementamos uma camada completa de **formatação, humanização e proteção anti-JSON** em duas frentes:

### 1. Sininho de Notificações (`Header.tsx`):
- `formatarTextoNotificacao`:
  - **`CONTEMPLACAO_MARCADA`:** Transforma a lista de ciclos e participantes em texto corrido agradável (ex: *"Contemplação de 9 cotas registrada: Ciclo 1 (Junior Brito), Ciclo 2 (Patrick Guedes)... e mais 6 contemplados."*).
  - **`CONFIRMACAO_PAGAMENTO` (Lote):** Formata ciclos quitados, quantidade de parcelas e valor arrecadado em moeda brasileira (BRL).
  - **`TROCA_POSICOES`:** Exibe a descrição acordada e o total de trocas efetuadas.
  - **`CRIACAO_CONSORCIO`:** Apresenta o nome do grupo e o número de cotas.
  - **Trava Universal Anti-JSON:** Caso qualquer JSON não mapeado chegue ao formatter, os campos de texto são extraídos de forma limpa; se ainda restarem delimitadores `{` ou `[`, o texto é substituído por uma mensagem institucional amigável, garantindo que **nenhuma chave ou colchete de JSON vaze para o usuário final**.
- `getNotificacaoMeta`:
  - Mapeamento explícito de badges temáticos para `CONTEMPLACAO_MARCADA` (`CONTEMPLAÇÕES EM LOTE`, esmeralda), `TROCA_POSICOES` (`CONSOLIDAÇÃO DE SORTEIO`, âmbar), `ENCERRAMENTO_CONSORCIO` (rosa) e `REATIVACAO_CONSORCIO` (esmeralda).

### 2. Trilha de Auditoria (`CriadorView.tsx`):
- `renderAuditoriaDetalhes`:
  - **Cards Estruturados:** Em vez de blocos de texto simples, eventos em lote geram cartões ricos com cabeçalhos distintos, contadores e badges visuais (`🏆 Paga`, `R$ 10.800,00`).
  - **Grade de Contemplações:** Exibição em grid de 2 colunas com altura máxima e rolagem suave (`max-h-48`), mantendo a linha do tempo organizada.
  - **Enriquecimento Dinâmico:** Menções a cotas no padrão `Cota #X` são enriquecidas com o nome dos respectivos titulares em tempo de renderização.

### 3. Validação por Testes Automatizados (`tests/notifications.test.mjs`):
- Adicionados testes de asserção estrita validando que nenhuma notificação de lote retorna strings começando com `{` ou contendo arrays em JSON.
- Incorporado ao comando `npm test` do projeto (totalizando 62 testes com 100% de sucesso).

---

## Consequências
- **Positivas:**
  - Interface 100% polida, sem nenhum vestígio de termos ou estruturas técnicas voltadas a programadores.
  - Proteção futura contra qualquer novo tipo de evento estruturado via trava de segurança anti-JSON.
  - Rastreabilidade de auditoria preservada de ponta a ponta no backend (onde o JSON continua sendo a melhor estrutura de dados para consultas e queries).
