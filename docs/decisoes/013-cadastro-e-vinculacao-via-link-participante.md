---
type: adr
title: "ADR 013 - Cadastro Oficial e Vinculação de Conta via Link de Acesso do Participante"
status: aceito
date: 2026-10-24
tags: [onboarding, participante, autenticacao, seguranca, vinculacao, pix, rbac]
---

# ADR 013: Cadastro Oficial e Vinculação de Conta via Link de Acesso do Participante

## Contexto
Ao criar um consórcio no Clube da Cota, o organizador frequentemente cadastra participantes informando apenas o Primeiro Nome ou Apelido (ex: "Junior Brito", "Patrick"), sem possuir o e-mail oficial, telefone ou chave Pix do participante naquele momento. O sistema gerava cotistas com e-mails temporários (`...@clubedacota.local`) e tokens únicos de acesso direto (`/participante/[token]`).

No entanto, faltava o elo de conexão para que o participante:
1. Pudesse transformar sua cota em uma conta de usuário oficial com login próprio no sistema (`/`).
2. Tivesse a cota, parcelas, comprovantes e histórico financeiro automaticamente vinculados à sua conta.
3. Se já possuísse cadastro prévio na plataforma (com o mesmo e-mail real), pudesse vincular a nova cota à sua conta existente com autenticação segura, eliminando contas duplicadas.
4. Informasse com facilidade sua chave Pix e preferência de pagamento direto para receber a contemplação.

---

## Decisão de Arquitetura

Implementamos o fluxo completo de **Onboarding e Vinculação pelo Link de Acesso do Participante** nas seguintes camadas:

### 1. Detecção Inteligente de Status de Conta (`src/app/actions.ts` - `getParticipanteByToken`):
- O carregamento da cota via token avalia as flags do usuário:
  - `isActivated`: Se o usuário já concluiu seu cadastro oficial.
  - `isEmailTemporario`: Verifica se o e-mail cadastrado pertence ao domínio gerado automaticamente (`@clubedacota.local`).
- Se `!isActivated` ou `isEmailTemporario`, o sistema identifica que a cota aguarda ativação pelo titular.

### 2. Ação de Conclusão e Vinculação (`completarCadastroParticipanteAction`):
- **Validação de Entrada:**
  - Nome completo obrigatório.
  - E-mail válido e normalizado em minúsculas (rejeita e-mails temporários `@clubedacota.local`).
  - Senha com no mínimo 6 caracteres.
  - Dados opcionais de WhatsApp, Chave Pix, Tipo de Chave Pix e preferência de Pix Direto.
- **Caso A — Usuário Novo:**
  - Atualiza o registro de usuário provisório existente com o nome real, e-mail real, telefone, chave Pix, hash criptográfico de senha via `bcryptjs` e marca `isActivated = true`.
- **Caso B — Usuário Existente no Sistema (Mesclagem Segura):**
  - Se o e-mail informado já estiver cadastrado em outra conta, o sistema **exige a senha correta dessa conta existente** para evitar sequestro de cotas.
  - Com a senha validada:
    - Transfere a titularidade da `CotaParticipante` para a conta existente.
    - Transfere as `Contribuicao` (parcelas), `Comprovante` e `AuditoriaLog`.
    - Deleta com segurança a conta temporária órfã.
- **Auditoria:** Grava evento de auditoria `ATIVACAO_CONTA_PARTICIPANTE`.
- **Login Imediato:** Emite cookie de sessão `clube_cota_session` (30 dias de validade), permitindo acesso instantâneo ao painel inicial (`/`).

### 3. Gestão Contínua de Chave Pix (`updateParticipantPixByTokenAction`):
- Permite que o cotista altere ou cadastre sua Chave Pix a qualquer momento via link de acesso, mantendo a chave atualizada para a data do sorteio.

### 4. Interface do Participante (`src/app/participante/[token]/page.tsx`):
- **Banner de Ativação em Destaque:** Para cotas não ativadas, exibe card com gradiente Verde Floresta convidando o cotista a *"Completar Cadastro & Criar Senha"*.
  - Campos: Nome, E-mail, WhatsApp (com máscara automática), Tipo de Chave Pix (CPF, Telefone, E-mail, Aleatória), Chave Pix, Checkbox de Pix Direto, Senha e Confirmação.
- **Badge de Conta Conectada:** Para cotas já ativadas, substitui o formulário por um badge verde esmeralda *"Conta Oficial Conectada"* com atalho direto *"Acessar Painel Principal"* e botão discreto para atualizar Chave Pix.

### 5. Indicadores no Header e Criador (`Header.tsx` e `CriadorView.tsx`):
- Adicionada categorização para a ação `ATIVACAO_CONTA_PARTICIPANTE` exibindo badge `Cadastro Ativado` e ícone `UserCheck`.

---

## Consequências
- **Positivas:**
  - O participante não precisa aguardar o criador do consórcio cadastrar seus dados bancários ou e-mail.
  - Reduz drasticamente o atrito de onboarding no Clube da Cota, permitindo que usuários entrem via link de convite e virem usuários ativos da plataforma.
  - Segurança estrita contra sequestro de contas: ninguém consegue vincular uma cota a um e-mail de terceiro sem saber a senha daquele e-mail.
  - Testado e coberto com 100% de sucesso na suíte `tests/cadastro_participante_link.test.mjs`.
