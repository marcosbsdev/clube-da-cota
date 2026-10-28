# 019. Paletas Oficiais de Tema, Higienização do Perfil, Validação de Chave Pix e Usabilidade no Painel Admin

**Data:** 27/10/2026  
**Status:** Aprovado  
**Autor:** Antigravity / Time de Arquitetura Clube da Cota  

---

## 1. Contexto e Motivação

Durante a evolução do Clube da Cota, identificou-se a necessidade de um refinamento transversal em quatro frentes de usabilidade, consistência visual e segurança de dados:

1. **Padronização das Paletas Oficiais de Cores:**
   O catálogo de temas continha opções legadas (como *Azul Claro / Ocean*) e precisava de uma grade limpa e harmônica 3x2 com 6 cores oficiais: **Azul (Padrão)**, **Escuro**, **Roxo**, **Vermelho**, **Laranja** e **Verde**.

2. **Isolamento de Contexto e Higienização da Página de Perfil (`PerfilView.tsx`):**
   A tela de perfil concentrava funcionalidades que não pertenciam ao escopo pessoal do usuário, como o simulador de perfis (utilitário de testes do MVP), a Gestão de Assinaturas SaaS e a Gestão de Níveis de Acesso (ambos de uso exclusivo do Super Admin). Além disso, havia um botão redundante de "Criar Consórcio" e textos descritivos técnicos de permissões.

3. **Formatação e Validação da Chave Pix Pessoal:**
   A chave Pix para recebimento de repasses diretos era inserida sem máscara e sem validação de conformidade com o Banco Central. Chaves de celular ficavam sem formatação (ex: `11963030266`), CPFs podiam conter dígitos inválidos e e-mails continham espaços em branco.

4. **Sobrecarga Visual e Navegação no Painel Administrativo (`AdminView.tsx`):**
   Com o aumento no volume de contas, o bloco "Participantes Cadastrados" esticava a página indefinidamente pela ausência de scroll vertical e perdia a visualização do cabeçalho da tabela. O bloco "Gestão Rápida de Níveis de Acesso" não possuía campo de busca dedicado, obrigando o Super Admin a rolar a lista inteira para encontrar um participante.

---

## 2. Decisão Técnica e Arquitetura

### 2.1. Seletor de Temas e CSS Dinâmico (`ThemeProvider.tsx` & `globals.css`)
- Suporte oficial aos 6 temas: `"blue" | "dark" | "purple" | "red" | "orange" | "green"`.
- Fallbacks graciosos para contas migradas de versões antigas (`coral` -> `orange`, `ocean` -> `blue`).
- Definição completa das variáveis CSS `--theme-main`, `--theme-hover`, `--theme-light`, `--theme-text` e `--theme-border` para cada paleta em `src/app/globals.css`.

### 2.2. Higienização da Página de Perfil (`PerfilView.tsx`)
- **Remoção de Módulos Alheios:** Eliminados o bloco de simulação de usuários, a gestão de assinaturas e a alteração de papéis (centralizados na área administrativa).
- **Remoção de Redundâncias:** Retirados o botão "Criar Consórcio" (já acessível no cabeçalho superior) e o texto técnico de capacidades da conta.
- **Identidade e Ações Claras:** Card com avatar e badge do papel, botão contextual "Migrar de Plano" para contas Comum/Pro/Pro-Master, botão "Salvar Alterações" com feedback via `ToastModal` e botão de logout no rodapé.

### 2.3. Máscaras Dinâmicas e Validação Matemática da Chave Pix (`finance.ts`)
Implementação de utilitários no módulo financeiro central:
- **Celular:** Formatação como `(00) 00000-0000`, validação de DDD (11 a 99) e obrigatoriedade do dígito 9 para números de 11 dígitos.
- **CPF / CNPJ:** Formatação adaptativa em tempo real (até 11 dígitos formata como `000.000.000-00`; a partir do 12º dígito migra para `00.000.000/0001-00`). Validação estrita por algoritmo de Módulo 11 com rejeição de sequências repetidas.
- **E-mail:** Normalização em minúsculas e validação por regex oficial.
- **Chave Aleatória:** Normalização no padrão canônico UUID (`8-4-4-4-12` hexadecimais).
- **Feedback em Tempo Real:** No formulário do perfil, bordas e ícones contextuais (verde para válido, âmbar para dados incompletos) com mensagem de orientação imediata e atalho rápido "Copiar do WhatsApp".

