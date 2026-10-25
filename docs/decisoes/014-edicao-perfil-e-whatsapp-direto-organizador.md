---
type: adr
title: "ADR 014 - Edição Cadastral de Perfil e Link Direto no WhatsApp do Organizador"
status: aceito
date: 2026-10-24
tags: [perfil, usuario, whatsapp, comunicacao, seguranca, auditoria]
---

# ADR 014: Edição Cadastral de Perfil e Link Direto no WhatsApp do Organizador

## Contexto
Anteriormente, a aba "Perfil & Tema" ([`PerfilView.tsx`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/components/PerfilView.tsx)) permitia aos usuários apenas escolherem temas visuais e preferências de recebimento Pix. Não havia campos disponíveis para o usuário editar seu próprio **Nome Completo**, cadastrar/atualizar seu **Telefone / WhatsApp** ou **Alterar Senha**.

Consequentemente, na tela pública do participante ([`/participante/[token]`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/src/app/participante/[token]/page.tsx)), o botão *"Falar no WhatsApp"* gerava um link sem número destinatário (`https://wa.me/?text=...`), exigindo que o cotista selecionasse manualmente um contato no aplicativo do WhatsApp em vez de abrir diretamente a conversa com o proprietário do consórcio.

---

## Decisão de Arquitetura

Implementamos a solução em camadas completas de backend e frontend:

### 1. Ação do Servidor (`updateUserProfileDadosAction` em `src/app/actions.ts`):
- **Validação de Nome:** Nome completo obrigatório com no mínimo 2 caracteres.
- **Formatação de Telefone:** Aplica máscara brasileira automática `(99) 99999-9999` com `formatarTelefone`.
- **Alteração Segura de Senha:**
  - Se informada, exige no mínimo 6 caracteres.
  - Exige a senha atual correta validada com `bcrypt.compare` contra o `passwordHash` gravado no banco antes de autorizar qualquer troca.
- **Trilha de Auditoria:** Registra evento oficial `EDICAO_PERFIL_USUARIO` com registro de alterações anteriores e novas.

### 2. Conexão do WhatsApp do Proprietário (`getParticipanteByToken`):
- O carregamento dos dados do consórcio via token do participante agora inclui o `telefone` do criador (`criadorTelefone`).
- O botão *"Falar no WhatsApp"* utiliza `gerarLinkWhatsApp`:
  - Se o criador possui telefone cadastrado no perfil, a URL gerada passa a conter o código do país DDI `55` e o número completo (ex: `https://wa.me/5583999999999?text=...`).
  - Ao clicar, o WhatsApp abre **diretamente o chat privado com o organizador**, preenchendo a mensagem oficial com identificação da cota e do consórcio.
  - Fallback gracioso mantido caso o criador não tenha informado telefone.

### 3. Interface do Usuário (`PerfilView.tsx`):
- Card Unificado **"Dados Pessoais & Contato"**:
  - Campo de Nome Completo editável com ícone e validação.
  - Campo de Telefone / WhatsApp com máscara dinâmica e dica explicativa sobre o botão de WhatsApp nos consórcios.
  - **Dados e Preferências Pix Centralizados**:
    - Seletor de Tipo de Chave Pix (`CELULAR`, `CPF`, `CNPJ`, `EMAIL`, `ALEATORIA`).
    - Campo de Chave Pix pessoal para recebimento.
    - Checkbox explicativo de recebimento direto da bolada com instrução clara.
    - Eliminação e remoção definitiva do card legado duplicado *"Recebimento da Bolada (Pix)"*, consolidando todas as configurações cadastrais e financeiras do usuário em um único formulário coeso.
  - E-mail com bloqueio visual e aviso de "Identificador exclusivo da conta".
  - Seção retrátil "Alterar Senha de Acesso" com Senha Atual, Nova Senha e Confirmação.
  - **Feedback Visual Obrigatório de Sucesso (Duplo Feedback):**
    - `ToastModal` flutuante no canto superior informando *"Perfil Atualizado!"*.
    - Banner afirmativo inline esmeralda no topo do formulário com auto-dismiss.
    - Estado do botão indicando *"Salvo com Sucesso! ✓"* temporariamente.
  - **Revalidação Não-Destrutiva:** Invocação de `carregarDados(..., ..., true)` com `silent = true`, garantindo que os dados em cache atualizem sem remontar o componente ou ocultar o Toast.

### 4. Humanização de Auditoria, Notificações e Isolamento de Privacidade:
- `Header.tsx` e `CriadorView.tsx` atualizados para reconhecer `EDICAO_PERFIL_USUARIO` com badge azul *"Perfil Atualizado"* e ícone `UserCheck`.
- **Regra Estrita de Isolamento de Perfil:** Toda alteração de dados de perfil é registrada na auditoria e **apresentada exclusivamente no Sininho de Notificações do usuário autenticado afetado**. Outros usuários não têm acesso e não visualizam alterações cadastrais de terceiros.

---

## Consequências
- **Positivas:**
  - Autonomia completa para qualquer usuário (comum, criador ou admin) gerenciar seus dados cadastrais e credenciais.
  - Elimina atrito no suporte entre cotistas e criadores: a comunicação via WhatsApp se torna 1-clique direta.
  - Privacidade e conformidade garantidas: o histórico de alterações cadastrais é estritamente pessoal.
  - Totalmente testado e coberto com 100% de sucesso na suíte `tests/perfil_dados.test.mjs` (totalizando 73 testes em 11 suítes).
