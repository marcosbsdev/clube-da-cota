---
type: adr
title: "ADR 007: Limites de Capacidade por Plano e Mensagem Padrão de Upgrade via Pix"
status: "Aceito"
date: 2026-10-24
tags: [planos, monetizacao, upgrade, pix, limites, wizard, rbac]
---

# ADR 007: Limites de Capacidade por Plano e Mensagem Padrão de Upgrade via Pix

## Contexto
O Clube da Cota adota um modelo de monetização estruturado em 3 níveis de plano de acesso:
1. **Comum (Gratuito):** Permite participar de consórcios como membro e criar até 1 consórcio ativo com no máximo 10 participantes.
2. **Pro (R$ 19,90 / mês):** Permite criar e gerenciar até 3 consórcios ativos simultâneos com até 20 participantes por grupo.
3. **Pro Master (R$ 29,90 / mês):** Consórcios ativos ilimitados, participantes ilimitados e acesso exclusivo ao Módulo de Governança e Trilha de Auditoria com suporte prioritário.

Anteriormente, o sistema apenas aplicava a restrição no backend durante o envio final da criação do consórcio, exibindo uma mensagem genérica e forçando o organizador a preencher todas as 4 etapas antes de descobrir que havia atingido a capacidade máxima do seu plano.

Além disso, era necessário padronizar a mensagem e instruções de pagamento Pix para a migração de planos.

## Decisão

### 1. Centralização de Regras e Instruções de Pagamento (`src/lib/plans.ts`)
* Criada a estrutura de dados `PLANOS_INFO` definindo capacidades, valores e benefícios dos planos `COMUM`, `PRO` e `PRO_MASTER`.
* Padronizados os dados de pagamento de ativação em `DADOS_PAGAMENTO_UPGRADE`:
  * **Favorecido:** Marcos Batista
  * **Chave Pix (E-mail):** `markos.system@gmail.com`
  * **WhatsApp de Contato / Comprovante:** `(11) 96303-0266` (link direto `wa.me/5511963030266`)
  * **Valores Oficiais:** Plano Pro: **R$ 19,90 mensal** | Plano Pro Master: **R$ 29,90 mensal**

### 2. Tela de Bloqueio Amigável no Wizard de Criação (`CriarConsorcioWizard.tsx`)
* Se um usuário no plano `COMUM` já possuir 1 consórcio ativo (ou no plano `PRO` já possuir 3 consórcios ativos), ao acessar a tela de criação, é exibida de imediato uma tela com:
  * Alerta de capacidade máxima do plano (`x de y consórcios ativos`).
  * Comparativo dos planos superiores (`Pro` e `Pro Master`).
  * Caixa de pagamento Pix para Marcos Batista com botão de cópia de chave e link de WhatsApp para envio de comprovante.
  * Botão para retornar aos seus consórcios existentes sem frustração de preenchimento inútil.

### 3. Validação em Tempo Real na Etapa de Participantes
* Na Etapa 2 do assistente, a interface exibe o indicador dinâmico de capacidade de cotistas (`totalMembros / maxParticipantes`).
* Caso a adição de um novo participante individual ou compartilhado vá exceder o teto do plano (10 para Comum, 20 para Pro), a adição é bloqueada e o modal `ModalUpgradePlanos` é acionado automaticamente.

### 4. Componente Reutilizável `ModalUpgradePlanos.tsx`
* Criado modal interativo contendo seletores visuais dos planos, checklist de recursos, chave Pix de Marcos Batista com botão "Copiar Chave" e botão para envio de comprovante via WhatsApp.
* Integrado na tela de Perfil (`PerfilView.tsx`) através do botão *"Migrar de Plano"*.

### 5. Respostas Amigáveis no Servidor (`src/app/actions.ts`)
* A Server Action `createConsorcioAction` retorna a mensagem padrão e amigável orientando o pagamento Pix para Marcos Batista caso qualquer restrição seja acionada.

## Consequências
* Experiência de usuário transparente, sem surpresas desagradáveis no fim de longos formulários.
* Fluxo de monetização claro, direto e automatizado para solicitação de upgrade.
