import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

async function run() {
  console.log("🚀 Iniciando carga do consórcio 'Amigos do Pau Darco 2026'...");

  // 1. Identificar ou obter o criador (Marcos Batista)
  let criador = await prisma.user.findUnique({
    where: { email: "markos.system@gmail.com" },
  });

  if (!criador) {
    criador = await prisma.user.create({
      data: {
        name: "Marcos Batista",
        email: "markos.system@gmail.com",
        role: "SUPER_ADMIN",
        preferredTheme: "blue",
        isActivated: true,
      },
    });
  }

  // 2. Mapeamento dos participantes (8 pessoas / 10 cotas)
  const participantesDef = [
    { nome: "Junior Brito", email: "junior.brito@amigospaudarco.local" },
    { nome: "Patrick Guedes", email: "patrick.guedes@amigospaudarco.local" },
    { nome: "Marcos Batista", email: "markos.system@gmail.com", userObj: criador },
    { nome: "Josivan Ferreira", email: "josivan.ferreira@amigospaudarco.local" },
    { nome: "Wilson Maracajá", email: "wilson.maracaja@amigospaudarco.local" },
    { nome: "Lucas Nunes", email: "lucas.nunes@amigospaudarco.local" },
    { nome: "Fábio Junior", email: "fabio.junior@amigospaudarco.local" },
    { nome: "Marlucio Gago", email: "marlucio.gago@amigospaudarco.local" },
  ];

  const usuariosMap = new Map();
  usuariosMap.set("Marcos Batista", criador);

  for (const p of participantesDef) {
    if (usuariosMap.has(p.nome)) continue;

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: p.email },
          { name: { equals: p.nome } },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: p.nome,
          email: p.email,
          role: "COMUM",
          preferredTheme: "blue",
          isActivated: false,
        },
      });
    }

    usuariosMap.set(p.nome, user);
  }

  // 3. Criar o Consórcio
  const consorcioNome = "Amigos do Pau Darco 2026";
  
  // Remover versão anterior se existir com esse nome para evitar duplicidade
  const existente = await prisma.consorcio.findFirst({
    where: { nome: consorcioNome },
  });

  if (existente) {
    console.log(`⚠️ Removendo versão anterior de '${consorcioNome}' (id: ${existente.id})...`);
    await prisma.contribuicao.deleteMany({ where: { consorcioId: existente.id } });
    await prisma.cotaParticipante.deleteMany({ where: { cota: { consorcioId: existente.id } } });
    await prisma.cota.deleteMany({ where: { consorcioId: existente.id } });
    await prisma.auditoriaLog.deleteMany({ where: { consorcioId: existente.id } });
    await prisma.consorcio.delete({ where: { id: existente.id } });
  }

  const dataInicio = new Date("2026-02-05T12:00:00Z");
  const dataPrimeiroVencimento = new Date("2026-02-05T12:00:00Z");

  const consorcio = await prisma.consorcio.create({
    data: {
      nome: consorcioNome,
      finalidade: "Consórcio entre amigos com progressão mensal de R$ 5,00 por ciclo",
      regras: "Vencimento no dia 05 de cada mês. Pagamentos via Pix. Contemplação mensal conforme ordem acordada.",
      dataInicio,
      dataPrimeiroVencimento,
      frequencia: "MENSAL",
      modeloContribuicao: "ACRESCIMO_MENSAL",
      valorCota: 100.0,
      valorAcrescimo: 5.0,
      valorTotalBolada: 12250.0, // 1000 + 1050 + 1100 + 1150 + 1200 + 1250 + 1300 + 1350 + 1400 + 1450
      totalCotas: 10,
      status: "ATIVO",
      criadorId: criador.id,
    },
  });

  console.log(`✅ Consórcio criado com ID: ${consorcio.id}`);

  // 4. Definição das 10 Cotas (Sorteio Original x Sorteio Final)
  // ordemSorteio representa a posição final (Ciclo no qual recebe)
  // numero representa o número da cota sorteada originalmente
  const cotasConfig = [
    {
      numeroOriginal: 6,
      ordemFinal: 1,
      participante: "Junior Brito",
      mes: "Fevereiro",
      contemplado: true,
      dataContemplacao: new Date("2026-02-05T15:00:00Z"),
    },
    {
      numeroOriginal: 4,
      ordemFinal: 2,
      participante: "Patrick Guedes",
      mes: "Março",
      contemplado: true,
      dataContemplacao: new Date("2026-03-05T15:00:00Z"),
    },
    {
      numeroOriginal: 7,
      ordemFinal: 3,
      participante: "Marcos Batista",
      mes: "Abril",
      contemplado: true,
      dataContemplacao: new Date("2026-04-05T15:00:00Z"),
    },
    {
      numeroOriginal: 8,
      ordemFinal: 4,
      participante: "Josivan Ferreira",
      mes: "Maio",
      contemplado: true,
      dataContemplacao: new Date("2026-05-05T15:00:00Z"),
    },
    {
      numeroOriginal: 2,
      ordemFinal: 5,
      participante: "Wilson Maracajá",
      mes: "Junho",
      contemplado: true,
      dataContemplacao: new Date("2026-06-05T15:00:00Z"),
    },
    {
      numeroOriginal: 3,
      ordemFinal: 6,
      participante: "Lucas Nunes",
      mes: "Julho",
      contemplado: true,
      dataContemplacao: new Date("2026-07-05T15:00:00Z"),
    },
    {
      numeroOriginal: 5,
      ordemFinal: 7,
      participante: "Patrick Guedes",
      mes: "Agosto",
      contemplado: true,
      dataContemplacao: new Date("2026-08-05T15:00:00Z"),
    },
    {
      numeroOriginal: 9,
      ordemFinal: 8,
      participante: "Marcos Batista",
      mes: "Setembro",
      contemplado: true,
      dataContemplacao: new Date("2026-09-05T15:00:00Z"),
    },
    {
      numeroOriginal: 1,
      ordemFinal: 9,
      participante: "Fábio Junior",
      mes: "Outubro",
      contemplado: true,
      dataContemplacao: new Date("2026-10-05T15:00:00Z"),
    },
    {
      numeroOriginal: 10,
      ordemFinal: 10,
      participante: "Marlucio Gago",
      mes: "Novembro",
      contemplado: false,
      dataContemplacao: null,
    },
  ];

  // Ordena por ordem final para inserção harmoniosa
  cotasConfig.sort((a, b) => a.ordemFinal - b.ordemFinal);

  // 5. Gerar datas de vencimento de cada ciclo (dia 05 de cada mês, fev a nov/2026)
  const datasVencimento = [];
  for (let m = 2; m <= 11; m++) {
    const mesStr = String(m).padStart(2, "0");
    datasVencimento.push(new Date(`2026-${mesStr}-05T12:00:00Z`));
  }

  // 6. Criar Cotas, Participantes e Contribuições
  const cotasCriadas = [];

  for (const cfg of cotasConfig) {
    const user = usuariosMap.get(cfg.participante);
    if (!user) throw new Error(`Usuário não encontrado: ${cfg.participante}`);

    const cota = await prisma.cota.create({
      data: {
        consorcioId: consorcio.id,
        numero: cfg.numeroOriginal,
        ordemSorteio: cfg.ordemFinal,
        status: cfg.contemplado ? "CONTEMPLADA" : "ATIVA",
        isCompartilhada: false,
        tokenAcesso: "cota_" + crypto.randomBytes(6).toString("hex"),
      },
    });

    await prisma.cotaParticipante.create({
      data: {
        cotaId: cota.id,
        usuarioId: user.id,
        percentual: 100.0,
        valorParcela: 100.0,
        tokenAcesso: "cp_" + crypto.randomBytes(6).toString("hex"),
      },
    });

    cotasCriadas.push({ cota, user, cfg });
  }

  console.log(`✅ ${cotasCriadas.length} Cotas e Participantes criados com sucesso.`);

  // 7. Criar as 100 Contribuições (10 cotas x 10 ciclos)
  // Ciclos 1 a 9: PAGO
  // Ciclo 10: PENDENTE
  let totalPagas = 0;
  let totalPendentes = 0;

  for (const { cota, user } of cotasCriadas) {
    for (let c = 0; c < 10; c++) {
      const numeroCiclo = c + 1;
      const dataVenc = datasVencimento[c];
      const valorCiclo = 100.0 + c * 5.0; // R$ 100, 105, 110, ..., 145
      const isPago = numeroCiclo <= 9; // Ciclos 1 a 9 já contemplados

      await prisma.contribuicao.create({
        data: {
          consorcioId: consorcio.id,
          cotaId: cota.id,
          usuarioId: user.id,
          numeroCiclo,
          valorPrevisto: valorCiclo,
          dataVencimento: dataVenc,
          status: isPago ? "PAGO" : "PENDENTE",
          dataPagamento: isPago ? dataVenc : null,
          responsavelAlteracaoId: isPago ? criador.id : null,
          motivoAlteracao: isPago
            ? "Pagamento retroativo regularizado (Ciclo contemplado)."
            : null,
        },
      });

      if (isPago) totalPagas++;
      else totalPendentes++;
    }
  }

  console.log(`✅ ${totalPagas} contribuições marcadas como PAGO (Ciclos 1 a 9).`);
  console.log(`✅ ${totalPendentes} contribuições mantidas como PENDENTE (Ciclo 10 - Nov/2026).`);

  // 8. Gravar Logs de Auditoria
  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "CRIACAO_CONSORCIO",
      detalhes: JSON.stringify({
        nome: consorcioNome,
        totalCotas: 10,
        modeloContribuicao: "PROGRESSIVO",
        valorCota: 100.0,
        valorAcrescimo: 5.0,
        valorTotalBolada: 12250.0,
        retroativo: true,
        dataInicio: "2026-02-05",
      }),
      justificativa: "Lançamento inicial do consórcio retroativo 'Amigos do Pau Darco 2026'.",
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "TROCA_POSICOES",
      detalhes: JSON.stringify({
        descricao: "Consolidação das trocas entre Sorteio Original e Sorteio Final acordado entre os membros.",
        totalTrocas: 8,
      }),
      justificativa: "Ajuste e consolidação das posições definitivas de contemplação conforme acordado pelo grupo.",
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "CONFIRMACAO_PAGAMENTO",
      detalhes: JSON.stringify({
        ciclosQuitados: "1 ao 9 (Fevereiro a Outubro de 2026)",
        totalParcelas: totalPagas,
        valorArrecadado: 10800.0,
      }),
      justificativa: "Baixa em lote de todas as parcelas quitadas dos 9 ciclos contemplados.",
    },
  });

  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "CONTEMPLACAO_MARCADA",
      detalhes: JSON.stringify({
        contemplados: [
          "Ciclo 1: Junior Brito",
          "Ciclo 2: Patrick Guedes",
          "Ciclo 3: Marcos Batista",
          "Ciclo 4: Josivan Ferreira",
          "Ciclo 5: Wilson Maracajá",
          "Ciclo 6: Lucas Nunes",
          "Ciclo 7: Patrick Guedes",
          "Ciclo 8: Marcos Batista",
          "Ciclo 9: Fábio Junior",
        ],
      }),
      justificativa: "Marcação das 9 cotas sorteadas e recebidas entre Fevereiro e Outubro de 2026.",
    },
  });

  console.log("✅ Trilha de Auditoria registrada com 4 eventos de governança.");
  console.log("\n🎉 Lançamento do consórcio 'Amigos do Pau Darco 2026' concluído com 100% de sucesso!");
}

run()
  .catch((e) => {
    console.error("❌ Erro ao lançar consórcio:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
