---
type: adr
title: "ADR 006: Edição de Dados Cadastrais e Substituição de Participantes (Repasse de Cota)"
status: "Aceito"
date: 2026-10-24
tags: [participantes, gestao, repasse-de-cota, substituicao, whatsapp, auditoria, seguranca]
---

# ADR 006: Edição de Dados Cadastrais e Substituição de Participantes (Repasse de Cota)

## Contexto
Durante o ciclo de vida de um consórcio entre amigos ou colaboradores, eventos operacionais e pessoais exigem atualizações cadastrais ou repasses de titularidade:
1. **Erros de Digitação ou Mudanças de Contato:** Participantes alteram seu número de WhatsApp, chave Pix ou nome, necessitando de correção rápida pelo gestor do grupo.
2. **Desistência ou Transferência de Cota (Repasse):** Um membro não pode mais honrar os pagamentos ou acorda com terceiros a cessão da sua cota.
3. **Comunicação Direta via WhatsApp:** O organizador necessita de links diretos para enviar o magic link de acesso e lembretes aos participantes.

Desafios fundamentais que precisavam ser resolvidos:
* **Segurança no Acesso Passwordless:** Ao repassar uma cota, o link mágico anterior do participante desistente não pode mais conceder acesso à cota.
* **Integridade Contábil e Histórica:** Parcelas já pagas por um participante antigo devem permanecer vinculadas a ele nos relatórios e auditorias. Apenas as parcelas a partir do ciclo de corte devem ser assumidas pelo novo participante.
* **Cotas já Contempladas:** Caso a cota já tenha sido sorteada/contemplada, o gestor precisa ser alertado com destaque visual para evitar fraudes ou prejuízos ao grupo.
* **Rastreabilidade e Compliance:** Toda edição ou transferência de titularidade deve registrar na trilha de auditoria o autor, a cota, os dados anteriores/novos e uma justificativa obrigatória.

## Decisão

### 1. Modelo de Dados e WhatsApp
* Adicionado o campo `telefone String?` ao modelo `User` no Prisma.
* Implementadas funções puras em `src/lib/finance.ts`:
  * `formatarTelefone(valor)`: formatação brasileira com máscara automática `(99) 99999-9999`.
  * `sanitizarTelefone(valor)`: higienização para dígitos puros.
  * `gerarLinkWhatsApp({ telefone, mensagem })`: geração automática de link `https://wa.me/55...` com codificação URL para abertura no WhatsApp Web ou App móvel.
* Campo de WhatsApp integrado na criação do consórcio (`CriarConsorcioWizard`), na edição do participante e no modal de compartilhamento rápido.

### 2. Edição de Dados Cadastrais do Participante
* Criada a Server Action `updateParticipantInfoAction`:
  * Valida autorização RBAC (Criador do consórcio, Pro Master ou Super Admin).
  * Permite atualizar Nome, E-mail (com validação anti-duplicidade), WhatsApp/Telefone, Tipo de Chave Pix, Chave Pix e preferência de Pix Direto.
  * Registra log de auditoria com `tipoAcao: "EDICAO_DADOS_PARTICIPANTE"`, capturando snapshot do estado anterior e novo.

### 3. Substituição de Participante (Repasse de Cota)
* Criada a Server Action `substituteParticipantAction`:
  * Permite repassar para um **Novo Participante** (com criação sob demanda e sem exigir e-mail) ou para um **Participante Existente** do grupo.
  * **Invalidação Imediata de Acesso:** Gera um novo `tokenAcesso` exclusivo (`cp_...`), revogando instantaneamente o token antigo do desistente.
  * **Corte Inteligente de Parcelas:** Reatribui apenas as contribuições cujo `numeroCiclo >= aPartirDoCiclo`. Parcelas passadas permanecem atribuídas ao titular histórico.
  * **Alerta de Contemplação Prévia:** Identifica se a cota já foi contemplada e exige ciência do gestor.
  * **Justificativa Obrigatória:** Exige justificativa fundamentada (mínimo de 5 caracteres) e campo opcional para registro do acerto financeiro entre as partes.
  * **Trilha de Auditoria:** Registra log `SUBSTITUICAO_PARTICIPANTE_COTA` detalhando número da cota, ciclo de corte, parcelas reatribuídas, dados completos de ambos os participantes e justificativa.

### 4. Notificações e Experiência do Usuário (UI/UX)
* Criado modal de edição de participante (`modalEditarParticipanteAberto`) e modal de repasse (`modalRepassarAberto`) em `CriadorView.tsx`.
* Botões de ação contextuais em cada linha de cota: ✏️ `Editar`, 🔄 `Repassar` e `Acesso`.
* Integrado ao componente `Header.tsx` e `ToastModal`:
  * Badge `Participante Editado` (ícone `Edit3`).
  * Badge `Repasse de Cota` (ícone `UserCheck`).

## Consequências
* O organizador possui autonomia completa para gerenciar sua base de cotistas com total transparência.
* Segurança reforçada: participantes que saem do consórcio perdem o acesso aos dados do grupo.
* Integridade de relatórios e auditoria contábil preservada sem sobrescrita destrutiva de histórico.
