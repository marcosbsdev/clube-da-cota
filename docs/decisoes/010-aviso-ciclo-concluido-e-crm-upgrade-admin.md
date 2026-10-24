---
type: adr
title: "ADR 010: Alerta de Ciclo Concluído, Encerramento Proativo e Radar CRM de Upgrade para o Administrador"
status: "Aceito"
date: 2026-10-24
tags: [consorcio, ciclo-concluido, cs, crm, upgrade, saas, freemium, admin, whatsapp]
---

# ADR 010: Alerta de Ciclo Concluído, Encerramento Proativo e Radar CRM de Upgrade para o Administrador

## Contexto
Com a implementação do Modelo A de monetização (1 consórcio ativo simultâneo no Plano Comum gratuito, e múltiplos consórcios no Pro/Pro Master), surgiu uma oportunidade chave de experiência do usuário (UX) e Customer Success (CS):
1. Quando um consórcio atinge o seu cronograma final (a data do último vencimento programado já passou), o organizador muitas vezes concluiu a bolada mas deixa o grupo ativo indefinidamente por esquecimento.
2. Esse esquecimento ocupava a sua cota de consórcio ativo, gerando atrito caso o criador tentasse abrir um novo consórcio e recebesse um bloqueio de limite.
3. Além disso, o momento em que o consórcio é finalizado com sucesso representa o pico de satisfação e confiança do organizador com a plataforma — sendo a oportunidade mais propícia para a oferta de planos pagos (Plano Pro ou Pro Master).
4. Do lado da administração da plataforma, faltava uma ferramenta proativa (CRM) que permitisse ao Super Admin (Marcos Batista) visualizar consórcios que concluíram seus ciclos, contatar os organizadores pelo WhatsApp de forma humanizada e, caso acordado, realizar o encerramento administrativo.

## Decisão

### 1. Funções Puras de Análise de Ciclo (`src/lib/finance.ts`)
* **`analisarCicloConsorcio`:**
  * Determina a `dataUltimoVencimento` a partir da maior data de vencimento entre as contribuições reais ou ciclos calculados.
  * Compara com a data atual para computar `isCicloConcluido` e `diasDecorridos`.
  * Computa a contabilidade de quitação: `totalContribuicoes`, `totalPagas`, `totalPendentes`, `porcentagemQuitado` e `is100PorcentoQuitado` (quando não há parcelas em aberto).
* **`gerarMensagemFollowupConsorcio`:**
  * Gera mensagens personalizadas e cordiais para o WhatsApp dependendo do cenário:
    * **Quitado no Plano Comum:** Parabeniza pelo sucesso, orienta o encerramento no painel para liberar a vaga gratuita de consórcio ou sugere o upgrade para o Plano Pro para gerenciar múltiplos grupos simultâneos.
    * **Quitado no Plano Pro/Pro Master:** Parabeniza pela entrega das boladas e orienta o encerramento para liberar cota de consórcios ativos da assinatura.
    * **Com Pendências:** Oferece suporte na conciliação e conferência financeira para ajudar a encerrar os recebimentos em atraso.

### 2. Visão do Criador (`CriadorView.tsx`)
* Quando `consorcio.status === "ATIVO"` e `dataUltimoVencimento < hoje`:
  * Um card/banner moderno e informativo é exibido no topo:
    * Se 100% quitado: badge verde/dourado celebrando a conclusão e informando que o encerramento liberará a vaga para novos consórcios.
    * Se com pendências: badge âmbar alertando sobre parcelas pendentes e oferecendo autonomia para manter ativo ou encerrar.
  * **Ações Disponíveis ao Criador:**
    * `[🔒 Encerrar e Liberar Vaga]`: Abre diretamente o modal de encerramento seguro.
    * `[⏳ Manter Ativo por enquanto]`: Oculta o aviso temporariamente na sessão para o organizador aguardar pagamentos remanescentes.

### 3. Radar de Consórcios Concluídos & CRM no Painel Super Admin (`GestaoAssinaturasAdmin.tsx`)
* Criada a aba **"Ciclos Concluídos ([N])"** no painel administrativo:
  * Exibe contadores de status: Total Vencidos, 100% Quitados e Com Pendências.
  * Filtros dinâmicos por status de quitação (`Todos`, `100% Quitados`, `Com Pendências`) e busca textual por consórcio ou organizador.
  * Card detalhado de cada grupo com barra de progresso de arrecadação, dados do organizador (Nome, WhatsApp, Plano atual) e dias decorridos.
  * **Botão 1-Clique WhatsApp (CS / Upgrade):** Abre conversa no WhatsApp com mensagem contextualizada gerada automaticamente com DDI e texto codificado.
  * **Botão Encerrar Consórcio (Ação Super Admin):** Modal dedicado para o administrador encerrar o consórcio com justificativa de auditoria (ex: "Encerramento acordado via WhatsApp").

## Consequências
* A plataforma agora guia ativamente os organizadores no fechamento de ciclos, prevenindo dúvidas de bloqueio de capacidade.
* O administrador ganha um canal direto e contextualizado de pós-venda, Customer Success e conversão para os planos Pro e Pro Master.
* Totalmente coberto por testes automatizados em `tests/consorcio_vencido_gestao.test.mjs`, elevando a suíte para 57 testes 100% aprovados.
