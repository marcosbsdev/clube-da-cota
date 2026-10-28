import assert from "node:assert";

console.log("🧪 Iniciando testes de Lógica de Paginação e Escalabilidade de Registros...\n");

// Função pura que reproduz o algoritmo de janela de páginas do PaginationControl
function gerarJanelaPaginas(paginaAtual, totalPaginas) {
  if (totalPaginas <= 7) {
    return Array.from({ length: totalPaginas }, (_, i) => i + 1);
  }
  if (paginaAtual <= 4) {
    return [1, 2, 3, 4, 5, "...", totalPaginas];
  }
  if (paginaAtual >= totalPaginas - 3) {
    return [
      1,
      "...",
      totalPaginas - 4,
      totalPaginas - 3,
      totalPaginas - 2,
      totalPaginas - 1,
      totalPaginas,
    ];
  }
  return [
    1,
    "...",
    paginaAtual - 1,
    paginaAtual,
    paginaAtual + 1,
    "...",
    totalPaginas,
  ];
}

function calcularFatia(totalItens, paginaAtual, itensPorPagina) {
  const totalPaginas = Math.ceil(totalItens / itensPorPagina);
  const inicio = (paginaAtual - 1) * itensPorPagina;
  const fim = Math.min(inicio + itensPorPagina, totalItens);
  const itemInicial = totalItens === 0 ? 0 : inicio + 1;
  const itemFinal = fim;
  return {
    totalPaginas,
    inicio,
    fim,
    itemInicial,
    itemFinal,
    podeAnterior: paginaAtual > 1,
    podeProxima: paginaAtual < totalPaginas,
  };
}

// Teste 1: Cálculo de Páginas e Fatias
console.log("Testando cálculo de total de páginas e limites de itens...");
const c1 = calcularFatia(105, 1, 10);
assert.strictEqual(c1.totalPaginas, 11, "105 itens com 10 por página deve gerar 11 páginas");
assert.strictEqual(c1.inicio, 0);
assert.strictEqual(c1.fim, 10);
assert.strictEqual(c1.itemInicial, 1);
assert.strictEqual(c1.itemFinal, 10);
assert.strictEqual(c1.podeAnterior, false);
assert.strictEqual(c1.podeProxima, true);

const c2 = calcularFatia(105, 11, 10);
assert.strictEqual(c2.inicio, 100);
assert.strictEqual(c2.fim, 105);
assert.strictEqual(c2.itemInicial, 101);
assert.strictEqual(c2.itemFinal, 105);
assert.strictEqual(c2.podeAnterior, true);
assert.strictEqual(c2.podeProxima, false);
console.log("✅ Teste 1: Cálculo de páginas e fatias (início/fim) validado com sucesso.");

// Teste 2: Lista Vazia
console.log("Testando comportamento com total de itens = 0...");
const cVazio = calcularFatia(0, 1, 10);
assert.strictEqual(cVazio.totalPaginas, 0);
assert.strictEqual(cVazio.itemInicial, 0);
assert.strictEqual(cVazio.itemFinal, 0);
console.log("✅ Teste 2: Lista vazia tratada com segurança.");

// Teste 3: Janela Deslizante de Páginas (Algoritmo de Elipses)
console.log("Testando janela de páginas com reticências...");
const jCurta = gerarJanelaPaginas(3, 5);
assert.deepStrictEqual(jCurta, [1, 2, 3, 4, 5], "Até 7 páginas não deve ter reticências");

const jInicio = gerarJanelaPaginas(2, 20);
assert.deepStrictEqual(jInicio, [1, 2, 3, 4, 5, "...", 20]);

const jMeio = gerarJanelaPaginas(10, 20);
assert.deepStrictEqual(jMeio, [1, "...", 9, 10, 11, "...", 20]);

const jFim = gerarJanelaPaginas(19, 20);
assert.deepStrictEqual(jFim, [1, "...", 16, 17, 18, 19, 20]);
console.log("✅ Teste 3: Janela deslizante e reticências validadas perfeitamente.");

// Teste 4: Fatiamento de Array Real
console.log("Testando fatiamento de dados sintéticos simulando milhares de registros...");
const dadosSimulados = Array.from({ length: 1542 }, (_, i) => ({ id: `user_${i + 1}`, nome: `Usuário ${i + 1}` }));
const fatiaPagina5 = dadosSimulados.slice(4 * 25, 4 * 25 + 25);
assert.strictEqual(fatiaPagina5.length, 25);
assert.strictEqual(fatiaPagina5[0].id, "user_101");
assert.strictEqual(fatiaPagina5[24].id, "user_125");
console.log("✅ Teste 4: Fatiamento de dados em alta escala validado com sucesso.");

console.log("\n🎉 Todos os 4 testes de Paginação passaram com 100% de sucesso!\n");
