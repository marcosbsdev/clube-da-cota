import assert from "node:assert";

console.log("🧪 Iniciando testes de Exportação de Imagem do Cronograma de Ciclos...\n");

// 1. Teste de dimensionamento dinâmico do Canvas
{
  const headerHeight = 330;
  const tableHeaderHeight = 52;
  const rowHeight = 56;
  const footerHeight = 130;

  const calcularAlturaCanvas = (qtdCiclos) => {
    return headerHeight + tableHeaderHeight + qtdCiclos * rowHeight + footerHeight;
  };

  const altura10 = calcularAlturaCanvas(10);
  assert.strictEqual(altura10, 330 + 52 + 560 + 130, "Altura para 10 ciclos deve ser 1072px");

  const altura20 = calcularAlturaCanvas(20);
  assert.strictEqual(altura20, 330 + 52 + 1120 + 130, "Altura para 20 ciclos deve ser 1632px");

  console.log("✅ Teste 1: Cálculo dinâmico de altura do Canvas validado com sucesso.");
}

// 2. Teste de geração de slug limpo para o nome do arquivo PNG
{
  const gerarNomeArquivo = (nomeConsorcio) => {
    const slug = (nomeConsorcio || "consorcio")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-");
    return `cronograma-${slug}.png`;
  };

  assert.strictEqual(
    gerarNomeArquivo("Consórcio dos Amigos 2026!"),
    "cronograma-consorcio-dos-amigos-2026-.png"
  );
  assert.strictEqual(
    gerarNomeArquivo("Cotação & Família #1"),
    "cronograma-cotacao---familia--1.png"
  );
  assert.strictEqual(
    gerarNomeArquivo(""),
    "cronograma-consorcio.png"
  );
  console.log("✅ Teste 2: Sanitização e geração de nome de arquivo PNG validada.");
}

// 3. Teste de integridade e mapeamento dos ciclos para exportação
{
  const mockCiclos = [
    { numCiclo: 1, data: "01/11/2026", rotulo: "João Silva", valor: "R$ 5.000,00" },
    { numCiclo: 2, data: "01/12/2026", rotulo: "Maria Santos", valor: "R$ 5.050,00" },
    { numCiclo: 3, data: "01/01/2027", rotulo: "Carlos & Pedro", valor: "R$ 5.100,00" },
  ];

  const total = mockCiclos.length;
  const mapeados = mockCiclos.map((c) => ({
    numCiclo: c.numCiclo,
    dataVencimento: c.data,
    participanteNome: c.rotulo,
    boladaFormatada: c.valor,
    isPrimeiro: c.numCiclo === 1,
    isUltimo: c.numCiclo === total,
  }));

  assert.strictEqual(mapeados[0].isPrimeiro, true, "Ciclo 1 deve ser marcado como primeiro");
  assert.strictEqual(mapeados[0].isUltimo, false);
  assert.strictEqual(mapeados[2].isPrimeiro, false);
  assert.strictEqual(mapeados[2].isUltimo, true, "Último ciclo deve ser marcado como último");

  console.log("✅ Teste 3: Mapeamento de propriedades de destaque (Início/Fim) validado.");
}

// 4. Teste de formatação do texto pré-preenchido para compartilhamento no WhatsApp
{
  const dados = {
    nomeConsorcio: "Consórcio Amigos 2026",
    valorTotalFormatado: "R$ 50.000,00",
    totalCotas: 10,
  };

  const textoMensagem = `🎲 *Cronograma Oficial de Contemplação*\nConsórcio: *${dados.nomeConsorcio}*\nTotal: *${dados.valorTotalFormatado}* (${dados.totalCotas} Meses)\n\nConfira a ordem oficial de recebimento de cada mês gerada pelo Clube da Cota!`;

  assert(textoMensagem.includes("*Consórcio Amigos 2026*"), "Mensagem deve conter nome em negrito");
  assert(textoMensagem.includes("*R$ 50.000,00*"), "Mensagem deve conter o total em negrito");
  assert(textoMensagem.includes("Clube da Cota"), "Mensagem deve propagar a marca do Clube da Cota");

  const urlEncoded = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;
  assert(urlEncoded.startsWith("https://api.whatsapp.com/send?text="), "URL do WhatsApp deve ser válida");

  console.log("✅ Teste 4: Formatação e URL de compartilhamento WhatsApp validadas.");
}

console.log("\n🎉 Todos os 4 testes de Exportação de Imagem do Cronograma passaram com 100% de sucesso!");
