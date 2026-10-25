# 016 - Sorteio Aleatório e Definição Manual da Ordem de Contemplação dos Meses

## Contexto
Na criação de consórcios, a ordem em que cada participante recebia a bolada era definida estritamente de forma sequencial pela ordem de inclusão no formulário:
- O 1º participante adicionado ficava com a Cota #1 (Mês 1).
- O 2º participante ficava com a Cota #2 (Mês 2), e assim sucessivamente.

Entretanto, nos consórcios reais existem dois cenários fundamentais:
1. **Sorteio Imparcial / Aleatório:** O grupo deseja que a ordem de contemplação seja sorteada pelo sistema de forma transparente e imparcial.
2. **Definição por Acordo Prévio:** Os cotistas combinaram previamente quem precisa da bolada em cada mês específico (ex: um participante precisa em Maio para uma viagem, outro em Dezembro para festividades de fim de ano).

Sem uma etapa explícita de definição de ordem no assistente, o criador não conseguia visualizar quem estava alocado em cada mês antes da ativação, nem tinha como sortear ou organizar os meses de acordo com a vontade do grupo.

---

## Decisão Arquitetural
Adicionou-se um novo passo dedicado no assistente de criação (`CriarConsorcioWizard.tsx`): **Passo 4 - Ordem & Sorteio 🎲**, expandindo o assistente para 5 passos estruturados:
1. Dados Básicos
2. Participantes & Cotas
3. Valores & Prazos
4. **Ordem & Sorteio 🎲** *(Novo)*
5. Revisão Final & Ativação

### 1. Interface e Funcionalidades (Passo 4):
- **Seletor de Modo de Definição:**
  - O criador escolhe entre **"Definição Manual / Acordo do Grupo ✍️"** e **"Sorteio Automático pelo Sistema 🎲"**.
- **Modo Sorteio Automático (Regra Estrita de Execução Única, Imutabilidade e Congelamento):**
  - Implementado com o algoritmo **Fisher-Yates**, garantindo permutação justa e equiprobável de todas as cotas.
  - **Execução Única & Anti-Fraude:** Para garantir a idoneidade e evitar tentativas repetidas até obter um resultado de conveniência do criador, o sorteio oficial só pode ser executado **uma única vez**.
  - **Persistência e Restauração do Sorteio #1:** O resultado sorteado fica gravado de forma imutável (`sorteioOficial`). Caso o criador alterne para o modo manual para visualizar ou combinar posições, ao clicar de volta no card de Sorteio Oficial o sistema **obrigatoriamente restaura a ordem do Sorteio #1 original**, sem permitir novo sorteio.
  - **Congelamento das Posições:** Assim que o sorteio é realizado (ou restaurado), as posições dos meses ficam **bloqueadas contra movimentação manual** (selects desativados, botões ▲/▼ inativos e selo visual de auditoria `🔒 Posições Congeladas`).
  - Para obter um novo sorteio diferente, o criador deve cancelar a criação e iniciar um novo consórcio do zero.
- **Modo Definição Manual / Acordo do Grupo:**
  - Posições 100% livres para ordenação manual de acordo com combinações prévias entre os cotistas.
  - Em cada mês/ciclo, o `<select>` permite escolher livremente o cotista.
  - Realiza **troca mútua (swap seguro 1-para-1)** com a posição anterior, garantindo que nenhum mês fique vago e nenhuma cota fique duplicada.
  - Botões de ajuste fino **▲ (Antecipar para o mês anterior)** e **▼ (Adiar para o próximo mês)** totalmente ativos.
  - Possibilidade de alternar para visualização manual sem diálogos intrusivos de confirmação.
- **Botão "Restaurar Sorteio Oficial #1" e "Ordem de Cadastro":**
  - No modo manual, se o Sorteio #1 já tiver sido gerado, o criador tem um botão rápido para restaurar o resultado oficial, além do botão para restabelecer a ordem sequencial de cadastro inicial.
- **Visualização de Valores por Mês:**
  - Cada ciclo exibe o valor da bolada prevista naquele mês (inclusive considerando o acréscimo progressivo, se houver).

### 2. Revisão Final Enriquecida (Passo 5):
- O cronograma expansível de ciclos agora exibe expressamente para cada mês:
  - Número do Ciclo (ex: `#1 Início`, `#10 Fim 🏁`)
  - Data de Vencimento
  - **Nome do Participante Contemplado**
  - Valor da Bolada Entregue

### 3. Backend (`src/app/actions.ts`):
- O objeto `participantes` em `CreateConsorcioInput` foi estendido com `ordensSorteio?: number[]`.
- No `createConsorcioAction`, cada cota é criada associando sua `ordemSorteio` exatamente à posição definida no assistente:
  ```ts
  const cotaOrdem = part.ordensSorteio?.[c] ?? numCota;
  await prisma.cota.create({
    data: {
      consorcioId: novoConsorcio.id,
      numero: numCota,
      ordemSorteio: cotaOrdem,
      ...
    }
  });
  ```
- Mantido fallback sequencial seguro caso `ordensSorteio` não seja fornecido (compatibilidade total).

---

## Consequências
- **Positivas:**
  - Total flexibilidade para o organizador: pode sortear pelo sistema ou alocar os meses manualmente conforme acordos prévios do grupo.
  - Transparência total antes de ativar: o criador e os participantes sabem exatamente quem recebe em cada mês.
  - Integridade matemática: o swap seguro impede meses vazios ou participantes duplicados no mesmo ciclo.
  - Totalmente testado com 7 novos testes em `tests/sorteio_ordem_contemplacao.test.mjs`, totalizando **86 testes em 13 suítes com 100% de sucesso**.
