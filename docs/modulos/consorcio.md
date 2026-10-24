---
type: module
title: "Módulo Consórcio & Regras Financeiras"
description: "Regras de negócio, cálculos matemáticos, ciclos de contemplação e validações financeiras do Clube da Cota."
resource: "src/lib/finance.ts"
tags: [financas, consorcio, bolada, regras-de-negocio, cotas]
timestamp: 2026-10-24T09:30:00Z
---

# 💰 Módulo Consórcio & Regras Financeiras

## Visão Geral
O núcleo financeiro do sistema gerencia consórcios entre amigos e familiares, garantindo que o dinheiro arrecadado mensalmente dos participantes seja distribuído integralmente e com total transparência ao contemplado de cada ciclo.

Código-fonte principal: [`src/lib/finance.ts`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/lib/finance.ts).

---

## 1. Princípios e Regras Financeiras Fundamentais

### Mínimo Obrigatório de Participantes
* Um consórcio exige no **mínimo 2 participantes distintos** para ser viável (`validarMinimoParticipantes`).

### Ciclos e Previsão de Mês/Ano
* Cada cota possui uma data de contemplação calculada de acordo com sua posição na fila (`calcularDataCiclo`).
* O sistema prevê com segurança contra fusos horários o mês e ano em que cada participante receberá a bolada (ex: `"Recebe em: Dezembro de 2026"` via `formatarMesAnoCiclo`).
* Esse dado é exibido tanto para o criador quanto para o participante, e também integrado nas mensagens automáticas geradas para WhatsApp.

### Modelos de Contribuição
1. **Fixo:** Todos os participantes pagam a mesma mensalidade em todos os ciclos (`FIXO`).
2. **Progressivo com Acréscimo:** Há um acréscimo incremental a cada ciclo para compensar a inflação ou gerar poupança maior para quem recebe por último. O sistema unifica e aceita os identificadores `ACRESCIMO_MENSAL` e `PROGRESSIVO` através do utilitário `isModeloAcrescimo`, garantindo que a bolada de cada card no frontend (`calcularValorCiclo * totalCotas`) incremente fielmente mês a mês.

### Formatação Monetária
* Todos os valores monetários seguem rigorosamente o padrão brasileiro BRL (`R$ 1.500,00`).

### Modalidade de Recebimento Pix: Direto vs. Centralizado
1. **Pix do Consórcio (Obrigatório):** Todo consórcio criado ou editado possui obrigatoriamente uma chave Pix e a classificação do tipo de chave (`CELULAR`, `CPF_CNPJ`, `EMAIL`, `CHAVE_ALEATORIA`).
2. **Pix Direto ao Contemplado:** Se o participante contemplado do ciclo completou cadastro na plataforma (`isActivated = true`), optou por receber o Pix diretamente na sua conta (`receberPixDireto = true`) e informou sua chave Pix:
   * **Bolada Líquida:** O contemplado não realiza Pix no mês do seu recebimento. Sua própria cota fica no bolso e ele recebe a soma líquida das transferências dos demais participantes `(totalCotas - 1) * valorCotaNoCiclo`.
   * **Apresentação de Chave:** Os demais participantes visualizam a chave Pix pessoal do contemplado na tela de pagamento para transferência direta. O contemplado visualiza um aviso parabenizando-o e informando que sua cota foi retida.
3. **Arrecadação Centralizada:** Se o participante optou por não receber direto ou ainda não completou seu cadastro:
   * A bolada é integralmente bruta (`totalCotas * valorCotaNoCiclo`).
   * A chave Pix apresentada para pagamento é a do organizador do consórcio.

---

## 2. Indicadores Principais do Criador (Dashboard KPIs)
O painel do gestor calcula e exibe em tempo real 4 métricas essenciais:
1. **Total Previsto:** Soma de todas as parcelas contratadas.
2. **Total Recebido:** Parcelas confirmadas com status `PAGO`.
3. **Pendente no Prazo:** Parcelas aguardando vencimento.
4. **Em Atraso:** Parcelas vencidas sem confirmação de pagamento.

---

## 3. Suíte de Testes Automatizados
O arquivo `tests/finance.test.mjs` valida 12 regras financeiras matemáticas:
1. Geração de datas de vencimento mensais.
2. Validação de cotas compartilhadas (frações de 50%).
3. Transição de status financeiro (`PENDENTE` -> `PAGO` / `EM_ATRASO`).
4. Cálculo dos 4 indicadores do criador.
5. Acréscimo mensal progressivo.
6. Validação de mínimo de 2 participantes.
7. Máscara e formatação monetária BRL.
8. Consistência matemática dos valores totais.
9. Formatação de data à prova de bugs de fuso horário.
10. Formatação de Mês/Ano e cálculo de lucro sobre a bolada.
11. Cálculo de data e Mês/Ano para cada ciclo de contemplação.
12. Cálculo de Bolada Bruta vs Líquida (Pix Direto vs Centralizado) e 4 tipos de Chave Pix.
