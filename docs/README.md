---
type: index
title: "Documentação do Sistema - Clube da Cota"
description: "Índice central de conhecimento e arquitetura do Clube da Cota no padrão Open Knowledge Format (OKF)."
tags: [arquitetura, okf, index, documentacao]
timestamp: 2026-10-24T09:30:00Z
---

# 📚 Clube da Cota - Base de Conhecimento (OKF)

Bem-vindo à documentação oficial do **Clube da Cota**. Toda a base de conhecimento do projeto é mantida de forma versionada e descentralizada neste diretório `docs/`, permitindo que desenvolvedores humanos e agentes de IA consultem e mantenham a integridade das regras de negócio.

---

## 🗺️ Mapa da Documentação

### 1. Módulos do Sistema (`docs/modulos/`)
* **[Consórcio & Regras Financeiras](./modulos/consorcio.md):** Cálculos da bolada, progressão de valores, ciclos mensais de contemplação, ordenação de cotas e regras de transparência.
* **[Governança & Trilha de Auditoria](./modulos/auditoria.md):** Registro imutável de eventos operacionais, filtros por tipo de evento, pesquisa textual e restrição RBAC exclusiva para Pro Master e Super Admin.
* **[Autenticação, Perfis & Sanitização](./modulos/autenticacao.md):** Hierarquia de 4 níveis de acesso (`COMUM`, `PRO`, `PRO_MASTER`, `SUPER_ADMIN`), controle de sessão e sanitização estrita de dados sensíveis (`sanitize.ts`).
* **[Identidade Visual & PWA](./modulos/pwa-identidade.md):** Identidade visual oficial (Verde Floresta `#044E3A` e moeda de ouro), manifesto PWA, ícones nativos e animação de carregamento.

### 2. Registros de Decisões de Arquitetura - ADRs (`docs/decisoes/`)
* **[ADR 001 - Redesign Espaçoso de Cards e Previsão Mensal por Ciclo](./decisoes/001-redesign-cards-e-ciclos.md):** Substituição do grid espremido de 2 colunas por cards em linha única, inclusão de Mês/Ano e harmonização total com as paletas dinâmicas.
* **[ADR 002 - Sub-Abas na Gestão e Isolamento da Auditoria](./decisoes/002-sub-abas-gestao-e-auditoria-rbac.md):** Divisão da Gestão do Grupo em Painel Operacional em largura total e Trilha de Auditoria dedicada restrita a Pro Master e Super Admin.
* **[ADR 003 - Sanitização de Dados Sensíveis no Cliente](./decisoes/003-sanitizacao-dados-sensiveis.md):** Eliminação de vazamento de `passwordHash` e `tokenAcesso` no retorno do servidor.
* **[ADR 004 - Pix Direto vs. Centralizado, Bolada Líquida e Chave Pix Obrigatória](./decisoes/004-pix-direto-vs-centralizado-e-chave-pix-obrigatoria.md):** Arquitetura de transferência direta ao contemplado no mês com cota retida no bolso (bolada líquida) vs. arrecadação centralizada, além de chave Pix do consórcio obrigatória com os 4 tipos oficiais selecionáveis (`Celular`, `CPF/CNPJ`, `E-mail`, `Chave Aleatória`).
* **[ADR 005 - Notificações Flutuantes (ToastModal) em Substituição a Banners Fixos](./decisoes/005-toast-modal-notificacoes-flutuantes.md):** Substituição de banners inline estáticos por notificações flutuantes no canto superior com auto-dismiss em 4s e fechamento manual, eliminando saltos indesejados de layout.
* **[ADR 006 - Edição de Dados Cadastrais e Substituição de Participantes (Repasse de Cota)](./decisoes/006-edicao-e-substituicao-de-participantes.md):** Edição de perfil de cotistas (Nome, WhatsApp, Pix), repasse seguro de cotas para novos ou existentes membros, revogação imediata de token passwordless, reatribuição contábil de parcelas futuras e rastreabilidade total em auditoria.
* **[ADR 007 - Limites de Capacidade por Plano e Mensagem Padrão de Upgrade via Pix](./decisoes/007-limites-de-planos-e-upgrade-pix.md):** Alertas proativos e tela de bloqueio com capacidade de consórcios e participantes, padronização de instruções Pix para Marcos Batista (Pro: R$ 19,90 e Pro Master: R$ 29,90) e modal interativo de migração.

### 3. Backlog e Plano de Produção
* **[Pendências & Segurança para Produção](./pendencias.md):** Plano detalhado para endurecimento de segurança (sessão assinada, proteção de recuperação de senha e flags de ambiente).
