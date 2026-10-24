---
type: adr
title: "ADR 004: Pix Direto vs. Centralizado, Bolada Líquida e Chave Pix Obrigatória"
status: "Aceito"
date: 2026-10-24
tags: [pix, consorcio, bolada, regras-de-negocio, perfil, financeiro]
---

# ADR 004: Pix Direto vs. Centralizado, Bolada Líquida e Chave Pix Obrigatória

## Contexto
Em consórcios entre amigos e conhecidos, quando um membro é contemplado no mês, frequentemente ele próprio não transfere sua mensalidade para outrem, retendo sua quota diretamente no bolso. Nesse caso:
1. O valor arrecadado dos demais participantes corresponde à "bolada líquida" `(totalCotas - 1) * valorCotaNoCiclo`.
2. Se o participante possuir cadastro ativo na plataforma e optar por receber o Pix diretamente em sua conta bancária (`receberPixDireto = true`), as transferências são direcionadas para sua chave Pix pessoal, evitando passar pela conta do organizador.
3. Se o participante optar por não receber direto ou ainda não tiver completado seu cadastro, a arrecadação ocorre de forma centralizada pelo consórcio, onde todos pagam e a bolada é 100% bruta (`totalCotas * valorCotaNoCiclo`).
4. Adicionalmente, era necessário tornar a chave Pix do consórcio de preenchimento obrigatório e suportar explicitamente a seleção dos 4 tipos oficiais de chaves: `Celular`, `CPF/CNPJ`, `E-mail` e `Chave Aleatória`.

## Decisão
1. **Schema Prisma:**
   * `Consorcio.tipoChavePix`: String com valor padrão `"CHAVE_ALEATORIA"`.
   * `User.receberPixDireto`: Booleano com valor padrão `false`.
   * `User.tipoChavePix`: String opcional para o tipo da chave Pix pessoal.
   * `User.chavePix`: String opcional contendo a chave Pix pessoal.

2. **Cálculo da Bolada (`calcularBoladaCiclo`):**
   * Se `temPixDireto = true`: `boladaLiquida = (totalCotas - 1) * valorCotaNoCiclo` e `cotaPropriaRetida = valorCotaNoCiclo`.
   * Se `temPixDireto = false`: `boladaLiquida = boladaTotal = totalCotas * valorCotaNoCiclo` e `cotaPropriaRetida = 0`.

3. **Apresentação Condicional da Chave Pix:**
   * No ciclo correspondente à cota contemplada:
     * Se o contemplado tiver cadastro ativo (`isActivated`), `receberPixDireto = true` e chave Pix preenchida: os demais participantes visualizam a chave Pix pessoal do contemplado na tela de pagamento.
     * Caso o usuário logado seja o próprio contemplado desse ciclo com Pix direto ativo, ele visualiza uma mensagem celebrativa informando que sua cota foi retida e que ele receberá os pagamentos dos demais membros.
     * Caso contrário (sem Pix direto ou sem cadastro), a tela exibe a chave Pix oficial do organizador do consórcio.

4. **Obrigatoriedade e Tipos de Chave:**
   * No cadastro (`CriarConsorcioWizard`) e na edição (`CriadorView`), o campo de chave Pix do consórcio é estritamente obrigatório.
   * O seletor oferece as opções oficiais: `Celular`, `CPF/CNPJ`, `E-mail` e `Chave Aleatória`.

## Consequências
* Transparência total sobre pagamentos diretos vs. centralizados.
* Sem atrito para participantes que preferem não transacionar por conta de terceiros.
* 100% de compatibilidade com os dados e testes existentes (12 testes de finanças e todos os testes de permissão/edição passando).
