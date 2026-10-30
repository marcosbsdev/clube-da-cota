# 🏛️ Desenho de Arquitetura de Sistemas — Clube da Cota

Este documento apresenta a especificação técnica completa e os diagramas arquiteturais do **Clube da Cota**, detalhando as camadas de software, tecnologias adotadas, fluxo de comunicação, modelo de dados relacional e infraestrutura de execução.

---

## 1. Visão Geral e Pilares Arquiteturais

O **Clube da Cota** é uma plataforma moderna desenvolvida com foco em **Mobile-First / PWA**, governança financeira e autoatendimento intuitivo para grupos de consórcio entre amigos e familiares.

```mermaid
flowchart TD
    subgraph ClientLayer["Camada de Apresentação (Client-Side)"]
        PWA["PWA Mobile & Desktop\n(Next.js 14 App Router + React 18)"]
        UI_Components["Componentes Modulares & Design System\n(Tailwind CSS + Lucide Icons)"]
        ToastLayer["Notificações Flutuantes Globais\n(ToastModal Auto-Dismiss)"]
        CanvasEngine["Gerador de Imagens HD Canvas 2D\n(Export Cronograma PNG)"]
    end

    subgraph ServerLayer["Camada de Aplicação & Negócio (Server-Side)"]
        Actions["Next.js Server Actions ('use server')\n(End-to-End Type Safety)"]
        FinanceEngine["Motor Financeiro & Regras de Negócio\n(src/lib/finance.ts)"]
        PlansEngine["Gestão de Capacidade & Planos SaaS\n(src/lib/plans.ts)"]
        SanitizeEngine["Filtro de Segurança & Sanitização\n(src/lib/sanitize.ts)"]
        AuthRBAC["Controle de Acesso & Hash Bcrypt\n(src/lib/auth & bcryptjs)"]
    end

    subgraph DataLayer["Camada de Persistência & Dados"]
        PrismaORM["Prisma ORM 5.22\n(Transaction Manager & Schema)"]
        DB_Supabase["Supabase PostgreSQL 17\n(Produção Oficial Cloud - AWS us-east-1)"]
        DB_Postgres["PostgreSQL 16 Alpine\n(Docker Local / Standalone)"]
        DB_SQLite["SQLite dev.db\n(Desenvolvimento Rápido Local)"]
    end

    subgraph ExternalLayer["Integrações & Serviços Externos"]
        Sentry["Sentry.io APM & Tracing\n(Observabilidade Client, Server & Edge)"]
        WhatsApp["WhatsApp Web / App API\n(Notificações e Links Diretos)"]
        PixNetwork["Rede Pix / Bancos\n(Chaves Pix & Comprovantes)"]
    end

    PWA --> Actions
    UI_Components --> Actions
    Actions --> FinanceEngine
    Actions --> PlansEngine
    Actions --> SanitizeEngine
    Actions --> AuthRBAC
    Actions --> PrismaORM
    PrismaORM --> DB_Supabase
    PrismaORM --> DB_Postgres
    PrismaORM --> DB_SQLite
    PWA -.-> WhatsApp
    Actions -.-> PixNetwork
    PWA -.-> Sentry
    Actions -.-> Sentry
```

---

## 2. Stack Tecnológica Detalhada

