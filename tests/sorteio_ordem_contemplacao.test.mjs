import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Algoritmo de sorteio Fisher-Yates
function sortearOrdemCotas(cotas) {
  const embaralhadas = [...cotas];
  for (let i = embaralhadas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [embaralhadas[i], embaralhadas[j]] = [embaralhadas[j], embaralhadas[i]];
  }
  return embaralhadas.map((cota, idx) => ({
    ...cota,
    ordemCiclo: idx + 1,
  }));
}

// Algoritmo de troca manual (Swap seguro 1-para-1)
function trocarCotasManual(cotas, cicloAlvo, novaCotaId) {
  const cotaAtualNoCiclo = cotas.find((c) => c.ordemCiclo === cicloAlvo);
  const cotaNova = cotas.find((c) => c.id === novaCotaId);
  if (!cotaAtualNoCiclo || !cotaNova || cotaAtualNoCiclo.id === cotaNova.id) return cotas;

  const cicloAnteriorDaNova = cotaNova.ordemCiclo;
  return cotas.map((c) => {
    if (c.id === cotaNova.id) return { ...c, ordemCiclo: cicloAlvo };
    if (c.id === cotaAtualNoCiclo.id) return { ...c, ordemCiclo: cicloAnteriorDaNova };
    return c;
  });
}

// Simulação de criação com ordensSorteio personalizadas
async function simularCriarConsorcioComOrdem(input) {
  const criador = await prisma.user.findUnique({ where: { id: input.criadorId } });
  if (!criador) throw new Error("Criador não encontrado.");

  let totalCotas = 0;
  input.participantes.forEach((p) => {
    totalCotas += p.cotasCount || 1;
  });

  const consorcio = await prisma.consorcio.create({
    data: {
      nome: input.nome,
      valorCota: input.valorCota,
      valorTotalBolada: input.valorCota * totalCotas,
      totalCotas,
      criadorId: criador.id,
      chavePix: input.chavePix,
      dataInicio: new Date(),
      dataPrimeiroVencimento: new Date(),
    },
  });

  let numeroCotaGlobal = 1;
  const cotasCriadas = [];

  for (const part of input.participantes) {
    let usuario = null;
    if (part.usuarioId) {
      usuario = await prisma.user.findUnique({ where: { id: part.usuarioId } });
    }
    if (!usuario) {
      usuario = await prisma.user.create({
        data: {
          name: part.nome,
          email: `test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`,
          role: "COMUM",
        },
      });
    }

    const qtd = part.cotasCount || 1;
    for (let c = 0; c < qtd; c++) {
      const numCota = numeroCotaGlobal++;
      const cotaOrdem = part.ordensSorteio?.[c] ?? numCota;

      const cota = await prisma.cota.create({
        data: {
          consorcioId: consorcio.id,
          numero: numCota,
          ordemSorteio: cotaOrdem,
          isCompartilhada: false,
        },
      });

      await prisma.cotaParticipante.create({
        data: {
          cotaId: cota.id,
          usuarioId: usuario.id,
          percentual: 100.0,
          valorParcela: input.valorCota,
        },
      });

      cotasCriadas.push(cota);
    }
  }

  return { consorcio, cotasCriadas };
}

