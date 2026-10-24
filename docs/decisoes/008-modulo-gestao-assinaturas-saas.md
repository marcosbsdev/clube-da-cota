---
type: adr
title: "ADR 008: Módulo de Gerenciamento de Assinaturas e Planos SaaS"
status: "Aceito"
date: 2026-10-24
tags: [assinaturas, saas, planos, vigencia, upgrade, pix, admin, rbac, financeiro]
---

# ADR 008: Módulo de Gerenciamento de Assinaturas e Planos SaaS

## Contexto
Com a implementação dos limites de planos (Plano Comum gratuito, Plano Pro a R$ 19,90/mês e Plano Pro Master a R$ 29,90/mês), a aplicação precisava de um controle administrativo completo para a gestão de assinaturas recorrentes (SaaS):
1. Controle de vigência/validade da assinatura (`planoExpiraEm` de 30 dias para pagamentos mensais).
2. Fluxo in-app para anexar comprovantes de Pix para ativação de contas.
3. Painel administrativo para o Super Admin (Marcos Batista) com indicadores financeiros (MRR, assinantes ativos, pendências), aprovação/recusa de comprovantes com 1 clique e controle de renovações.
4. Degradação segura para regras do Plano Comum caso a assinatura expire sem renovação.

## Decisão

### 1. Modelagem de Dados (`prisma/schema.prisma`)
* Adicionado campo `planoExpiraEm DateTime?` ao modelo `User`.
* Criado o modelo `AssinaturaPlano`:
  * `usuarioId`: Cotista solicitante.
  * `plano`: `"PRO"` ou `"PRO_MASTER"`.
  * `valor`: R$ 19,90 ou R$ 29,90.
  * `mesesVigencia`: Período concedido (padrão: 1 mês / 30 dias).
  * `status`: `"PENDENTE"`, `"APROVADO"`, `"RECUSADO"`, `"CANCELADO"`.
  * `comprovanteUrl` / `comprovanteNome`: Armazenamento de arquivo/imagem do Pix.
  * `solicitadoEm`, `dataInicio`, `dataFim`: Controle de datas de vigência.
  * `aprovadoPorId`: Relação com o Super Admin que validou o pagamento.
  * `motivoRecusa` e `observacoes`: Trilha de justificativas.

### 2. Funções de Domínio de Vigência (`src/lib/plans.ts`)
* `getVigenciaPlano(user)`: Avalia o status em tempo de execução:
  * `PERMANENTE`: Contas `COMUM` (gratuita) ou `SUPER_ADMIN` (vitalícia).
  * `VIGENTE`: Plano pago com mais de 5 dias restantes de acesso.
  * `A_VENCER`: Plano pago com 5 dias ou menos restantes (aciona alerta amigável de renovação).
  * `EXPIRADO`: Plano pago cuja data já expirou (`isAtivo: false`, bloqueando novas criações além do limite gratuito).
* `calcularNovaDataExpiracao(dataAtual, dias)`: Cálculo cumulativo que não desconta saldo restante caso o usuário renove antes do término.

### 3. Server Actions de Gestão SaaS (`src/app/actions.ts`)
* `solicitarAssinaturaAction`: Envia comprovante Pix direto pelo app ou atualiza pendência existente.
* `aprovarAssinaturaAction`: Super Admin aprova a transferência, atualiza o papel do usuário, calcula +30 dias de validade e gera registro de auditoria imutável.
* `recusarAssinaturaAction`: Super Admin recusa com justificativa clara (ex: valor divergente).
* `renovarAssinaturaManualAction`: Concede renovações manuais (+30, +60 ou +90 dias).
* `cancelarAssinaturaAction`: Super Admin cancela e rebaixa usuário para Comum.
* `getPainelAssinaturasAction`: Carrega métricas SaaS consolidadas (MRR estimado, assinantes ativos, pendências e a vencer).

### 4. Painel Administrativo `GestaoAssinaturasAdmin.tsx`
* Exibido com exclusividade para o Super Admin na tela de Perfil:
  * **Métricas SaaS em Tempo Real:** MRR Estimado em R$, Total de Assinantes Ativos, Solicitações Pendentes de Pix e Assinaturas a Vencer em até 5 dias.
  * **Aba Solicitações Pendentes:** Lista de solicitações com botão "Ver Comprovante Pix" (modal de visualização de foto/documento), link direto de WhatsApp com o cliente, botão de recusa com motivo e botão verde de aprovação com 1 clique (+30 dias).
  * **Aba Assinantes:** Busca por nome/e-mail, filtro por plano, data de vencimento e ações rápidas de renovação manual (+30d) ou cancelamento.
  * **Aba Histórico & Auditoria:** Linha do tempo com todas as movimentações e aprovações passadas.

### 5. Envio de Comprovante pelo App (`ModalUpgradePlanos.tsx`)
* Usuário pode optar entre:
  * Enviar comprovante via WhatsApp diretamente para `(11) 96303-0266`.
  * Anexar o comprovante Pix diretamente na aplicação com tela de confirmação de envio em tempo real.

### 6. Alertas no Perfil do Usuário (`PerfilView.tsx`)
* Usuários `PRO` e `PRO_MASTER` contam com card visual indicando a data de validade da assinatura.
* Banners inteligentes alertam quando faltam 5 dias ou menos para o vencimento, ou quando a assinatura estiver expirada, com link direto de renovação.

## Consequências
* O processo de monetização do Clube da Cota deixa de ser manual e ganha controle financeiro, controle de vigências e painel de governança completo.
* Gestão segura e transparente para Marcos Batista (Super Admin) e experiência sem atritos para os organizadores de consórcios.
