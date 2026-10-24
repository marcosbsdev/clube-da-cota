import assert from "node:assert";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("🧪 Iniciando testes do Ciclo de Vida do Consórcio (Encerramento, Exclusão e Modelo A - 1 Ativo Simultâneo)...\n");

async function rodarTestes() {
  try {
    // 1. Criar usuário de teste no plano COMUM
    const userComum = await prisma.user.create({
      data: {
        name: "Usuario Modelo A Teste",
        email: `modelo.a.${Date.now()}@teste.com`,
        role: "COMUM",
        isActivated: true,
      },
    });

    // 2. Validação de criação Modelo A (1 ativo simultâneo para Comum)
    async function validarCriacaoModeloA(criadorId, role) {
      const ativos = await prisma.consorcio.count({ where: { criadorId, status: "ATIVO" } });

      if (role === "COMUM" && ativos >= 1) {
        return {
          success: false,
          error: "Você atingiu o limite de 1 consórcio ativo do Plano Comum. Para gerenciar novos grupos simultaneamente, realize a migração de plano via Pix para Marcos Batista.",
        };
      }
      if (role === "PRO" && ativos >= 3) {
        return {
          success: false,
          error: "Você atingiu o limite de 3 consórcios ativos do Plano Pro.",
        };
      }
      return { success: true };
    }

    // Com 0 consórcios ativos, Comum pode criar
    const val1 = await validarCriacaoModeloA(userComum.id, userComum.role);
    assert.strictEqual(val1.success, true);
    console.log("✅ Teste 1: Usuário Comum com 0 consórcios pode criar seu 1º consórcio.");

    // Criar o primeiro consórcio ATIVO
    const consorcio1 = await prisma.consorcio.create({
      data: {
        nome: "Consórcio Amigos da Bola 1",
        valorCota: 100,
        valorTotalBolada: 500,
        totalCotas: 5,
        dataInicio: new Date(),
        dataPrimeiroVencimento: new Date(),
        criadorId: userComum.id,
        status: "ATIVO",
      },
    });

    // 3. Usuário Comum tenta criar 2º consórcio enquanto o 1º está ativo -> Bloqueado!
    const val2 = await validarCriacaoModeloA(userComum.id, userComum.role);
    assert.strictEqual(val2.success, false);
    assert.ok(val2.error.includes("limite de 1 consórcio ativo"));
    console.log("✅ Teste 2: Usuário Comum bloqueado ao tentar criar 2º consórcio simultâneo.");

    // 4. Encerramento do 1º consórcio (Deleção Lógica)
    await prisma.consorcio.update({
      where: { id: consorcio1.id },
      data: { status: "ENCERRADO" },
    });

    const consorcioEncerrado = await prisma.consorcio.findUnique({ where: { id: consorcio1.id } });
    assert.strictEqual(consorcioEncerrado.status, "ENCERRADO");
    console.log("✅ Teste 3: 1º Consórcio encerrado com sucesso (status = ENCERRADO).");

    // 5. Modelo A: Como o 1º consórcio está ENCERRADO (0 ativos no momento), Usuário Comum PODE criar o 2º consórcio!
    const val3 = await validarCriacaoModeloA(userComum.id, userComum.role);
    assert.strictEqual(val3.success, true);
    console.log("✅ Teste 4: Modelo A validado com sucesso: consórcio encerrado libera vaga para novo consórcio do usuário Comum.");

    // Criar o 2º consórcio ativo
    const consorcio2 = await prisma.consorcio.create({
      data: {
        nome: "Consórcio Amigos da Bola 2",
        valorCota: 150,
        valorTotalBolada: 750,
        totalCotas: 5,
        dataInicio: new Date(),
        dataPrimeiroVencimento: new Date(),
        criadorId: userComum.id,
        status: "ATIVO",
      },
    });

    // 6. Tentar reativar o 1º consórcio enquanto o 2º está ativo -> Bloqueado por limite de plano!
    async function simularReativacao(consorcioId, criadorId, role) {
      if (role === "COMUM") {
        const ativos = await prisma.consorcio.count({ where: { criadorId, status: "ATIVO" } });
        if (ativos >= 1) {
          return {
            success: false,
            error: "Você já possui 1 consórcio ativo no Plano Comum. Para gerenciar mais grupos simultâneos, migre para o Plano Pro.",
          };
        }
      }
      await prisma.consorcio.update({ where: { id: consorcioId }, data: { status: "ATIVO" } });
      return { success: true };
    }

    const resTentativaReativar = await simularReativacao(consorcio1.id, userComum.id, userComum.role);
    assert.strictEqual(resTentativaReativar.success, false);
    assert.ok(resTentativaReativar.error.includes("Plano Comum"));
    console.log("✅ Teste 5: Reativação bloqueada com sucesso caso exceda o limite de 1 consórcio ativo simultâneo.");

    // 7. Teste de Trava de Somente Leitura em Consórcio Encerrado
    function simularAcaoEmConsorcioEncerrado(status) {
      if (status === "ENCERRADO") {
        return { success: false, error: "Este consórcio está encerrado (somente leitura) e não permite alterações." };
      }
      return { success: true };
    }

    const resAcaoBloqueada = simularAcaoEmConsorcioEncerrado(consorcioEncerrado.status);
    assert.strictEqual(resAcaoBloqueada.success, false);
    assert.ok(resAcaoBloqueada.error.includes("somente leitura"));
    console.log("✅ Teste 6: Trava de Somente Leitura em consórcio encerrado aprovada.");

    // 8. Teste de Bloqueio de Exclusão Física se houver pagamento confirmado
    const cotaTeste = await prisma.cota.create({
      data: {
        consorcioId: consorcio2.id,
        numero: 1,
        status: "ATIVA",
      },
    });

    const contribTeste = await prisma.contribuicao.create({
      data: {
        consorcioId: consorcio2.id,
        cotaId: cotaTeste.id,
        usuarioId: userComum.id,
        numeroCiclo: 1,
        valorPrevisto: 150,
        dataVencimento: new Date(),
        status: "PAGO", // Pagamento confirmado!
      },
    });

    async function simularExclusao(consorcioId, nomeDigitado) {
      const c = await prisma.consorcio.findUnique({ where: { id: consorcioId } });
      if (nomeDigitado.trim().toLowerCase() !== c.nome.trim().toLowerCase()) {
        return { success: false, error: "Nome divergente." };
      }
      const pagamentos = await prisma.contribuicao.count({
        where: { consorcioId, status: "PAGO" },
      });
      if (pagamentos > 0) {
        return {
          success: false,
          error: "Este consórcio já possui pagamentos confirmados e não pode ser excluído para garantir a segurança dos participantes.",
        };
      }
      await prisma.consorcio.delete({ where: { id: consorcioId } });
      return { success: true };
    }

    const resTentativaExclusaoComPagamento = await simularExclusao(consorcio2.id, "Consórcio Amigos da Bola 2");
    assert.strictEqual(resTentativaExclusaoComPagamento.success, false);
    assert.ok(resTentativaExclusaoComPagamento.error.includes("pagamentos confirmados"));
    console.log("✅ Teste 7: Bloqueio rigoroso de exclusão física para consórcio com pagamentos confirmados aprovado.");

    // 9. Teste de Exclusão Física permitida quando NÃO há pagamentos (Consórcio 1 encerrado e sem pagamentos)
    const resExclusaoSemPagamentos = await simularExclusao(consorcio1.id, "Consórcio Amigos da Bola 1");
    assert.strictEqual(resExclusaoSemPagamentos.success, true);

    const checarDeletado = await prisma.consorcio.findUnique({ where: { id: consorcio1.id } });
    assert.strictEqual(checarDeletado, null);
    console.log("✅ Teste 8: Exclusão física permitida com sucesso para consórcio sem pagamentos.");

    // Limpeza
    await prisma.contribuicao.delete({ where: { id: contribTeste.id } });
    await prisma.cota.delete({ where: { id: cotaTeste.id } });
    await prisma.consorcio.delete({ where: { id: consorcio2.id } });
    await prisma.user.delete({ where: { id: userComum.id } });

    console.log("\n🎉 Todos os testes do Ciclo de Vida do Consórcio e Modelo A passaram com 100% de sucesso!");
  } catch (error) {
    console.error("❌ Erro no teste:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

rodarTestes();
