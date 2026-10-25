# 017 - Exportação do Cronograma Completo em Imagem de Alta Definição para WhatsApp

## Contexto
Após a definição da ordem de contemplação (seja por Sorteio Oficial 🎲 ou por Acordo do Grupo ✍️), o criador do consórcio precisa comunicar de forma clara, confiável e transparente aos participantes como ficou a ordem oficial em que cada um receberá a bolada.

O envio de tabelas em texto simples no WhatsApp costuma ficar desformatado em telas de celulares diferentes. Por outro lado, o envio de uma **imagem estilizada, moderna e com a marca do Clube da Cota** transmite profissionalismo, garante legibilidade universal e serve como excelente divulgação da plataforma.

---

## Decisão Arquitetural
Desenvolveu-se um gerador nativo em Canvas 2D (`src/lib/exportCronogramaImage.ts`) e controles de exportação na Etapa 5 (Revisão e Ativação) do assistente de criação (`CriarConsorcioWizard.tsx`).

### 1. Renderização em Alta Definição (Canvas 2D):
- **Largura padrão:** 1080px (largura ideal para compartilhamento em redes sociais e visualização em smartphones).
- **Altura dinâmica:** Calculada automaticamente a partir da quantidade de ciclos (`330px header + 52px table header + (N * 56px) + 130px footer`).
- **Design & Propaganda da Marca:**
  - **Header Superior (Deep Navy `#08101E` a `#162846`):**
    - Logo oficial do Clube da Cota com cantos arredondados (`/icon-192x192.png`).
    - Tipografia de alto impacto: `CLUBE DA COTA • CONTROLE INTELIGENTE DE CONSÓRCIOS`.
    - Selo auditado: `✓ ORDEM OFICIAL DO SORTEIO`.
    - Nome do consórcio e subtítulo com contagem de ciclos.
    - 4 Cards de Métricas: Valor da Cota, Bolada Total, Duração e Chave Pix.
  - **Tabela Completa de Ciclos:**
    - Cabeçalho escuro contrastante (`#0F172A`).
    - Destaque em verde esmeralda no Ciclo 1 (`Início`).
    - Destaque em azul no Último Ciclo (`Fim 🏁`).
    - Linhas zebradas suaves (`#FFFFFF` e `#F8FAFC`) com separadores limpos.
    - Exibição de: Ciclo, Data de Vencimento, Nome do Contemplado e Valor da Bolada.
  - **Rodapé Institucional:**
    - Linha divisória verde esmeralda (`#10B981`).
    - Assinatura: `Clube da Cota • Plataforma de Gestão de Consórcios entre Amigos`.
    - Link oficial: `www.clubedacota.com.br`.
    - Carimbo de auditoria com data e hora exatas da emissão.

### 2. Integração com o WhatsApp & Download Direto:
- **Compartilhar no WhatsApp:**
  - Tenta primeiro o envio direto do arquivo via **Web Share API** (`navigator.share({ files: [file] })`), que em dispositivos móveis abre diretamente o WhatsApp com a imagem anexada.
  - Caso o navegador não suporte compartilhamento de arquivos via Web Share (ex: navegadores desktop), executa o fallback transparente: faz o download automático da imagem `.png` em alta definição e abre o WhatsApp com a mensagem de apresentação pronta.
- **Baixar Imagem PNG:**
  - Download imediato da imagem com nome amigável e sanitizado (`cronograma-[nome-do-consorcio].png`).

---

## Consequências
- **Positivas:**
  - Os participantes recebem um cronograma visual, confiável e com design refinado.
  - Fortalecimento da marca Clube da Cota através da logo e links incorporados na imagem.
  - Totalmente testado com suíte dedicada em `tests/export_cronograma_image.test.mjs`, totalizando **90 testes em 14 suítes com 100% de sucesso**.
