import assert from "node:assert";
import {
  calcularDatasVencimento,
  validarDivisaoCota,
  determinarStatusContribuicao,
  calcularIndicadoresConsorcio,
  calcularValorCiclo,
  calcularTotalArrecadacaoConsorcio,
  validarMinimoParticipantes,
  formatarMoedaBRL,
  parseMoedaBRL,
  calcularResumoFinanceiroConsorcio,
} from "../src/lib/finance.ts";

console.log("🧪 Executando testes das regras financeiras do Clube da Cota...\n");

// Teste 1: Cálculo de datas de vencimento mensais
{
  const primeiroVencimento = new Date("2026-11-15T00:00:00.000Z");
  const datas = calcularDatasVencimento({
    dataPrimeiroVencimento: primeiroVencimento,
    frequencia: "MENSAL",
    quantidadeCiclos: 3,
  });

  assert.strictEqual(datas.length, 3, "Deve gerar 3 datas de vencimento");
  assert.strictEqual(datas[0].getMonth(), 10, "1º vencimento deve ser Novembro");
  assert.strictEqual(datas[1].getMonth(), 11, "2º vencimento deve ser Dezembro");
  assert.strictEqual(datas[2].getMonth(), 0, "3º vencimento deve ser Janeiro do ano seguinte");
  console.log("✅ Teste 1: Geração de datas de vencimento mensais aprovado.");
}

// Teste 2: Validação de cotas compartilhadas
{
  const cotaValida = validarDivisaoCota(500, [
    { usuarioId: "user-1", valorParcela: 250 },
    { usuarioId: "user-2", valorParcela: 250 },
  ]);
  assert.strictEqual(cotaValida.valido, true, "Divisão 50/50 deve ser válida");

  const cotaInvalida = validarDivisaoCota(500, [
    { usuarioId: "user-1", valorParcela: 250 },
    { usuarioId: "user-2", valorParcela: 200 },
  ]);
  assert.strictEqual(cotaInvalida.valido, false, "Divisão incompleta deve falhar");
  console.log("✅ Teste 2: Validação de cotas compartilhadas aprovado.");
}

// Teste 3: Determinação de status (Pendente vs Em atraso)
{
  const hoje = new Date("2026-11-20T12:00:00.000Z");
  const vencimentoPassado = new Date("2026-11-15T00:00:00.000Z");
  const vencimentoFuturo = new Date("2026-11-25T00:00:00.000Z");

  const statusAtrasado = determinarStatusContribuicao("PENDENTE", vencimentoPassado, hoje);
  assert.strictEqual(statusAtrasado, "EM_ATRASO", "Contribuição vencida deve ficar EM_ATRASO");

  const statusPendente = determinarStatusContribuicao("PENDENTE", vencimentoFuturo, hoje);
  assert.strictEqual(statusPendente, "PENDENTE", "Contribuição futura deve continuar PENDENTE");

  const statusPago = determinarStatusContribuicao("PAGO", vencimentoPassado, hoje);
  assert.strictEqual(statusPago, "PAGO", "Contribuição paga deve permanecer PAGO");
  console.log("✅ Teste 3: Transição de status financeiro aprovado.");
}

// Teste 4: Indicadores do painel do criador (4 métricas)
{
  const hoje = new Date("2026-11-20T12:00:00.000Z");
  const contribuicoes = [
    { valorPrevisto: 500, status: "PAGO", dataVencimento: new Date("2026-11-10") },
    { valorPrevisto: 500, status: "PENDENTE", dataVencimento: new Date("2026-11-15") },
    { valorPrevisto: 500, status: "PENDENTE", dataVencimento: new Date("2026-11-25") },
  ];

  const kpis = calcularIndicadoresConsorcio(contribuicoes, hoje);
  assert.strictEqual(kpis.totalPrevisto, 1500, "Total previsto deve ser 1500");
  assert.strictEqual(kpis.totalRecebido, 500, "Total recebido deve ser 500");
  assert.strictEqual(kpis.totalEmAtraso, 500, "Total em atraso deve ser 500");
  assert.strictEqual(kpis.totalPendentePrazo, 500, "Total pendente no prazo deve ser 500");
  assert.strictEqual(kpis.quantidadeAtrasados, 1, "Deve haver 1 atrasado");
  assert.strictEqual(kpis.percentualRecebido, 33, "Percentual deve ser 33%");
  console.log("✅ Teste 4: Cálculo dos 4 indicadores do criador aprovado.");
}