| Camada | Tecnologia | Função Principal |
| :--- | :--- | :--- |
| **Hospedagem & CDN** | **Vercel Serverless Platform** | Deploy contínuo, roteamento Edge global, SSL/TLS gerenciado e alta disponibilidade. |
| **Domínio Próprio & DNS** | **Registro.br (`clubedacota.com.br`)** | Registro oficial de domínio com apontamento de DNS autoritativo e subdomínio `www`. |
| **Framework Fullstack** | **Next.js 14.2 (App Router)** | Renderização híbrida (RSC), roteamento moderno e Server Actions com zero overhead REST. |
| **Biblioteca de UI** | **React 18.3 & TypeScript 5.6** | Interface reativa, tipagem estrita de ponta a ponta e estados locais otimizados. |
| **Estilização & Temas** | **Tailwind CSS 3.4** | Design responsivo mobile-first, animações fluidas e suporte a 6 paletas de temas oficiais. |
| **Ícones do Sistema** | **Lucide React** | Conjunto padronizado de ícones semânticos para toda a aplicação. |
| **Renderização Gráfica** | **HTML5 Canvas 2D API** | Geração e exportação client-side de tabelas e cronogramas em alta resolução (PNG 2x scale). |
| **Camada ORM** | **Prisma ORM 5.22** | Modelagem relacional tipada, migrations automatizadas e transações atômicas seguras. |
| **Bancos de Dados** | **Supabase PostgreSQL 17 / SQLite** | Banco em nuvem com Session Pooler (`aws-0-us-east-1`) em produção e SQLite local dev. |
| **Observabilidade & APM** | **Sentry.io (`@sentry/nextjs` 11)** | Monitoramento de performance, alertas em tempo real de erros no cliente, servidor e Edge. |
| **Segurança & Criptografia** | **Bcrypt.js & Crypto** | Hashing seguro de senhas com salt rounds e tokens criptográficos temporários. |
| **Contêineres & DevOps** | **Docker & Docker Compose** | Build multi-stage standalone (~150MB) e orquestração opcional para ambientes dedicados/on-premise. |
| **Suíte de Testes** | **Node.js Test Runner Nativo** | 15 suítes de teste de integração e unidade sem dependências pesadas de terceiros. |

---

## 3. Diagrama de Camadas da Aplicação

```mermaid
graph TD
    subgraph Apresentacao["1. Camada de Apresentação (UI)"]
        direction TB
        Header["Header Global & Seletor de Contas"]
        Sininho["Sininho de Notificações Inteligente (Inbox Zero)"]
        BottomNav["BottomNav (Navegação PWA Mobile)"]
        PartView["Portal do Participante (Minhas Cotas & Pix)"]
        CriadView["Painel do Criador (Gestão Financeira & Repasse)"]
        Wizard["Criar Consórcio Wizard (5 Passos + Sorteio)"]
        AdminView["Painel Super Admin (Governança & Smart Merge)"]
        SaaSView["Módulo SaaS de Assinaturas (Planos PRO)"]
        Toast["ToastModal (Feedback Flutuante Oficial)"]
    end

    subgraph Logica["2. Camada de Negócios & Server Actions"]
        direction TB
        ActConsorcio["actions.ts: getConsorcioData, criarConsorcio"]
        ActPagamentos["actions.ts: confirmarPagamento, estornarPagamento"]
        ActAdmin["actions.ts: mesclarUsuarios, redefinirSenha, transferirCota"]
        ActAssinaturas["actions.ts: aprovarAssinatura, solicitarUpgrade"]
        LibFin["lib/finance.ts (Cálculos de Bolada, Progressão, Vencimentos)"]
        LibPlans["lib/plans.ts (Limites de Consórcios e Cotas)"]
        LibSanitize["lib/sanitize.ts (Mascaramento de Senhas e Tokens)"]
    end

    subgraph Persistencia["3. Camada de Persistência (ORM & DB)"]
        direction TB
        Prisma["Prisma Client Singleton"]
        TxManager["prisma.$transaction (Atomicidade nas Operações)"]
        Postgres[(PostgreSQL 16 / SQLite)]
    end

    Apresentacao ==> Logica
    Logica ==> Persistencia
```

---

## 4. Diagrama Entidade-Relacionamento (DER)

O banco de dados relacional é estruturado para garantir rastreabilidade contábil, integridade referencial e auditoria total:

