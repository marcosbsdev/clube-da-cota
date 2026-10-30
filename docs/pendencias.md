---
type: backlog
title: "Pendências Técnicas & Checklist de Produção"
description: "Relação consolidada de débitos técnicos, plano de hardening de segurança e checklist para publicação comercial."
tags: [backlog, seguranca, producao, checklist, roadmap]
timestamp: 2026-10-29T22:35:00Z
---

# 📋 Pendências & Checklist para Produção Comercial

Este documento consolida o diagnóstico de maturidade do **Clube da Cota**, seus débitos técnicos conhecidos e o checklist obrigatório para colocar a plataforma no ar com usuários reais.

---

## 📊 Matriz de Prontidão Atual (100% Produção Ativa)

- **Regras de Negócio e Cálculos Financeiros:** 100% Concluído (Fixo, Variável e Progressivo).
- **Interface do Usuário (Mobile-First / PWA):** 100% Concluído (Tailwind CSS, design system em Verde Floresta `#044E3A`, paletas dinâmicas e menu profissional de usuário).
- **Suíte de Testes Automatizados:** 100% Concluído (15 suítes de teste cobrindo todas as regras de negócio).
- **Hardening de Segurança & PRD:** 100% Concluído (login autêntico, remoção de contas de teste e 1-clique, isolamento de sessão e sanitização).
- **Infraestrutura em Nuvem (Produção Oficial):** 100% Concluído (Vercel Serverless + Supabase PostgreSQL 17 + Domínio Registro.br `https://www.clubedacota.com.br`).
- **Observabilidade & APM:** 100% Concluído (Sentry.io integrado com client, server e edge tracing).
- **Consórcio Real Ativo:** 100% Concluído (Importação contábil e histórica do consórcio "Amigos Pau D'Arco 2026").

---

## 🔒 1. Segurança & Hardening para Produção (100% Concluído)

Estes itens foram plenamente implementados e validados no ambiente oficial de produção:

| Item | Situação Atual | Status |
|---|---|:---:|
| **Desativação do Modo Demonstração em Produção** | Remoção definitiva do botão de acesso rápido de 1-clique e do alternador arbitrário de contas no Header ([ADR 020](./decisoes/020-hardening-producao-remocao-demo-acesso-rapido.md)). Login restrito a credenciais reais com hash Bcrypt. | **Concluído** ✅ |
| **Menu Profissional de Usuário** | Header SaaS com avatar, iniciais, nome, e-mail/telefone, link de perfil, acesso Super Admin restrito por role e ação de Logout autêntica. | **Concluído** ✅ |
| **Sanitização de Dados Sensíveis** | Mascaramento estrito de senhas, hashes Bcrypt e tokens de acesso em todas as Server Actions (`src/lib/sanitize.ts` e [ADR 003](./decisoes/003-sanitizacao-dados-sensiveis.md)). | **Concluído** ✅ |
| **Controle de Acesso RBAC** | Verificação de permissões em todas as mutações e trilha de auditoria restrita a Pro Master e Super Admin. | **Concluído** ✅ |

---

## 📦 2. Roadmap Pós-Lançamento: Serviços Externos & Armazenamento em Nuvem

| Item | Situação Atual | O que pode ser feito no futuro | Esforço Estimado |
|---|---|---|:---:|
| **Armazenamento de Comprovantes em Object Storage (S3 / R2)** | Upload de comprovantes Pix salva metadados no banco e visualização base64/local. | Integrar bucket S3 compatível (Cloudflare R2 ou Supabase Storage) quando o volume de comprovantes ultrapassar 1.000 envios/mês. | Médio |
| **Envio Transacional de E-mails (Resend / Brevo)** | Notificações via WhatsApp direto e senhas provisórias amigáveis geradas no painel do administrador. | Integrar API de envio de e-mails transacionais (ex: Resend) para envio de faturas e notificações automatizadas. | Médio |
| **Gateway Automático Pix** | Upgrade de planos SaaS é realizado via Pix direto para Marcos Batista com envio de comprovante e aprovação administrativa. | Plugar webhook de conciliação automática via API Pix (Mercado Pago, Asaas ou EFI) após escala de mais de 50 clientes pagantes simultâneos. | Médio |
| **Limpeza Automática de Auditoria Antiga** | Logs de auditoria crescem de forma segura na tabela `AuditoriaLog`. | Criar rotina periódica de arquivamento para eventos operacionais com mais de 2 anos. | Baixo |

---

## ✅ 3. Itens Já Concluídos & Arquivados