// Teste 5: Cálculo do modelo com acréscimo mensal progressivo (ex: 500 inicial + 5 a cada mês)
{
  // Cota de 500 com acréscimo de 5 por mês
  const mes1 = calcularValorCiclo(1, 500, "ACRESCIMO_MENSAL", 5);
  const mes2 = calcularValorCiclo(2, 500, "ACRESCIMO_MENSAL", 5);
  const mes3 = calcularValorCiclo(3, 500, "ACRESCIMO_MENSAL", 5);
  const mes10 = calcularValorCiclo(10, 500, "ACRESCIMO_MENSAL", 5);

  assert.strictEqual(mes1, 500, "Mês 1 deve ser 500");
  assert.strictEqual(mes2, 505, "Mês 2 deve ser 505");
  assert.strictEqual(mes3, 510, "Mês 3 deve ser 510");
  assert.strictEqual(mes10, 545, "Mês 10 deve ser 545");

  // Total arrecadado para 3 participantes/cotas:
  // Mês 1: 3 * 500 = 1500
  // Mês 2: 3 * 505 = 1515
  // Mês 3: 3 * 510 = 1530
  // Total = 1500 + 1515 + 1530 = 4545
  const total3Meses = calcularTotalArrecadacaoConsorcio({
    valorCotaBase: 500,
    valorAcrescimo: 5,
    modeloContribuicao: "ACRESCIMO_MENSAL",
    totalCotas: 3,
  });
  assert.strictEqual(total3Meses, 4545, "Total arrecadado deve ser 4545");
  console.log("✅ Teste 5: Cálculo de acréscimo mensal progressivo aprovado.");
}

// Teste 6: Validação de mínimo de 2 participantes (proibição de consórcio unipessoal)
{
  // Caso 1: Vazio
  const vazio = validarMinimoParticipantes([]);
  assert.strictEqual(vazio.valido, false, "Lista vazia não pode ser válida");
  assert.strictEqual(vazio.totalPessoas, 0);

  // Caso 2: Apenas 1 participante individual
  const apenasUm = validarMinimoParticipantes([{ isCompartilhada: false }]);
  assert.strictEqual(apenasUm.valido, false, "Consórcio com 1 pessoa não pode ser válido");
  assert.strictEqual(apenasUm.totalPessoas, 1);
  assert.match(apenasUm.mensagem, /mínimo 2 participantes/i);

  // Caso 3: 1 cota compartilhada (2 pessoas físicas)
  const umaCotaCompartilhada = validarMinimoParticipantes([{ isCompartilhada: true }]);
  assert.strictEqual(umaCotaCompartilhada.valido, true, "1 cota compartilhada equivale a 2 pessoas e deve ser válida");
  assert.strictEqual(umaCotaCompartilhada.totalPessoas, 2);

  // Caso 4: 2 participantes individuais
  const doisParticipantes = validarMinimoParticipantes([
    { isCompartilhada: false },
    { isCompartilhada: false },
  ]);
  assert.strictEqual(doisParticipantes.valido, true, "2 participantes individuais devem ser válidos");
  assert.strictEqual(doisParticipantes.totalPessoas, 2);

  // Caso 5: 1 individual + 1 compartilhada (3 pessoas)
  const tresPessoas = validarMinimoParticipantes([
    { isCompartilhada: false },
    { isCompartilhada: true },
  ]);
  assert.strictEqual(tresPessoas.valido, true, "3 pessoas devem ser válidas");
  assert.strictEqual(tresPessoas.totalPessoas, 3);

  console.log("✅ Teste 6: Validação de mínimo obrigatório de 2 participantes aprovado.");
}

