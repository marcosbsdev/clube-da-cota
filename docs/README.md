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

### 🏛️ Arquitetura de Sistemas
* **[Desenho de Arquitetura de Sistemas](./arquitetura-do-sistema.md):** Especificação técnica completa com diagramas visuais (Visão Geral, Camadas de Software, Stack Tecnológica, Diagrama ER, Matriz RBAC, Fluxos de Negócio e Infraestrutura Docker).

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
* **[ADR 008 - Módulo de Gerenciamento de Assinaturas e Planos SaaS](./decisoes/008-modulo-gestao-assinaturas-saas.md):** Controle de validade e vigência de 30 dias (`planoExpiraEm`), painel administrativo exclusivo do Super Admin com métricas financeiras (MRR, assinantes ativos, pendências), visualizador de comprovantes Pix, aprovação/recusa com 1 clique e envio de comprovante direto pelo app.
* **[ADR 009 - Modelo A de Monetização (1 Consórcio Ativo Simultâneo), Encerramento e Exclusão Segura](./decisoes/009-modelo-a-um-ativo-simultaneo-e-ciclo-vida-consorcio.md):** 1 consórcio ativo simultâneo para o Plano Comum (múltiplos grupos paralelos exigem upgrade para Pro), consórcio encerrado congelado em modo somente leitura (bloqueio de repasse e pagamentos), bloqueio de exclusão física se houver pagamentos confirmados e exclusão permitida de rascunhos sem pagamentos com liberação imediata da vaga.
* **[ADR 010 - Alerta de Ciclo Concluído, Encerramento Proativo e Radar CRM de Upgrade para o Administrador](./decisoes/010-aviso-ciclo-concluido-e-crm-upgrade-admin.md):** Identificação automática de consórcios com último vencimento no passado, banner interativo para o criador decidir entre manter ativo ou encerrar (liberando vaga), e aba de oportunidades no painel Super Admin com botão de WhatsApp contextualizado para CS/Upgrade e encerramento administrativo.
* **[ADR 011 - Arquitetura Docker Multi-Stage, Multiplataforma e Suporte Nativo a PostgreSQL](./decisoes/011-arquitetura-docker-multiplataforma-e-postgresql.md):** Dockerfile multi-stage com build standalone Next.js (~150MB), orquestração via Docker Compose com PostgreSQL 16 Alpine, volumes persistentes e sincronização automática via entrypoint.
* **[ADR 012 - Humanização Completa de Notificações e Auditoria (Eliminação de JSON Bruto)](./decisoes/012-humanizacao-notificacoes-e-auditoria-sem-json-bruto.md):** Eliminação de strings JSON cruas em ações em lote, criação de cards visuais estruturados na trilha de auditoria e implementação de trava de proteção anti-JSON no sininho.
* **[ADR 013 - Cadastro Oficial e Vinculação de Conta via Link de Participante](./decisoes/013-cadastro-e-vinculacao-via-link-participante.md):** Onboarding fluido com criação de senha, unificação de cotas a contas existentes e gestão autônoma de chave Pix.
* **[ADR 014 - Edição Cadastral de Perfil e Link Direto no WhatsApp do Organizador](./decisoes/014-edicao-perfil-e-whatsapp-direto-organizador.md):** Formulário completo de dados pessoais (Nome, Telefone com máscara, Senha) na aba Perfil & Tema, conexão direta do botão de WhatsApp ao chat privado do organizador e obrigatoriedade de feedback visual de sucesso.
* **[ADR 015 - Agenda do Criador, Autocomplete e Vínculo Inteligente de Participantes](./decisoes/015-agenda-do-criador-autocomplete-e-vinculo-de-participantes.md):** Memória de contatos do organizador com ordenação por frequência de participação, autocomplete preditivo no Passo 2 e reaproveitamento inteligente de contas sem duplicação.
* **[ADR 016 - Sorteio Aleatório e Definição Manual da Ordem de Contemplação](./decisoes/016-sorteio-aleatorio-e-definicao-manual-ordem-contemplacao.md):** Algoritmo Fisher-Yates com execução única no Sorteio 1, permuta manual flexível de posições no Passo 4 e congelamento seguro pós-sorteio.
* **[ADR 017 - Exportação e Compartilhamento de Imagem do Cronograma no WhatsApp](./decisoes/017-exportacao-imagem-cronograma-sorteio-whatsapp.md):** Geração de imagem PNG HD via Canvas 2D client-side no Passo 4 e Revisão Final, com download automático e compartilhamento assistido no WhatsApp.
* **[ADR 018 - Painel Super Admin para Gestão de Contas, Senhas e Governança](./decisoes/018-painel-super-admin-gestao-contas-e-usuarios.md):** Central administrativa para correção cadastral, redefinição de senhas com senhas provisórias amigáveis (`Cota#XXXX`), link direto para WhatsApp, Smart Merge atômico de contas duplicadas, transferência de cotas, visualização de "De ➔ Para" nas notificações e auditoria, e proibição estrita de banners estáticos inline (exclusividade do `ToastModal`).
* **[ADR 019 - Paletas Oficiais de Tema, Higienização do Perfil, Validação de Chave Pix, Paginação e Usabilidade](./decisoes/019-temas-oficiais-perfil-pix-e-usabilidade-admin.md):** Grade 3x2 com 6 paletas oficiais de cores, limpeza e desacoplamento da tela de perfil (remoção de módulos de Super Admin, simuladores e botões redundantes), máscaras dinâmicas e validação matemática de Chave Pix (Módulo 11 para CPF/CNPJ, Celular e UUID), busca reativa por Nome/Telefone/E-mail e componente universal de paginação (`PaginationControl`) para alta densidade e escala SaaS nas tabelas e listas de participantes, parcelas e papéis de acesso.

