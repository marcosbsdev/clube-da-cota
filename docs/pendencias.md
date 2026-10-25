---
type: backlog
title: "Pendências Técnicas & Checklist de Produção"
description: "Relação consolidada de débitos técnicos, plano de hardening de segurança e checklist para publicação comercial."
tags: [backlog, seguranca, producao, checklist, roadmap]
timestamp: 2026-10-24T21:15:00Z
---

# 📋 Pendências & Checklist para Produção Comercial

Este documento consolida o diagnóstico de maturidade do **Clube da Cota**, seus débitos técnicos conhecidos e o checklist obrigatório para colocar a plataforma no ar com usuários reais.

---

## 📊 Matriz de Prontidão Atual (~88% Concluído)

- **Regras de Negócio e Cálculos Financeiros:** 100% Concluído (Fixo, Variável e Progressivo).
- **Interface do Usuário (Mobile-First / PWA):** 95% Concluído (Tailwind CSS, design system em Verde Floresta `#044E3A`).
- **Suíte de Testes Automatizados:** 100% Concluído (73 testes passando em 11 suítes).
- **Infraestrutura Docker & Multi-DB:** 100% Concluído (PostgreSQL 16 Alpine + SQLite backup + script switcher).
- **Hardening de Segurança & Serviços Reais:** ~75% Concluído (demanda fechamento das portas de desenvolvimento).

---

## 🔒 1. Alta Prioridade: Segurança & Hardening para Produção

Estes itens devem ser implementados **antes** de aceitar cadastros de usuários reais e movimentação financeira externa.

| Item | Situação Atual | O que deve ser feito | Esforço Estimado |
|---|---|---|:---:|
| **Assinatura Criptográfica da Sessão** | Cookie `clube_cota_session` guarda o ID do usuário em texto puro. | Implementar assinatura digital HMAC-SHA256 ou JWT assinado com segredo `SESSION_SECRET` no `.env`. | Baixo |
| **Autorização de Identidade no Servidor** | Server actions recebem `currentUserId` ou `criadorId` enviado pelo cliente. | Extrair a identidade do usuário autenticado diretamente da sessão assinada no servidor (`await getSessionUser()`), ignorando IDs forjados pelo cliente. | Médio |
| **Desativação do Modo Demonstração em Produção** | Tela de login exibe seletor de usuários de teste e possui a action `quickLoginAction` (login com 1 clique). | Condicionar o seletor e a action a `process.env.NODE_ENV !== "production"`. Em produção, exigir estritamente e-mail/telefone e senha real. | Baixo |
| **Proteção contra Enumeração de E-mails** | Recuperação de senha expõe se o e-mail existe no banco. | Padronizar resposta genérica: *"Se este e-mail estiver cadastrado, as instruções foram enviadas"*. | Baixo |

---

## 📦 2. Média Prioridade: Serviços Externos & Armazenamento Real

| Item | Situação Atual | O que deve ser feito | Esforço Estimado |
|---|---|---|:---:|
| **Armazenamento Real de Comprovantes (Object Storage)** | Upload de comprovantes salva apenas o nome e metadados no banco, simulando o arquivo físico em `/uploads/`. | Integrar armazenamento real de arquivos: volume persistente Docker local **OU** bucket compatível com S3 (ex: Cloudflare R2 - gratuito até 10 GB/mês, Supabase Storage ou AWS S3). | Médio |
| **Envio Transacional de E-mails** | Token de recuperação de senha é retornado diretamente na resposta da tela para agilidade em testes locais. | Integrar serviço transacional de e-mails (ex: Resend - gratuito até 3.000 envios/mês, Brevo ou SendGrid) para envio de links de redefinição. | Médio |

---

## 🚀 3. Baixa Prioridade: Otimizações & Pós-Lançamento

| Item | Situação Atual | O que deve ser feito | Esforço Estimado |
|---|---|---|:---:|
| **Service Worker PWA Offline (`sw.js`)** | Manifesto web já configurado (`manifest.json` com ícones e display standalone). | Registrar service worker nativo para cache de assets estáticos e prompt nativo "Instalar aplicativo" no celular. | Baixo |
| **Gateway Automático Pix** | Upgrade de planos SaaS é manual via Pix direto para Marcos Batista com envio de comprovante. | Após validação comercial (+50 clientes), plugar webhook de conciliação automática via API Pix (Mercado Pago, Asaas ou EFI). | Médio |
| **Limpeza Automática de Auditoria Antiga** | Logs de auditoria crescem indefinidamente na tabela `AuditoriaLog`. | Criar rotina periódica de arquivamento para eventos operacionais com mais de 2 anos. | Baixo |

---

## ✅ 4. Itens Já Concluídos & Arquivados

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
