---
type: adr
title: "ADR 005: Notificações Flutuantes (ToastModal) em Substituição a Banners Fixos"
status: "Aceito"
date: 2026-10-24
tags: [ux, notificacoes, toast, modal, feedback-visual, mobile]
---

# ADR 005: Notificações Flutuantes (ToastModal) em Substituição a Banners Fixos

## Contexto
Anteriormente, ao realizar ações como atualização de dados de um consórcio, troca de posições de cotas, confirmação ou estorno de mensalidades, salvamento de preferências Pix ou envio de comprovantes, o sistema exibia banners estáticos inline (ex: `✓ Informações do consórcio atualizadas com sucesso!`) inseridos diretamente no fluxo do layout do documento.

Esse comportamento apresentava os seguintes problemas de experiência do usuário (UX):
1. **Layout Shift Jarring:** O banner inline empurrava o conteúdo da página para baixo ao ser renderizado e puxava de volta ao expirar, causando tremor visual incômodo.
2. **Baixa Visibilidade ao Rolar:** Se o usuário estivesse rolando um formulário ou modal, o banner no topo da página não ficava visível imediatamente.
3. **Falta de Padronização:** Telas distintas implementavam estilos e temporizadores diferentes para mensagens de sucesso ou erro.

## Decisão
Foi criado o componente padronizado `ToastModal` (`src/components/ToastModal.tsx`) e adotado em todas as telas principais (`CriadorView`, `PerfilView`, `ParticipanteView` e na tela pública de participante `[token]/page.tsx`).

### Características do `ToastModal`:
1. **Posicionamento Flutuante Elevado:** Renderizado com `fixed top-20 left-4 right-4 sm:left-auto sm:right-8 z-[110]`, garantindo que fique sempre visível sem alterar a estrutura ou rolagem da página.
2. **Tipagem Semântica Visual:** Suporta `success`, `error`, `warning` e `info`, com ícones do Lucide (`CheckCircle2`, `AlertCircle`, `AlertTriangle`, `Info`), borda colorida e badge identificador.
3. **Auto-Dismiss Inteligente & Fechamento Manual:** Desaparece suavemente após 4 segundos (`duracaoMs`), contando também com botão explícito de fechamento (`✕`).
4. **Animações Fluidas:** Utiliza Tailwind CSS com `animate-in slide-in-from-top-3 fade-in duration-200`.
5. **Acessibilidade:** Equipado com atributos ARIA `role="alert"` e `aria-live="polite"`.

## Consequências
* Layout 100% estável sem saltos verticais.
* Feedback claro, moderno e consistente para qualquer operação realizada pelo usuário.
* Código mais limpo e componentizado nas views.

---

## 🚨 Adendo de Governança: Obrigatoriedade de Feedback Visual e Revalidação Silenciosa

1. **Obrigatoriedade Estrita de Mensagem de Sucesso:**
   Toda e qualquer alteração de dados no sistema (cadastrais, preferências Pix, parcelas, comprovantes, trocas ou configurações) **DEVE, SEM EXCEÇÃO, emitir notificação visual de sucesso** confirmando a conclusão da operação ao usuário.
2. **Prevenção de Desmontagem de Componentes (`silent = true`):**
   Ao recarregar dados do servidor após uma mutação (`carregarDados`), a chamada DEVE sempre passar a flag de atualização silenciosa (`silent = true`). Isso evita a ativação de spinners ou telas de loading globais que destruam a árvore de componentes DOM e apaguem o `ToastModal` antes do tempo estipulado de leitura.