### 3. Diretrizes Globais de Interface & Feedback ao Usuário
* 🚨 **Proibição Estrita de Banners Estáticos Inline:** Banners ou caixas estáticas de mensagem inseridas no fluxo da página (`mensagemSucesso && <div className="...">`) estão **TERMINANTEMENTE PROIBIDOS**. Toda e qualquer confirmação de sucesso, erro ou alerta no sistema deve ser emitida **EXCLUSIVAMENTE pelo componente `ToastModal` flutuante** (`fixed top-4 ... z-50`) com auto-dismiss em 4 segundos, prevenindo saltos de layout (*layout shifts*) e garantindo visibilidade mesmo com a tela rolada.
* 🔒 **Regra Estrita de Auditoria & Notificações de Perfil:** Toda alteração de perfil **DEVE ser registrada na Auditoria (`EDICAO_PERFIL_USUARIO`, `EDICAO_ADMIN_USUARIO`, etc.) e apresentada nas Notificações do usuário afetado**. **Somente alterações relacionadas ao cadastro do mesmo** devem ser exibidas em seu painel (isolamento e confidencialidade estrita entre usuários sob preceitos da LGPD).
* ⚡ **Revalidação Não-Destrutiva (`silent = true`):** Ao invocar rotinas de atualização de dados em segundo plano após mutações (ex: `carregarDados`), deve-se sempre utilizar o modo silencioso (`silent = true`). Isso previne a montagem de telas de loading de página inteira que desmontem as views ativas ou destruam os modais/toasts antes da leitura pelo usuário.

### 4. Guias de Operação e Infraestrutura (`docs/guias/`)
* **[Execução Local com Docker e Deploy em Servidor Dedicado](./guias/docker-deploy.md):** Manual completo de comandos `docker compose up`, variáveis de ambiente e deploy em VPS com reverse proxy SSL (Caddy/Nginx).

### 5. Backlog e Plano de Produção
* **[Pendências & Segurança para Produção](./pendencias.md):** Plano detalhado para endurecimento de segurança (sessão assinada, proteção de recuperação de senha e flags de ambiente).