```mermaid
erDiagram
    User ||--o{ Consorcio : "cria"
    User ||--o{ CotaParticipante : "possui cotas"
    User ||--o{ Contribuicao : "paga parcelas"
    User ||--o{ Comprovante : "envia comprovantes"
    User ||--o{ AuditoriaLog : "registra acoes"
    User ||--o{ AssinaturaPlano : "solicita assinaturas"

    Consorcio ||--o{ Cota : "composto por"
    Consorcio ||--o{ Contribuicao : "possui fluxo financeiro"
    Consorcio ||--o{ AuditoriaLog : "possui historico"

    Cota ||--o{ CotaParticipante : "distribuida em"
    Cota ||--o{ Contribuicao : "gera parcelas"

    Contribuicao ||--o| Comprovante : "comprovada por"

    User {
        string id PK
        string name
        string email UK
        string telefone
        string passwordHash
        string role "COMUM, PRO, PRO_MASTER, SUPER_ADMIN"
        string preferredTheme
        boolean isActivated
        string tipoChavePix
        string chavePix
        datetime planoExpiraEm
    }

    Consorcio {
        string id PK
        string nome
        string status "ATIVO, ENCERRADO"
        string frequencia "MENSAL, QUINZENAL, SEMANAL"
        string modeloContribuicao "FIXO, ACRESCIMO_MENSAL"
        float valorCota
        float valorTotalBolada
        int totalCotas
        string criadorId FK
    }

    Cota {
        string id PK
        string consorcioId FK
        int numero
        int ordemSorteio
        boolean isCompartilhada
        string status "ATIVA, CONTEMPLADA"
    }

    CotaParticipante {
        string id PK
        string cotaId FK
        string usuarioId FK
        float percentual
        float valorParcela
    }

    Contribuicao {
        string id PK
        string consorcioId FK
        string cotaId FK
        string usuarioId FK
        int numeroCiclo
        float valorPrevisto
        datetime dataVencimento
        string status "PENDENTE, PAGO, EM_ATRASO"
        datetime dataPagamento
    }

    Comprovante {
        string id PK
        string contribuicaoId FK
        string usuarioId FK
        string arquivoUrl
        string status "PENDENTE, CONFIRMADO, RECUSADO"
    }

    AuditoriaLog {
        string id PK
        string consorcioId FK
        string usuarioResponsavelId FK
        string usuarioAfetadoId FK
        string tipoAcao
        string detalhes
        string justificativa
        datetime createdAt
    }

    AssinaturaPlano {
        string id PK
        string usuarioId FK
        string plano "PRO, PRO_MASTER"
        float valor
        string status "PENDENTE, APROVADO, RECUSADO"
        datetime dataInicio
        datetime dataFim
        string aprovadoPorId FK
    }
```

---

## 5. Matriz de Autorização & Níveis de Acesso (RBAC)

O sistema opera com 4 níveis hierárquicos de segurança estrita:

```mermaid
flowchart LR
    subgraph Roles["Níveis de Acesso (RBAC)"]
        direction TB
        R_COMUM["1. COMUM\n(Cotista / Participante)"]
        R_PRO["2. PRO\n(Organizador até 3 grupos)"]
        R_PROMASTER["3. PRO MASTER\n(Organizador Ilimitado)"]
        R_SUPERADMIN["4. SUPER ADMIN\n(Governança Master)"]
    end

    subgraph Capabilities["Permissões Operacionais"]
        direction TB
        P_PARTICIPAR["Acompanhar Minhas Cotas & Enviar Pix"]
        P_CRIAR_1["Criar até 1 Grupo Ativo Simultâneo"]
        P_CRIAR_3["Criar até 3 Grupos Ativos Simultâneos"]
        P_CRIAR_ILIM["Criar Grupos Ilimitados"]
        P_AUDITORIA_CONSORCIO["Auditoria Completa do Grupo"]
        P_ADMIN_USERS["Gestão de Usuários & Senhas"]
        P_SMART_MERGE["Mesclagem Atômica de Contas"]
        P_GESTAO_SAAS["Aprovação de Assinaturas e Planos"]
    end

    R_COMUM --> P_PARTICIPAR
    R_COMUM --> P_CRIAR_1

    R_PRO --> P_PARTICIPAR
    R_PRO --> P_CRIAR_3
    R_PRO --> P_AUDITORIA_CONSORCIO

    R_PROMASTER --> P_PARTICIPAR
    R_PROMASTER --> P_CRIAR_ILIM
    R_PROMASTER --> P_AUDITORIA_CONSORCIO

    R_SUPERADMIN --> P_PARTICIPAR
    R_SUPERADMIN --> P_CRIAR_ILIM
    R_SUPERADMIN --> P_AUDITORIA_CONSORCIO
    R_SUPERADMIN --> P_ADMIN_USERS
    R_SUPERADMIN --> P_SMART_MERGE
    R_SUPERADMIN --> P_GESTAO_SAAS
```