// Teste 7: Formatação e Máscara no Padrão Brasileiro (Milhões, Milhares, Centenas e Centavos)
{
  assert.strictEqual(formatarMoedaBRL(100), "R$ 100,00", "Formatação de 100 deve ser R$ 100,00");
  assert.strictEqual(formatarMoedaBRL(1200), "R$ 1.200,00", "Formatação de 1200 deve ser R$ 1.200,00");
  assert.strictEqual(formatarMoedaBRL(12250), "R$ 12.250,00", "Formatação de 12250 deve ser R$ 12.250,00");
  assert.strictEqual(formatarMoedaBRL(1000000), "R$ 1.000.000,00", "Formatação de 1 milhão deve ser R$ 1.000.000,00");
  assert.strictEqual(formatarMoedaBRL(20000000), "R$ 20.000.000,00", "Formatação de 20 milhões deve ser R$ 20.000.000,00");

  assert.strictEqual(parseMoedaBRL("R$ 1.200,00"), 1200, "Parse de R$ 1.200,00 deve ser 1200");
  assert.strictEqual(parseMoedaBRL("120000"), 1200, "Parse de digitação contínua 120000 deve ser 1200");
  assert.strictEqual(parseMoedaBRL("500"), 5, "Parse de 500 centavos deve ser 5");

  console.log("✅ Teste 7: Máscara e formatação monetária no padrão brasileiro BRL aprovado.");
}

// Teste 8: Validação Completa dos Cálculos Financeiros (Modelo Fixo e Progressivo)
{
  // Caso 1: Caso exato do print do usuário (10 cotas, R$ 100 base, + R$ 5 acréscimo)
  const resumoProgressivo = calcularResumoFinanceiroConsorcio({
    valorCotaBase: 100,
    valorAcrescimo: 5,
    modeloContribuicao: "ACRESCIMO_MENSAL",
    totalCotas: 10,
  });

  assert.strictEqual(resumoProgressivo.parcelaPrimeiroCiclo, 100, "1º mês deve ser R$ 100");
  assert.strictEqual(resumoProgressivo.parcelaUltimoCiclo, 145, "10º mês deve ser R$ 145 (100 + 9 * 5)");
  assert.strictEqual(resumoProgressivo.boladaPrimeiroCiclo, 1000, "Bolada 1º mês deve ser R$ 1.000 (10 * 100)");
  assert.strictEqual(resumoProgressivo.boladaUltimoCiclo, 1450, "Bolada 10º mês deve ser R$ 1.450 (10 * 145)");
  assert.strictEqual(resumoProgressivo.totalPagoPorCota, 1225, "Total pago por cota deve ser R$ 1.225 (PA: (100+145)*10/2)");
  assert.strictEqual(resumoProgressivo.volumeTotalMovimentado, 12250, "Volume total movimentado deve ser R$ 12.250");

  // Caso 2: Consórcio Fixo (10 cotas de R$ 1.200)
  const resumoFixo = calcularResumoFinanceiroConsorcio({
    valorCotaBase: 1200,
    modeloContribuicao: "FIXO",
    totalCotas: 10,
  });

  assert.strictEqual(resumoFixo.parcelaPrimeiroCiclo, 1200);
  assert.strictEqual(resumoFixo.parcelaUltimoCiclo, 1200);
  assert.strictEqual(resumoFixo.boladaPrimeiroCiclo, 12000, "Bolada mensal deve ser R$ 12.000 (10 * 1.200)");
  assert.strictEqual(resumoFixo.totalPagoPorCota, 12000, "Total pago por cota deve ser R$ 12.000");
  assert.strictEqual(resumoFixo.volumeTotalMovimentado, 120000, "Volume total movimentado deve ser R$ 120.000");

  console.log("✅ Teste 8: Validação matemática completa dos valores calculados aprovada.");
}

console.log("\n🎉 Todos os 8 testes de regras financeiras passaram com 100% de sucesso!");