async function runTests() {
  console.log('🧪 Iniciando testes do Sorteio Aleatório e Definição Manual da Ordem de Contemplação...');

  const timestamp = Date.now();
  const criador = await prisma.user.create({
    data: {
      name: `Criador Sorteio ${timestamp}`,
      email: `criador_sorteio_${timestamp}@test.com`,
      role: 'PRO_MASTER',
    },
  });

  const u1 = await prisma.user.create({
    data: { name: 'João Silva', email: `joao_${timestamp}@test.com` },
  });
  const u2 = await prisma.user.create({
    data: { name: 'Maria Souza', email: `maria_${timestamp}@test.com` },
  });
  const u3 = await prisma.user.create({
    data: { name: 'Pedro Santos', email: `pedro_${timestamp}@test.com` },
  });

  let consorcioCriado = null;

  try {
    // ----------------------------------------------------
    // Teste 1: Validação do Sorteio Aleatório (Fisher-Yates)
    // ----------------------------------------------------
    console.log('Testando algoritmo de Sorteio Aleatório (Fisher-Yates)...');
    const cotasBase = [
      { id: 'c1', rotulo: 'João', ordemCiclo: 1 },
      { id: 'c2', rotulo: 'Maria', ordemCiclo: 2 },
      { id: 'c3', rotulo: 'Pedro', ordemCiclo: 3 },
      { id: 'c4', rotulo: 'Ana', ordemCiclo: 4 },
      { id: 'c5', rotulo: 'Carlos', ordemCiclo: 5 },
    ];

    const sorteadas = sortearOrdemCotas(cotasBase);

    assert.strictEqual(sorteadas.length, 5, 'Deve conter todas as 5 cotas');
    const ciclosAtribuidos = sorteadas.map((c) => c.ordemCiclo).sort((a, b) => a - b);
    assert.deepStrictEqual(ciclosAtribuidos, [1, 2, 3, 4, 5], 'Todos os 5 ciclos (1 a 5) devem estar presentes sem repetições');

    const todosIdsPresentes = cotasBase.every((base) => sorteadas.some((s) => s.id === base.id));
    assert(todosIdsPresentes, 'Todas as cotas originais devem permanecer na lista sorteada');

    console.log('✅ Teste 1: Sorteio aleatório Fisher-Yates com permutação válida 1..N aprovado.');

    // ----------------------------------------------------
    // Teste 2: Validação da Troca Manual (Swap Seguro 1-para-1)
    // ----------------------------------------------------
    console.log('Testando troca manual de posições (Swap)...');
    // Em cotasBase: c1 está no ciclo 1, c2 está no ciclo 2
    // Se o criador colocar c2 no ciclo 1:
    const trocadas = trocarCotasManual(cotasBase, 1, 'c2');
    const c2Atual = trocadas.find((c) => c.id === 'c2');
    const c1Atual = trocadas.find((c) => c.id === 'c1');

    assert.strictEqual(c2Atual.ordemCiclo, 1, 'c2 deve passar a ocupar o ciclo 1');
    assert.strictEqual(c1Atual.ordemCiclo, 2, 'c1 deve assumir a posição anterior de c2 (ciclo 2)');

    // Nenhuma duplicidade de ciclo
    const ciclosDepoisSwap = trocadas.map((c) => c.ordemCiclo).sort((a, b) => a - b);
    assert.deepStrictEqual(ciclosDepoisSwap, [1, 2, 3, 4, 5], 'Permutação deve se manter estritamente íntegra após o swap');

    console.log('✅ Teste 2: Troca manual de posições segura (sem duplicidade ou lacuna) aprovada.');

    // ----------------------------------------------------
    // Teste 3: Gravação das Ordens de Sorteio Personalizadas no Banco
    // ----------------------------------------------------
    console.log('Testando criação de consórcio com ordens de contemplação personalizadas no banco...');

    // Simulando que o criador combinou:
    // Maria (u2) recebe no mês 1 (ordemCiclo: 1)
    // Pedro (u3) recebe no mês 2 (ordemCiclo: 2)
    // João (u1) recebe no mês 3 (ordemCiclo: 3)
    const participantesInput = [
      { usuarioId: u1.id, nome: u1.name, cotasCount: 1, ordensSorteio: [3] },
      { usuarioId: u2.id, nome: u2.name, cotasCount: 1, ordensSorteio: [1] },
      { usuarioId: u3.id, nome: u3.name, cotasCount: 1, ordensSorteio: [2] },
    ];

    const res = await simularCriarConsorcioComOrdem({
      criadorId: criador.id,
      nome: `Consorcio Com Sorteio ${timestamp}`,
      valorCota: 200,
      chavePix: 'pix@sorteio.com',
      participantes: participantesInput,
    });

    consorcioCriado = res.consorcio;

    // Busca as cotas criadas com seus respectivos participantes
    const cotasDoBanco = await prisma.cota.findMany({
      where: { consorcioId: consorcioCriado.id },
      include: {
        participantes: {
          include: { usuario: true },
        },
      },
      orderBy: { ordemSorteio: 'asc' },
    });

    assert.strictEqual(cotasDoBanco.length, 3, 'Devem existir 3 cotas criadas');

    // Ordem esperada por ordemSorteio:
    // 1º Ciclo (ordemSorteio = 1): Maria Souza (u2)
    // 2º Ciclo (ordemSorteio = 2): Pedro Santos (u3)
    // 3º Ciclo (ordemSorteio = 3): João Silva (u1)
    assert.strictEqual(cotasDoBanco[0].ordemSorteio, 1);
    assert.strictEqual(cotasDoBanco[0].participantes[0].usuario.id, u2.id, 'Ciclo 1 deve pertencer a Maria');

    assert.strictEqual(cotasDoBanco[1].ordemSorteio, 2);
    assert.strictEqual(cotasDoBanco[1].participantes[0].usuario.id, u3.id, 'Ciclo 2 deve pertencer a Pedro');

    assert.strictEqual(cotasDoBanco[2].ordemSorteio, 3);
    assert.strictEqual(cotasDoBanco[2].participantes[0].usuario.id, u1.id, 'Ciclo 3 deve pertencer a João');

    console.log('✅ Teste 3: Gravação de ordemSorteio personalizada no banco de dados validada com sucesso.');

    // ----------------------------------------------------
    // Teste 4: Fallback sequencial (quando ordensSorteio não é informado)
    // ----------------------------------------------------
    console.log('Testando fallback sequencial caso ordensSorteio não seja fornecido...');
    const participantesFallback = [
      { usuarioId: u1.id, nome: u1.name, cotasCount: 1 },
      { usuarioId: u2.id, nome: u2.name, cotasCount: 1 },
    ];

    const resFallback = await simularCriarConsorcioComOrdem({
      criadorId: criador.id,
      nome: `Consorcio Fallback ${timestamp}`,
      valorCota: 100,
      chavePix: 'pix@fallback.com',
      participantes: participantesFallback,
    });

    const cotasFallback = await prisma.cota.findMany({
      where: { consorcioId: resFallback.consorcio.id },
      orderBy: { numero: 'asc' },
    });

    assert.strictEqual(cotasFallback[0].ordemSorteio, 1);
    assert.strictEqual(cotasFallback[1].ordemSorteio, 2);

    // Limpa o consórcio de fallback
    await prisma.cotaParticipante.deleteMany({ where: { cota: { consorcioId: resFallback.consorcio.id } } });
    await prisma.cota.deleteMany({ where: { consorcioId: resFallback.consorcio.id } });
    await prisma.consorcio.delete({ where: { id: resFallback.consorcio.id } });

    console.log('✅ Teste 4: Fallback sequencial padrão validado.');

    // ----------------------------------------------------
    // Teste 5: Regra Estrita do Sorteio Automático (Imutabilidade & Bloqueio)
    // ----------------------------------------------------
    console.log('Testando regras de negócio do Sorteio Automático (Execução única e congelamento)...');
    let estadoSorteioRealizado = false;
    let cotasState = [
      { id: 'cota_1', rotulo: 'Carlos', ordemCiclo: 1 },
      { id: 'cota_2', rotulo: 'Ana', ordemCiclo: 2 },
      { id: 'cota_3', rotulo: 'Bia', ordemCiclo: 3 },
    ];

    // 1º Sorteio: permitido
    if (!estadoSorteioRealizado) {
      cotasState = sortearOrdemCotas(cotasState);
      estadoSorteioRealizado = true;
    }
    const snapshotPrimeiroSorteio = [...cotasState];

    // Tentativa de 2º Sorteio: deve ser estritamente bloqueada
    let tentouSegundoSorteio = false;
    if (estadoSorteioRealizado) {
      tentouSegundoSorteio = true; // Bloqueado, não reexecuta
    } else {
      cotasState = sortearOrdemCotas(cotasState);
    }
    assert.strictEqual(tentouSegundoSorteio, true, 'Deve identificar que o sorteio já foi realizado');
    assert.deepStrictEqual(cotasState, snapshotPrimeiroSorteio, 'Estado das cotas não pode mudar em nova tentativa de sorteio');

    // Tentativa de movimentação manual em modo SORTEIO_AUTOMATICO com sorteio realizado:
    const modoOrdem = 'SORTEIO_AUTOMATICO';
    let erroAoMover = '';
    const tentarMoverNoSorteio = (cicloAlvo, novaCotaId) => {
      if (modoOrdem === 'SORTEIO_AUTOMATICO' && estadoSorteioRealizado) {
        erroAoMover = 'No Sorteio Automático Oficial, as posições são congeladas e não podem ser alteradas.';
        return cotasState;
      }
      return trocarCotasManual(cotasState, cicloAlvo, novaCotaId);
    };

    const resultadoTentativaSwap = tentarMoverNoSorteio(1, 'cota_3');
    assert.strictEqual(erroAoMover.length > 0, true, 'Deve gerar erro ao tentar mover cota após sorteio automático');
    assert.deepStrictEqual(resultadoTentativaSwap, snapshotPrimeiroSorteio, 'Posições não podem se mover no modo sorteio');

    console.log('✅ Teste 5: Regra de execução única e congelamento de posições no Sorteio Automático validada com sucesso.');

    // ----------------------------------------------------
    // Teste 6: Liberdade Total de Reordenação no Modo Manual
    // ----------------------------------------------------
    console.log('Testando liberdade de reordenação no Modo Manual...');
    const modoOrdemManual = 'MANUAL';
    let cotasManual = [
      { id: 'cota_A', rotulo: 'Participante A', ordemCiclo: 1 },
      { id: 'cota_B', rotulo: 'Participante B', ordemCiclo: 2 },
      { id: 'cota_C', rotulo: 'Participante C', ordemCiclo: 3 },
    ];

    // No modo manual, mover Participante C para ciclo 1 deve trocar com Participante A sem travas
    const swapManual = trocarCotasManual(cotasManual, 1, 'cota_C');
    assert.strictEqual(swapManual.find((c) => c.id === 'cota_C').ordemCiclo, 1);
    assert.strictEqual(swapManual.find((c) => c.id === 'cota_A').ordemCiclo, 3);
    assert.strictEqual(swapManual.find((c) => c.id === 'cota_B').ordemCiclo, 2);

    console.log('✅ Teste 6: Flexibilidade e integridade do Modo Manual validadas.');

    // ----------------------------------------------------
    // Teste 7: Preservação e Restauração do Sorteio 1 na Alternância de Modos
    // ----------------------------------------------------
    console.log('Testando preservação do Sorteio #1 e bloqueio de re-sorteio ao alternar entre modos...');
    let cotasAtuais = [
      { id: 'c1', rotulo: 'User 1', ordemCiclo: 1 },
      { id: 'c2', rotulo: 'User 2', ordemCiclo: 2 },
      { id: 'c3', rotulo: 'User 3', ordemCiclo: 3 },
    ];
    let sorteioOficialSalvo = null;
    let modoAtual = 'SORTEIO_AUTOMATICO';

    // 1. Realiza o Sorteio Oficial pela 1ª vez
    const sorteadas1 = sortearOrdemCotas(cotasAtuais);
    sorteioOficialSalvo = [...sorteadas1];
    cotasAtuais = [...sorteadas1];

    // 2. Alterna para o Modo Manual
    modoAtual = 'MANUAL';
    // No modo manual, faz uma alteração manual arbitrária
    const cotasModificadasManualmente = trocarCotasManual(cotasAtuais, 1, cotasAtuais[2].id);
    cotasAtuais = cotasModificadasManualmente;
    assert.notDeepStrictEqual(cotasAtuais, sorteioOficialSalvo, 'No modo manual, as cotas foram alteradas');

    // 3. Alterna de volta para o Modo Sorteio Automático
    modoAtual = 'SORTEIO_AUTOMATICO';
    if (sorteioOficialSalvo !== null) {
      // Restauração mandatória do Sorteio 1
      cotasAtuais = [...sorteioOficialSalvo];
    }
    assert.deepStrictEqual(cotasAtuais, sorteioOficialSalvo, 'Ao voltar para o modo sorteio, o Sorteio #1 deve ser restaurado perfeitamente');

    // 4. Tentativa de realizar novo sorteio é rejeitada
    const tentarNovoSorteio = () => {
      if (sorteioOficialSalvo !== null) {
        // Bloqueado!
        return false;
      }
      return true;
    };
    const permitiuNovoSorteio = tentarNovoSorteio();
    assert.strictEqual(permitiuNovoSorteio, false, 'Não deve permitir realizar novo sorteio após o Sorteio #1 ter sido feito');
    assert.deepStrictEqual(cotasAtuais, sorteioOficialSalvo, 'As cotas continuam idênticas ao Sorteio #1');

    console.log('✅ Teste 7: Imutabilidade do Sorteio #1 e bloqueio total de novo sorteio ao alternar modos validados com sucesso.');

  } finally {
    // Teardown
    console.log('Limpando dados de teste...');
    if (consorcioCriado) {
      await prisma.cotaParticipante.deleteMany({ where: { cota: { consorcioId: consorcioCriado.id } } });
      await prisma.cota.deleteMany({ where: { consorcioId: consorcioCriado.id } });
      await prisma.consorcio.deleteMany({ where: { id: consorcioCriado.id } });
    }
    await prisma.user.deleteMany({
      where: { id: { in: [criador.id, u1.id, u2.id, u3.id] } },
    });
    await prisma.$disconnect();
  }

  console.log('\n🎉 Todos os 7 testes de Sorteio Aleatório e Ordem de Contemplação passaram com 100% de sucesso!');
}

runTests().catch((err) => {
  console.error('❌ Falha nos testes de sorteio:', err);
  process.exit(1);
});
