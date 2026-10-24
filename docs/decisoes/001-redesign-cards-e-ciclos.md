---
type: decision
title: "ADR 001 - Redesign Espaçoso de Cards, Mês/Ano e Harmonização de Paleta"
description: "Eliminação do grid truncado de 2 colunas, inclusão de mês/ano por ciclo e suporte integral à paleta do usuário."
status: "APROVADO"
tags: [adr, ux, ui, cards, paleta]
timestamp: 2026-10-23T11:34:00Z
---

# ADR 001: Redesign dos Cards e Harmonização de Paleta

## Contexto
Na listagem de "Ordem de Contemplação & Sorteio" e "Controle de Contribuições", o layout utilizava um grid dividido em 2 colunas espremidas. Isso truncava nomes longos de participantes (ex: `"Marcos Ba..."`) e deixava a visualização em mobile e desktop desconfortável. Além disso, cores estáticas fixas (como verde-esmeralda e roxo) quebravam a harmonia com o tema selecionado no perfil do usuário.

## Decisão
1. **Cards em Linha Única Espaçosa:** Substituição do grid de 2 colunas por cards horizontais em linha única (1 cota por linha), com avatar `#pos`, pílula de status, cronograma de contemplação e botões de ação à direita.
2. **Previsão de Mês/Ano por Ciclo:** Implementação de `calcularDataCiclo` e `formatarMesAnoCiclo`, exibindo com clareza a estimativa de recebimento da bolada para cada participante (ex: `"Recebe em: Dezembro de 2026"`).
3. **Harmonização com a Paleta:** Adoção rigorosa das variáveis `--theme-main`, `--theme-light`, `--theme-text` e `--theme-dark` em todos os botões, pílulas e badges.
4. **Controle de Altura Máxima:** Aplicação de rolagem interna suave (`max-h-[480px] overflow-y-auto`) nas listas para evitar páginas intermináveis em grupos grandes.

## Consequências
* Nomes de participantes agora são exibidos por inteiro sem cortes.
* A experiência visual tornou-se coesa com qualquer tema escolhido.
* Páginas não ficam extensas nem empurram o rodapé para baixo.
