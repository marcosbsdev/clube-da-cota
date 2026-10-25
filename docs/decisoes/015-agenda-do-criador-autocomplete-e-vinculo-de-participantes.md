# 015 - Agenda do Criador, Autocomplete e Vínculo Inteligente de Participantes

## Contexto
Na criação de novos consórcios pelo assistente (`CriarConsorcioWizard.tsx`), os participantes eram informados preenchendo os campos de texto *"Nome completo *"*, *"E-mail (opcional)"* e *"WhatsApp / Celular (opcional)"*.

Entretanto, esse modelo apresentava graves limitações de arquitetura e experiência de usuário:
1. **Proliferação de Contas Provisórias / Fantasmas:** Como o e-mail é opcional, ao informar apenas o nome de um membro, o sistema gerava um cadastro provisório (`participante_...@clubedacota.local`).
2. **Desconexão de Cotas:** Quando um participante que já possuía conta ativa no Clube da Cota era adicionado a um novo grupo por seu organizador sem o e-mail exato cadastrado, uma conta paralela era criada. O usuário, ao fazer login com sua conta real, não conseguia visualizar nem gerenciar esse novo consórcio em seu painel.
3. **Atrito e Redigitação:** O organizador precisava redigitar nome, telefone e e-mail de amigos e cotistas frequentes toda vez que iniciava um consórcio.

## Decisão Arquitetural (Opção 1 - Agenda do Criador)
Implementou-se a **Agenda Inteligente de Participantes Frequentes** com Autocomplete em tempo real e vinculação direta ao banco de dados:

### 1. Backend (`src/app/actions.ts`):
- **`getAgendaParticipantesAction(criadorId: string)`**:
  - Consulta todos os consórcios onde o criador é administrador ou cotista.
  - Agrupa os participantes anteriores, contabilizando o total de participações (`totalParticipacoes`).
  - Extrai dados cadastrais e financeiros (Nome, E-mail real sem `@clubedacota.local`, WhatsApp, Tipo de Chave Pix e Chave Pix).
  - Inclui usuários cadastrados no sistema (com `totalParticipacoes: 0`).
  - Ordena prioritariamente por maior número de participações no histórico do criador, seguido por ordem alfabética.
  - Exclui o próprio criador da lista de terceiros (ele possui seu botão próprio de auto-inclusão).
- **`createConsorcioAction`**:
  - Suporte aos campos `usuarioId` e `fraçãoUsuarioId` em cada participante.
  - **Resolução de Usuário em Cascata:**
    1. Se `usuarioId` foi selecionado: vincula diretamente ao `User` existente.
    2. Se não informado, busca por `email` real no banco.
    3. Se não encontrado por e-mail, busca por `telefone` formatado no banco.
    4. Se nenhuma correspondência existir, cria nova conta de forma segura.
    5. Se o usuário existente não possuía telefone e o formulário o forneceu, enriquece o cadastro existente sem duplicá-lo.

### 2. Frontend (`CriarConsorcioWizard.tsx`):
- **Autocomplete em Tempo Real:** Ao digitar a partir de 2 caracteres no campo *"Nome completo *"*, surge um menu suspenso elegante listando as correspondências da rede do criador, com telefone, e-mail e selo indicando a quantidade de consórcios prévios.
- **Preenchimento Instantâneo em 1 Clique:** Ao selecionar um contato, Nome, WhatsApp e E-mail são preenchidos automaticamente e o `usuarioId` é anexado.
- **Selo Afirmativo de Vínculo:** Exibição de badge esmeralda *"✓ Conta vinculada"* com opção de `(desvincular)` a qualquer momento.
- **Cota Compartilhada Completa:** O campo *"Nome do parceiro(a) *" da cota compartilhada conta com exatamente o mesmo autocomplete inteligente e vínculo de `fraçãoUsuarioId`.
- **Auto-inclusão do Criador Atualizada:** O botão *"Eu também vou participar"* agora anexa o `currentUser.id`, garantindo que a própria cota do criador seja 100% vinculada à sua conta sem qualquer duplicata.
- **Indicador Visual na Lista:** Membros adicionados na lista de cotas exibem o selo *"Conta Vinculada"*.

---

## Consequências
- **Positivas:**
  - **Eliminação de Contas Duplicadas:** O mesmo cotista agora tem todas as suas participações centralizadas sob um único `User` no banco de dados.
  - **Visibilidade Imediata:** Ao fazer login, o participante enxerga todos os seus consórcios unificados na tela *"Meu Consórcio"*.
  - **Agilidade para o Criador:** Cadastrar 10 ou 20 participantes veteranos agora leva poucos segundos, apenas clicando nas sugestões.
  - **100% Coberto por Testes:** Testado com 6 novos testes em `tests/agenda_vinculo_participante.test.mjs`, elevando a suíte para 79 testes em 12 suítes com 100% de aprovação.
