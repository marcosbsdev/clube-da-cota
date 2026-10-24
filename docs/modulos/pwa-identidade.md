---
type: module
title: "Módulo Identidade Visual, PWA & Temas Dinâmicos"
description: "Identidade visual oficial, suporte a PWA instalável no Android/iOS e paletas de cores dinâmicas."
resource: "public/manifest.json"
tags: [pwa, identidade-visual, ui, temas, mobile]
timestamp: 2026-10-24T09:30:00Z
---

# 🎨 Módulo Identidade Visual, PWA & Temas

## Visão Geral
O Clube da Cota adota uma identidade visual moderna inspirada em comunidade e prosperidade compartilhada, com suporte nativo a Progressive Web App (PWA) e adaptação dinâmica a temas de cor escolhidos pelo usuário.

---

## 1. Identidade Visual Oficial
* **Símbolo:** Medalha de ouro central (a bolada) rodeada por 5 amigos em círculo (representando comunidade e confiança).
* **Cor do Tema Oficial (theme-color):** `#044E3A` (Verde Floresta Nobre).
* **Fundo:** `#FFFFFF`.
* **Arquivo Vetorial:** [`public/icon-comunidade.svg`](file:///C:/Users/tctat/.gemini/antigravity/scratch/clube-da-cota/public/icon-comunidade.svg).

---

## 2. Progressive Web App (PWA)
O aplicativo conta com configuração completa para ser instalado na tela inicial do celular como um aplicativo nativo:
* **Manifest (`public/manifest.json`):**
  * `name`: Clube da Cota
  * `short_name`: Clube da Cota
  * `display`: `standalone`
  * `orientation`: `portrait`
  * `theme_color`: `#044E3A`
  * Ícones em 192x192 e 512x512 (`any` e `maskable` para Android).
* **iOS Safari:** Metatags `apple-mobile-web-app-capable` e `apple-touch-icon.png` (180x180).
* **Favicons:** `favicon.ico`, `favicon-32x32.png` e `favicon-16x16.png`.

---

## 3. Tela de Carregamento Animada (`src/components/AppLogo.tsx`)
Durante o carregamento inicial da aplicação ou troca de consórcio:
* O logo oficial do Clube da Cota executa uma animação de **respiração suave** (`logo-breathe`).
* Um anel rotativo na cor oficial (`#044E3A`) envolve o emblema com indicador de halo pulsante.
* Três pontos animados (`logo-dot`) indicam progresso contínuo.
* Respeito integral à preferência de acessibilidade `prefers-reduced-motion`.

---

## 4. Harmonização Total com Temas Dinâmicos
O usuário pode alterar sua paleta favorita na tela de Perfil (Azul Royal, Grafite Escuro, Roxo Moderno, Azul Oceano e Coral).
* Todas as telas e componentes usam variáveis CSS padronizadas:
  * `bg-theme-main` / `text-theme-main`
  * `bg-theme-light`
  * `text-theme-text`
  * `bg-theme-dark`
* Nenhuma cor estática (como verde-esmeralda avulso ou roxo fixo) interfere na paleta escolhida pelo usuário.