- [x] **Redesign Completo dos Cards de Ciclos e Consórcio:** Linha única com visual espaçoso e Mês/Ano ([ADR 001](./decisoes/001-redesign-cards-e-ciclos.md)).
- [x] **Sub-Abas de Gestão & Trilha de Auditoria RBAC:** Isolamento para Pro Master e Super Admin ([ADR 002](./decisoes/002-sub-abas-gestao-e-auditoria-rbac.md)).
- [x] **Sanitização de Dados Sensíveis:** Mascaramento de hashes e tokens na entrega para o navegador ([ADR 003](./decisoes/003-sanitizacao-dados-sensiveis.md)).
- [x] **Pix Direto vs. Centralizado & Bolada Líquida:** Retenção da parcela no bolso do contemplado e chave Pix obrigatória ([ADR 004](./decisoes/004-pix-direto-vs-centralizado-e-chave-pix-obrigatoria.md)).
- [x] **Notificações Flutuantes (ToastModal):** Substituição de banners fixos por feedback visual moderno ([ADR 005](./decisoes/005-toast-modal-notificacoes-flutuantes.md)).
- [x] **Edição Cadastral & Repasse de Cotas:** Transferência de titularidade com histórico financeiro preservado ([ADR 006](./decisoes/006-edicao-e-substituicao-de-participantes.md)).
- [x] **Limites de Capacidade por Plano:** Matriz de planos Comum, Pro e Pro Master ([ADR 007](./decisoes/007-limites-de-planos-e-upgrade-pix.md)).
- [x] **Módulo de Assinaturas SaaS:** Controle de vigência em dias, renovação cumulativa e painel do Super Admin ([ADR 008](./decisoes/008-modulo-gestao-assinaturas-saas.md)).
- [x] **Modelo A (1 Consórcio Ativo Simultâneo) & Trava Anti-Exclusão:** Consórcios encerrados em somente-leitura e proteção de dados com histórico ([ADR 009](./decisoes/009-modelo-a-um-ativo-simultaneo-e-ciclo-vida-consorcio.md)).
- [x] **Radar CRM de Consórcios Concluídos:** Alerta proativo e follow-up via WhatsApp ([ADR 010](./decisoes/010-aviso-ciclo-concluido-e-crm-upgrade-admin.md)).
- [x] **Ambiente Docker Multiplataforma & Suporte Nativo a PostgreSQL:** Suporte duplo PostgreSQL 16 Alpine e SQLite local com comutador automático ([ADR 011](./decisoes/011-arquitetura-docker-multiplataforma-e-postgresql.md)).
- [x] **Humanização Completa de Notificações e Auditoria:** Eliminação definitiva de JSON bruto e apresentação temática amigável ([ADR 012](./decisoes/012-humanizacao-notificacoes-e-auditoria-sem-json-bruto.md)).
- [x] **Cadastro e Vinculação de Conta via Link de Participante:** Onboarding fluido com criação de senha, unificação de contas e gestão de chave Pix ([ADR 013](./decisoes/013-cadastro-e-vinculacao-via-link-participante.md)).
- [x] **Edição Cadastral de Perfil & WhatsApp Direto do Organizador:** Gestão de Nome, WhatsApp, alteração de senha e abertura direta da conversa com organizador no portal do participante ([ADR 014](./decisoes/014-edicao-perfil-e-whatsapp-direto-organizador.md)).
- [x] **Agenda do Criador & Vínculo Inteligente de Participantes:** Memória de cotistas com ordenação por frequência e autocomplete preditivo no Passo 2 ([ADR 015](./decisoes/015-agenda-do-criador-autocomplete-e-vinculo-de-participantes.md)).
- [x] **Sorteio Aleatório & Ordem Manual de Contemplação:** Algoritmo Fisher-Yates com execução única no Sorteio 1, permuta manual e congelamento seguro ([ADR 016](./decisoes/016-sorteio-aleatorio-e-definicao-manual-ordem-contemplacao.md)).
- [x] **Exportação de Imagem do Cronograma Completo:** Geração e compartilhamento de imagem PNG HD via Canvas client-side para WhatsApp ([ADR 017](./decisoes/017-exportacao-imagem-cronograma-sorteio-whatsapp.md)).
- [x] **Painel Super Admin de Gestão de Contas, Senhas e Governança:** Central administrativa para edição cadastral, senhas provisórias amigáveis (`Cota#XXXX`), link de WhatsApp, Smart Merge atômico de contas duplicadas, transferência de cotas, visualização de "De ➔ Para" nas notificações e proibição estrita de banners estáticos ([ADR 018](./decisoes/018-painel-super-admin-gestao-contas-e-usuarios.md)).
- [x] **Paletas Oficiais de Tema, Validação de Chave Pix & Paginação Universal:** Grade 3x2 de paletas de cores, validação matemática com algoritmo Módulo 11 para Chave Pix, busca reativa e paginação para alta densidade ([ADR 019](./decisoes/019-temas-oficiais-perfil-pix-e-usabilidade-admin.md)).
- [x] **Hardening de Produção (PRD) & Menu Profissional de Usuário:** Remoção de login de 1-clique e contas de teste, menu de usuário SaaS com avatar e logout autêntico ([ADR 020](./decisoes/020-hardening-producao-remocao-demo-acesso-rapido.md)).
- [x] **Implantação Oficial em Produção com Domínio Próprio:** Deploy na Vercel com DNS apontado no Registro.br para `https://www.clubedacota.com.br` com SSL/TLS ativo ([Guia Vercel & Supabase](./guias/supabase-deploy.md)).
- [x] **Banco de Dados em Nuvem Gerenciado:** Supabase PostgreSQL 17 com Session Pooler e migrações Prisma aplicadas com sucesso ([Guia Supabase Deploy](./guias/supabase-deploy.md)).
- [x] **Observabilidade e APM em Tempo Real:** Sentry.io configurado para Client, Server e Edge Tracing com diagnóstico ativo de erros ([Guia Sentry Config](./guias/sentry-config.md)).
- [x] **Importação Contábil e Histórica do Consórcio Real:** Consórcio "Amigos Pau D'Arco 2026" (10 cotas, 8 membros, Ciclos 1 a 9 quitados e Ciclo 10 em aberto).
