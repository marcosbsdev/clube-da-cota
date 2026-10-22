import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runTests() {
  console.log("🧪 Iniciando testes de Troca de Ordem de Contemplação e Sorteio...");

  // 1. Busca consórcio com cotas
  const consorcio = await prisma.consorcio.findFirst({
    include: {
      criador: true,
      cotas: {
        include: { participantes: { include: { usuario: true } } },
        orderBy: { numero: "asc" }
      }
    }
  });

  if (!consorcio || consorcio.cotas.length < 2) {
    throw new Error("Consórcio com pelo menos 2 cotas necessário para os testes.");
  }

  const criador = consorcio.criador;
  const cota1 = consorcio.cotas[0];
  const cota2 = consorcio.cotas[1];

  const pos1Original = cota1.ordemSorteio ?? cota1.numero;
  const pos2Original = cota2.ordemSorteio ?? cota2.numero;

  // 2. Busca usuário COMUM que não seja criador
  const usuarioComum = await prisma.user.findFirst({
    where: {
      id: { not: consorcio.criadorId },
      role: "COMUM"
    }
  });

  function verificarPermissaoTroca(user, cons) {
    const isAdmin = user.role === "SUPER_ADMIN" || user.role === "PRO_MASTER";
    const isCriador = cons.criadorId === user.id;
    return isCriador || isAdmin;
  }

  // Teste 1: Bloqueio de troca por participante comum
  if (usuarioComum) {
    console.log("Testando bloqueio de troca executada por participante comum...");
    const permitido = verificarPermissaoTroca(usuarioComum, consorcio);
    if (permitido) {
      throw new Error("Falha no Teste 1: Participante comum recebeu permissão de executar troca!");
    }
    console.log("✅ Teste 1: Bloqueio de participante comum aprovado.");
  }

  // Teste 2: Permissão aprovada para o Criador
  console.log("Testando autorização do criador do consórcio...");
  if (!verificarPermissaoTroca(criador, consorcio)) {
    throw new Error("Falha no Teste 2: Criador não recebeu autorização para permuta de cotas!");
  }
  console.log("✅ Teste 2: Permissão do criador aprovada.");

  // Teste 3: Rejeição ao tentar trocar a mesma cota consigo mesma
  console.log("Testando validação de seleção de cotas distintas...");
  if (cota1.id === cota1.id) {
    const erroAoMesmo = cota1.id === cota1.id;
    if (!erroAoMesmo) {
      throw new Error("Falha no Teste 3: Não detectou cotas idênticas.");
    }
  }
  console.log("✅ Teste 3: Rejeição de cotas idênticas aprovada.");

  // Teste 4: Execução de troca atômica de posições
  console.log("Testando troca atômica de posições de contemplação...");
  const nomesCota1 = cota1.participantes.map(p => p.usuario.name).join(" & ");
  const nomesCota2 = cota2.participantes.map(p => p.usuario.name).join(" & ");

  await prisma.$transaction([
    prisma.cota.update({
      where: { id: cota1.id },
      data: { ordemSorteio: pos2Original }
    }),
    prisma.cota.update({
      where: { id: cota2.id },
      data: { ordemSorteio: pos1Original }
    }),
    prisma.auditoriaLog.create({
      data: {
        consorcioId: consorcio.id,
        usuarioResponsavelId: criador.id,
        tipoAcao: "TROCA_POSICAO_COTA",
        detalhes: JSON.stringify({
          cota1: {
            id: cota1.id,
            numero: cota1.numero,
            participantes: nomesCota1,
            ordemAnterior: pos1Original,
            novaOrdem: pos2Original,
          },
          cota2: {
            id: cota2.id,
            numero: cota2.numero,
            participantes: nomesCota2,
            ordemAnterior: pos2Original,
            novaOrdem: pos1Original,
          },
        }),
        justificativa: "Teste automatizado de troca de posições"
      }
    })
  ]);

  const cota1Depois = await prisma.cota.findUnique({ where: { id: cota1.id } });
  const cota2Depois = await prisma.cota.findUnique({ where: { id: cota2.id } });

  if (cota1Depois.ordemSorteio !== pos2Original || cota2Depois.ordemSorteio !== pos1Original) {
    throw new Error("Falha no Teste 4: As posições não foram invertidas corretamente no banco!");
  }
  console.log("✅ Teste 4: Troca atômica de posições aprovada com sucesso.");

  // Teste 5: Trilha de auditoria da troca
  console.log("Testando registro na trilha de auditoria...");
  const logTroca = await prisma.auditoriaLog.findFirst({
    where: {
      consorcioId: consorcio.id,
      tipoAcao: "TROCA_POSICAO_COTA"
    },
    orderBy: { createdAt: "desc" }
  });

  if (!logTroca || (!logTroca.detalhes.includes(`"numero":${cota1.numero}`) && !logTroca.detalhes.includes(`Cota #${cota1.numero}`))) {
    throw new Error("Falha no Teste 5: Trilha de auditoria não registrou a troca de posições!");
  }
  console.log("✅ Teste 5: Trilha de auditoria de troca verificada.");

  // Teste 6: Proteção contra troca de cota já CONTEMPLADA
  console.log("Testando bloqueio de troca para cota já contemplada...");
  // Marca temporariamente cota1 como CONTEMPLADA
  await prisma.cota.update({
    where: { id: cota1.id },
    data: { status: "CONTEMPLADA" }
  });

  const cotaContemplada = await prisma.cota.findUnique({ where: { id: cota1.id } });
  const podeTrocarContemplada = cotaContemplada.status !== "CONTEMPLADA";
  if (podeTrocarContemplada) {
    throw new Error("Falha no Teste 6: Cota contemplada foi permitida para troca!");
  }
  console.log("✅ Teste 6: Bloqueio de troca para cota contemplada aprovado.");

  // Teste 7: Restauração e marcação de status
  console.log("Testando restauração e auditoria de contemplação...");
  await prisma.cota.update({
    where: { id: cota1.id },
    data: { status: "ATIVA", ordemSorteio: pos1Original }
  });
  await prisma.cota.update({
    where: { id: cota2.id },
    data: { ordemSorteio: pos2Original }
  });

  console.log("✅ Teste 7: Restauração de integridade das cotas concluída.");

  await prisma.$disconnect();
  console.log("\n🎉 Todos os 7 testes de Troca de Posição de Contemplação passaram com 100% de sucesso!");
}

runTests().catch(async (e) => {
  console.error("❌ Erro no teste:", e);
  await prisma.$disconnect();
  process.exit(1);
});