---

## 6. Fluxos Críticos de Negócio

### 6.1. Smart Merge Atômico (Unificação de Contas Duplicadas)
Quando o Super Admin identifica que um participante foi cadastrado duas vezes:

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Super Admin
    participant UI as AdminView
    participant Server as actions.ts (mesclarUsuarios)
    participant DB as Prisma Transaction ($transaction)

    Admin->>UI: Seleciona Conta Oficial e Conta Duplicada
    UI->>Server: mesclarUsuariosAdminAction(principalId, duplicadaId)
    Server->>Server: Valida permissão RBAC e impede auto-exclusão
    Server->>DB: Inicia Transação Atômica ($transaction)
    DB->>DB: Migra Cotas Participantes (soma cotas se coincidir cotaId)
    DB->>DB: Migra Contribuições, Parcelas e Comprovantes
    DB->>DB: Migra Consórcios Criados e Assinaturas
    DB->>DB: Copia Telefone e Chave Pix faltantes para a Principal
    DB->>DB: Exclui a Conta Duplicada fisicamente
    DB->>DB: Grava AuditoriaLog (MESCLAGEM_CONTAS_USUARIO)
    DB-->>Server: Commit com Sucesso
    Server-->>UI: Retorna Sucesso com Total de Registros Migrados
    UI->>UI: Dispara ToastModal Flutuante de Confirmação
```

---

### 6.2. Sorteio de Ordem de Contemplação & Exportação HD
No Passo 4 do Assistente de Criação de Consórcio:

```mermaid
sequenceDiagram
    autonumber
    actor Criador as Organizador do Consórcio
    participant Wizard as Passo 4 do Assistente
    participant Engine as Algoritmo Fisher-Yates
    participant Canvas as exportCronogramaImage.ts
    actor WhatsApp as WhatsApp Cotistas

    Criador->>Wizard: Clica em "Realizar Sorteio Automático"
    Wizard->>Engine: Embaralha posições aleatoriamente
    Engine-->>Wizard: Retorna ordens de 1 a N
    Criador->>Wizard: Ajusta permuta manual se necessário (Swap ▲/▼)
    Criador->>Wizard: Clica em "Exportar Cronograma (WhatsApp)"
    Wizard->>Canvas: Renderiza tabela completa em Canvas 2D (HD 2x)
    Canvas-->>Wizard: Gera PNG oficial com logo e cores do app
    Wizard->>Criador: Download automático e Modal de Pré-visualização
    Criador->>WhatsApp: Compartilha imagem gerada no grupo de participantes
```

---

## 7. Infraestrutura de Deploy & Ambientes

### 7.1. Arquitetura Oficial de Produção (Serverless Cloud & Observabilidade)

A infraestrutura oficial de produção do **Clube da Cota** opera em arquitetura Serverless de alta disponibilidade, com distribuição de borda (Edge Network) e banco de dados gerenciado:

```mermaid
flowchart TD
    subgraph Users["Acesso dos Usuários (Mobile PWA & Web)"]
        UserMobile["Smartphones (PWA Mobile)"]
        UserDesktop["Computadores (Web Desktop)"]
    end

    subgraph DNSLayer["Governança de Domínio & DNS"]
        RegistroBR["Registro.br\n(Domínio: clubedacota.com.br)"]
        DNS_CNAME["Apontamento CNAME www\ncname.vercel-dns.com"]
        DNS_A["Apontamento A Apex\n76.76.21.21"]
    end

    subgraph VercelCloud["Vercel Edge Platform (Produção)"]
        EdgeCDN["Vercel Global Edge Network\n(SSL/TLS Automático Let's Encrypt)"]
        ServerlessApp["Next.js 14 App Router Standalone\n(Server Actions & Server Components)"]
    end

    subgraph SupabaseCloud["Supabase Managed Database (AWS us-east-1)"]
        SessionPooler["Session Pooler PgBouncer\n(Porta 5432 - aws-0-us-east-1.pooler.supabase.com)"]
        Postgres17["PostgreSQL 17 Managed Engine\n(Schema Prisma, SSL Require & Backups)"]
    end

    subgraph ObservabilityLayer["Observabilidade & APM"]
        SentryCloud["Sentry.io Platform\n(Issue Tracking, Tracing Client/Server/Edge)"]
    end

    UserMobile --> RegistroBR
    UserDesktop --> RegistroBR
    RegistroBR --> DNS_CNAME
    RegistroBR --> DNS_A
    DNS_CNAME --> EdgeCDN
    DNS_A --> EdgeCDN
    EdgeCDN --> ServerlessApp
    ServerlessApp <-->|Prisma ORM via TLS| SessionPooler
    SessionPooler --> Postgres17
    ServerlessApp -.->|Logs & Error Ingest| SentryCloud
    UserMobile -.->|Client Errors & Replays| SentryCloud
    UserDesktop -.->|Client Errors & Replays| SentryCloud