### 2.4. Otimizações de Usabilidade no Painel Admin (`AdminView.tsx`)
- **Participantes Cadastrados:**
  - Altura máxima com scroll vertical fluido (`max-h-[480px] overflow-y-auto`).
  - Cabeçalho fixo (*sticky header*: `sticky top-0 bg-slate-50 z-10`) preservando as colunas durante a rolagem.
  - Barra de busca integrada diretamente no cabeçalho do card com filtros de Role e pesquisa por **Nome**, **E-mail** e **Telefone** (com suporte inteligente a dígitos limpos e mascarados).
- **Gestão Rápida de Níveis de Acesso:**
  - Scroll vertical delimitado (`max-h-[380px] overflow-y-auto`).
  - Campo de busca dedicado por Nome, E-mail ou Telefone com contador de resultados e estado vazio amigável.
  - Exibição do telefone do usuário nos cards individuais ao lado do e-mail.

### 2.5. Busca por Nome e Telefone na Página de Gestão (`CriadorView.tsx`)
- **Controle de Contribuições:**
  - Campo de busca dedicado no cabeçalho por **Nome**, **Telefone/WhatsApp** ou **Cota**, funcionando em conjunto com os filtros de status (*Todos os Ciclos, Pendentes, Confirmados/Pagos, Em Atraso*).
  - Exibição destacada do telefone do participante com ícone em cada card de parcela.
- **Gestão Rápida de Níveis de Acesso na Gestão:**
  - Bloco incorporado na página de Gestão para usuários `SUPER_ADMIN`, com busca instantânea por Nome ou Telefone, scroll vertical de 380px e alteração em tempo real com `updateUserRoleAction`.

### 2.6. Mecanismo Universal de Paginação e Escalabilidade SaaS (`PaginationControl.tsx`)
Para evitar sobrecarga de renderização no DOM com o crescimento exponencial de registros no sistema (preparação para escala com milhares de participantes e parcelas):
- **Componente Reutilizável `PaginationControl.tsx`:**
  - Janela deslizante de números de página com elipses (`1`, `...`, `5`, `...`, `20`).
  - Navegação rápida: Primeira Página (`<<`), Anterior (`<`), Próxima (`>`), Última Página (`>>`).
  - Seletor configurável de itens por página (ex: `10, 25, 50, 100` ou `8, 16, 32, 50`).
  - Indicador textual dinâmico: *"Exibindo X–Y de Z itens"*.
  - Totalmente responsivo e estilizado com as variáveis CSS de tema ativo (`--theme-main`, `--theme-light`, etc.).
- **Aplicações nos Blocos Críticos:**
  1. **Admin - Participantes Cadastrados:** Paginação nativa com reset reativo ao alterar filtros de texto ou perfil.
  2. **Admin - Gestão Rápida de Níveis de Acesso:** Paginação sob demanda com reset na busca.
  3. **Gestão - Controle de Contribuições:** Paginação sobre parcelas com reset automático ao filtrar por status ou busca.
  4. **Gestão - Gestão Rápida de Níveis de Acesso:** Paginação sob demanda integrada.

---

## 3. Cobertura de Testes Automatizados

1. **Regras Financeiras & Máscaras (`tests/finance.test.mjs`):**
   - Criação do **Teste 14**, cobrindo todas as variações de máscaras, algoritmos de dígito verificador de CPF e CNPJ, números de celular e formatos UUID.
2. **Atualização Cadastral (`tests/perfil_dados.test.mjs`):**
   - Garantia de persistência ordenada de logs de auditoria e validação de dados cadastrais.
3. **Status da Suíte Geral:**
   - **16 de 16 suítes de testes aprovadas com 100% de sucesso**.
   - **`npm run build`** compilado com tipagem TypeScript e lint aprovados.

---

## 4. Consequências e Benefícios

- **Experiência do Usuário (UX):** Telas com propósitos estritamente delimitados — perfil pessoal e focado no usuário; painel administrativo completo e ergonômico.
- **Integridade de Dados:** Eliminação de chaves Pix inválidas que causavam falha nas transferências entre participantes.
- **Escalabilidade de Interface:** Tanto a tabela de participantes quanto a lista de papéis comportam centenas de contas sem degradar o layout.
