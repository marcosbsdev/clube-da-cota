---
type: adr
title: "ADR 009: Modelo A de Monetização (1 Consórcio Ativo Simultâneo), Encerramento e Exclusão Segura"
status: "Aceito"
date: 2026-10-24
tags: [monetizacao, saas, freemium, modelo-a, encerramento, exclusao, rbac, ciclo-vida]
---

# ADR 009: Modelo A de Monetização (1 Consórcio Ativo Simultâneo), Encerramento e Exclusão Segura

## Contexto
Após a consolidação dos limites de capacidade da aplicação (Comum gratuito, Pro a R$ 19,90/mês e Pro Master a R$ 29,90/mês), levantou-se a necessidade de gerenciar o ciclo de vida dos consórcios:
1. Permitir que o criador encerre/arquive grupos concluídos.
2. Permitir que o criador exclua grupos criados por engano para teste (sem movimentação financeira).
3. Blindar a plataforma contra tentativas de reaproveitar o mesmo consórcio infinitamente via repasse de cotas sem nunca pagar o plano.
4. Definir a política de criação para o Plano Comum: **Modelo A — "1 Consórcio Ativo Simultaneamente"**.

## Decisão

### 1. Modelo A de Monetização (1 Ativo Simultâneo)
* **Plano Comum (Gratuito):** O usuário pode manter até **1 consórcio ativo simultaneamente (`status === "ATIVO"`)**.
* **Múltiplos Grupos Exigem Upgrade:** Caso tente criar um 2º consórcio enquanto o 1º estiver ativo, o assistente (`CriarConsorcioWizard.tsx`) e a action (`createConsorcioAction`) bloqueiam a criação e orientam a migração para o **Plano Pro** (até 3 consórcios ativos simultâneos por R$ 19,90/mês) ou **Pro Master** (ilimitados por R$ 29,90/mês).
* **Novo Consórcio Após Encerramento:** Quando o consórcio em andamento for concluído e encerrado (`status = "ENCERRADO"`), a cota de 1 ativo do usuário Comum é liberada, permitindo que ele crie um novo consórcio.
* **Bloqueio de Reativação:** O criador Comum não pode reativar um consórcio encerrado caso já tenha outro grupo ativo simultâneo.

### 2. Encerramento de Consórcio (Deleção Lógica - Somente Leitura)
* O criador ou administradores (`SUPER_ADMIN` ou `PRO_MASTER`) podem encerrar um consórcio através da ação `encerrarConsorcioAction`.
* **Proteção de Integridade (Somente Leitura):** Ao passar para `status: "ENCERRADO"`:
  * Nenhuma parcela pode ser confirmada ou estornada.
  * Nenhum participante ou cota pode ser editado ou repassado.
  * Nenhuma troca de posição ou sorteio é permitida.
  * O envio de comprovantes pelos cotistas em `ParticipanteView.tsx` é desabilitado.
  * Todo o histórico de cotas, pagamentos e auditoria permanece intacto para consulta e prestação de contas.
* **Blindagem contra Rodízio Infinito:** Como o consórcio encerrado fica congelado e os ciclos de contemplação são finitos, é impossível "reciclar" o grupo eternamente.

### 3. Exclusão de Consórcio (Deleção Física com Trava Financeira)
* A exclusão física (`excluirConsorcioAction`) apaga o consórcio em cascata (`cascade delete`).
* **Regra de Ouro:** Se o consórcio possuir **qualquer pagamento confirmado (`status === "PAGO"`)**, a exclusão física é **estritamente proibida** no servidor para resguardar os cotistas e manter a segurança jurídica.
* **Consórcios de Teste/Rascunho:** Caso o grupo não possua nenhum pagamento confirmado (`totalPagos === 0`), a exclusão é permitida mediante digitação do nome exato do grupo para confirmação.
* **Liberação de Vaga:** Ao excluir um consórcio de teste sem pagamentos, a vaga de consórcio ativo é liberada imediatamente.

### 4. Interface e Experiência do Usuário
* **`CriadorView.tsx`:**
  * Badge de status no painel (`Ativo` ou `Encerrado`).
  * Banner informativo escuro para consórcio encerrado com botão de reativação rápida.
  * Seção no modal de edição com botões para "Encerrar Consórcio" e "Excluir Consórcio de Teste".
  * Modais dedicados com confirmações de segurança e justificativa.
* **`ParticipanteView.tsx`:**
  * Banner informando que o consórcio foi finalizado pelo organizador e que os dados estão disponíveis para consulta.
* **`CriarConsorcioWizard.tsx`:**
  * Tela de capacidade orientando o encerramento do grupo anterior ou migração para gerenciar grupos simultâneos.

## Consequências
* Modelo Freemium equilibrado: permite adoção orgânica por pessoas físicas sem canibalizar a conversão para organizadores que precisam gerenciar múltiplos grupos paralelos.
* Suporte completo a 47 testes automatizados cobrindo os cenários em `tests/consorcio_ciclo_vida.test.mjs`.
