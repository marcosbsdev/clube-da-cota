---
type: adr
title: "ADR 021 - Renderização de Modais via React Portal (document.body) e Correção de Stacking Context"
status: "accepted"
date: "2026-10-30"
author: "Equipe de Engenharia Clube da Cota"
tags: [ui, modais, react-portal, stacking-context, css, backdrop]
---

# ADR 021 - Renderização de Modais via React Portal (`document.body`) e Correção de Stacking Context

## 1. Contexto e Problema

Ao abrir os modais de administração (ex: *Editar Cadastro do Usuário*, *Gerenciamento de Senha*, *Smart Merge*, *Raio-X* e *Exclusão de Conta*) a partir de componentes aninhados na árvore DOM (como em `AdminView`), observou-se uma anomalia visual no escurecimento da tela (*backdrop* / overlay):

1. **Corte Horizontal no Header:** A sombra escura (`bg-slate-900/60`) cortava o Header pela metade horizontalmente. A porção superior do Header permanecia no azul claro original (`#1d4ed8`), enquanto a inferior escurecia (`#152d6f`), gerando uma divisão visual nítida e antiestética.
2. **Causa Raiz no CSS (Containing Block & Stacking Context):**
   - O componente `AdminView` continha classes utilitárias como `relative` e `animate-in fade-in` dentro de um container com padding vertical (`py-4`).
   - Pela especificação do W3C / CSS 2.1 e CSS Transforms/Animations, elementos com animação ativa ou certas propriedades de layout podem atuar como **containing block** para elementos `position: fixed`.
   - Como consequência, `position: fixed; inset: 0` calculava suas coordenadas a partir do topo do container ou do offset rolado da página, e não a partir do `top: 0` absoluto da *viewport* do navegador.
   - Além disso, os modais utilizavam `z-50`, empatando com *dropdowns* e colidindo com o Header sticky (`z-40`), além da ausência de trava no scroll do `body`.

## 2. Decisão Tomada

Adotou-se o padrão oficial da indústria para gerenciamento de camadas de diálogo no React:

1. **Renderização via React Portal (`createPortal`):**
   - Todos os modais de `AdminView` agora são montados diretamente no final de `document.body` via `createPortal(..., document.body)`.
   - Adicionada verificação de hidratação do cliente (`isMounted` e `typeof document !== "undefined"`) para prevenir erros de SSR (*Server-Side Rendering*).
2. **Camada de Z-Index Superior e Consistente:**
   - Elevado o z-index dos modais para `z-[120]`, cobrindo com folga o Header (`z-40`), BottomNav (`z-40`) e *dropdowns* (`z-50`).
3. **Backdrop e Usabilidade Mobile/Desktop:**
   - Padronizado o estilo do overlay para `fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto`.
   - Inclusão de `my-auto` no container interno para centralização perfeita e garantia de rolagem caso a tela tenha pouca altura ou zoom ampliado.
4. **Trava de Scroll do Body (*Scroll Locking*):**
   - Efeito (`useEffect`) que aplica `document.body.style.overflow = "hidden"` enquanto qualquer modal estiver aberto, restaurando o estilo original ao fechar, evitando que a página de fundo role por engano.

## 3. Consequências e Benefícios

- **Experiência Visual Perfeita:** O escurecimento do backdrop agora cobre 100% da viewport, do topo extremo ao rodapé, escurecendo uniformemente o Header e a página sem nenhum corte.
- **Isolamento Total de Layout:** Propriedades dos containers pais (como `py-4`, `animate-in`, `relative`, `transform`) nunca mais afetarão a geometria dos modais.
- **Acessibilidade e Foco:** O cotista ou administrador mantém o foco visual exclusivo na janela do modal, sem desvios de layout.
