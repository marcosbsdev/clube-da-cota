# 🛡️ Guia de Monitoramento e Observabilidade com Sentry.io

Este guia documenta a integração do **Sentry** no **Clube da Cota** para rastreamento de erros em tempo real (Error Tracking), monitoramento de performance (APM) e gravação de sessões (Session Replay).

---

## 1. Arquitetura da Integração

- **Pacote:** `@sentry/nextjs`
- **Configuração no Cliente:** `sentry.client.config.ts` (captura erros de interface e Session Replay com mascaramento de dados sensíveis).
- **Configuração no Servidor:** `sentry.server.config.ts` (captura erros de Server Actions, Prisma e transações).
- **Configuração em Edge:** `sentry.edge.config.ts` (para middlewares e rotas edge).
- **Build Wrapper:** `next.config.mjs` com `withSentryConfig`.

---

## 2. Como Obter a DSN no Sentry.io

1. Crie uma conta gratuita em **[sentry.io/signup](https://sentry.io/signup/)** (ou faça login com GitHub).
2. Clique em **"Create Project"**.
3. Selecione a plataforma: **Next.js**.
4. Defina o nome do projeto (ex: `clube-da-cota`).
5. Copie a chave **DSN** gerada (exemplo: `https://xxxx@xxxx.ingest.us.sentry.io/xxxx`).

---

## 3. Configurar as Variáveis na Vercel

No painel do projeto na **Vercel** (**Settings ➔ Environment Variables**), adicione:

| Variável | Valor |
| :--- | :--- |
| `NEXT_PUBLIC_SENTRY_DSN` | A DSN copiada do seu projeto Sentry |
| `SENTRY_DSN` | A mesma DSN copiada do seu projeto Sentry |

---

## 4. Teste em Produção

Após adicionar as variáveis e fazer o deploy:
1. Qualquer erro inesperado disparará um alerta instantâneo por e-mail com a linha exata do código e o dispositivo do usuário.
2. A tela do usuário nunca expõe detalhes sensíveis do servidor, mantendo a experiência limpa e segura.