```

### 7.2. Ambiente Docker Dedicado / On-Premise (Alternativo)

Para implementações em servidores VPS dedicados (ex: Hetzner, DigitalOcean ou AWS EC2):

```mermaid
flowchart TD
    subgraph DockerContainer["Ambiente Dockerizado (VPS Dedicado)"]
        direction TB
        NextApp["Next.js App Standalone Container\n(Node.js 20 Alpine - Porta 3000)"]
        PostgresContainer["PostgreSQL 16 Alpine Container\n(Porta 5432 - Volume postgres_data)"]
        NextApp <-->|DATABASE_URL interna| PostgresContainer
    end

    subgraph HostServer["Servidor Host / VPS"]
        ReverseProxy["Reverse Proxy (Nginx / Caddy)\n(Certificado SSL Let's Encrypt HTTPS)"]
        ReverseProxy -->|Proxy reverso porta 3000| NextApp
    end

    subgraph OnPremUsers["Acesso dos Usuários"]
        ClientApp["PWA Mobile / Web Desktop"]
        ClientApp --> ReverseProxy
    end
```

---

## 8. Cobertura de Testes Automatizados (17 Suítes - 100% de Sucesso)

O sistema possui uma suíte rigorosa de **17 arquivos de testes automatizados**, cobrindo todas as camadas sem necessidade de servidores externos ativos:

1. `tests/finance.test.mjs`: Validação de parcelas, juros, acréscimos e bolada líquida.
2. `tests/auth.test.mjs`: Autenticação real com hash bcrypt e validação dos 4 papéis.
3. `tests/sanitize.test.mjs`: Trava anti-vazamento de tokens e hashes de senha.
4. `tests/participantes_repasse.test.mjs`: Repasse de cotas com integridade contábil.
5. `tests/planos_upgrade.test.mjs`: Capacidade de consórcios por plano.
6. `tests/assinaturas_gestao.test.mjs`: Ciclo de vida e renovação cumulativa SaaS.
7. `tests/consorcio_ciclo_vida.test.mjs`: Regra de 1 ativo simultâneo e congelamento.
8. `tests/consorcio_vencido_gestao.test.mjs`: Alertas de consórcio vencido e CRM de upgrade.
9. `tests/notifications.test.mjs`: Notificações Inbox Zero e privacidade LGPD.
10. `tests/cadastro_participante_link.test.mjs`: Onboarding via link com criação de senha.
11. `tests/perfil_dados.test.mjs`: Edição de perfil, temas e WhatsApp do organizador.
12. `tests/agenda_vinculo_participante.test.mjs`: Agenda com autocomplete preditivo.
13. `tests/sorteio_ordem_contemplacao.test.mjs`: Fisher-Yates e imutabilidade do Sorteio 1.
14. `tests/export_cronograma_image.test.mjs`: Canvas 2D dinâmico e exportação PNG.
15. `tests/admin_gestao_usuarios.test.mjs`: Smart Merge, senhas amigáveis e governança.
16. `tests/pix_pagamento_participante.test.mjs`: Validação e mascaramento de chave Pix no pagamento do participante.
17. `tests/pagination.test.mjs`: Algoritmo universal de paginação em memória e fatiamento de dados.
