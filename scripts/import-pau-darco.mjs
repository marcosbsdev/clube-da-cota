import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando importação do consórcio 'Amigos Pau Darco 2026'...");

  // 1. Localizar o Criador (Marcos Batista)
  const criador = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "markos.system@gmail.com" },
        { role: "SUPER_ADMIN" },
      ],
    },
  });

  if (!criador) {
    throw new Error("Super Admin Marcos Batista não encontrado no banco.");
  }
  console.log(`✅ Criador localizado: ${criador.name} (${criador.email})`);

  // 2. Definir participantes da planilha
  const senhaPadrao = await bcrypt.hash("123456", 10);

  const participantesData = [
    { nome: "Junior Brito", email: "junior.brito@clubedacota.com.br" },
    { nome: "Patrick Guedes", email: "patrick.guedes@clubedacota.com.br" },
    { nome: "Marcos Batista", email: criador.email, isCriador: true, id: criador.id },
    { nome: "Josivan Ferreira", email: "josivan.ferreira@clubedacota.com.br" },
    { nome: "Wilson Maracajá", email: "wilson.maracaja@clubedacota.com.br" },
    { nome: "Lucas Nunes", email: "lucas.nunes@clubedacota.com.br" },
    { nome: "Fábio Junior", email: "fabio.junior@clubedacota.com.br" },
    { nome: "Marlucio Gago", email: "marlucio.gago@clubedacota.com.br" },
  ];

  const usuariosMap = new Map();
  usuariosMap.set(criador.name, criador);

  for (const p of participantesData) {
    if (p.isCriador) continue;
    let user = await prisma.user.findUnique({ where: { email: p.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: p.nome,
          email: p.email,
          passwordHash: senhaPadrao,
          role: "COMUM",
          isActivated: false,
          preferredTheme: "blue",
        },
      });
      console.log(`👤 Participante criado: ${user.name} (${user.email})`);
    } else {
      console.log(`👤 Participante existente: ${user.name}`);
    }
    usuariosMap.set(p.nome, user);
  }

  // Se já existir um consórcio com o nome "Amigos Pau Darco 2026", deleta antes de re-importar para garantir integridade
  const consorcioExistente = await prisma.consorcio.findFirst({
    where: { nome: "Amigos Pau Darco 2026" },
  });
  if (consorcioExistente) {
    console.log(`⚠️ Removendo versão anterior de 'Amigos Pau Darco 2026' para reimportação limpa...`);
    await prisma.consorcio.delete({ where: { id: consorcioExistente.id } });
  }

  // 3. Criar o Consórcio com os campos exatos do schema
  const dataInicio = new Date("2026-02-05T00:00:00.000Z");
  const dataPrimeiroVencimento = new Date("2026-02-05T00:00:00.000Z");

  const consorcio = await prisma.consorcio.create({
    data: {
      nome: "Amigos Pau Darco 2026",
      criadorId: criador.id,
      finalidade: "Consórcio entre amigos de Pau D'Arco 2026",
      regras: "Consórcio de 10 meses com acréscimo progressivo de R$ 5,00 por mês. Vencimento no dia 05 de cada mês.",
      dataInicio: dataInicio,
      dataPrimeiroVencimento: dataPrimeiroVencimento,
      status: "ATIVO",
      frequencia: "MENSAL",
      modeloContribuicao: "ACRESCIMO_MENSAL",
      valorCota: 100.0,
      valorAcrescimo: 5.0,
      valorTotalBolada: 1000.0,
      totalCotas: 10,
      tipoChavePix: "CELULAR",
      chavePix: "11963030266",
    },
  });
  console.log(`🎉 Consórcio criado com sucesso: ${consorcio.nome} (ID: ${consorcio.id})`);

  // 4. Mapeamento das 10 Cotas conforme SORTEIO FINAL da planilha
  const cotasPlano = [
    { numero: 1, titular: "Junior Brito", ordem: 1, contemplada: true },
    { numero: 2, titular: "Patrick Guedes", ordem: 2, contemplada: true },
    { numero: 3, titular: "Marcos Batista", ordem: 3, contemplada: true },
    { numero: 4, titular: "Josivan Ferreira", ordem: 4, contemplada: true },
    { numero: 5, titular: "Wilson Maracajá", ordem: 5, contemplada: true },
    { numero: 6, titular: "Lucas Nunes", ordem: 6, contemplada: true },
    { numero: 7, titular: "Patrick Guedes", ordem: 7, contemplada: true },
    { numero: 8, titular: "Marcos Batista", ordem: 8, contemplada: true },
    { numero: 9, titular: "Fábio Junior", ordem: 9, contemplada: true },
    { numero: 10, titular: "Marlucio Gago", ordem: 10, contemplada: false },
  ];

  const cotasCriadas = [];

  for (const c of cotasPlano) {
    const user = usuariosMap.get(c.titular);
    const tokenAcessoCota = crypto.randomUUID();
    const tokenAcessoParticipante = crypto.randomUUID();

    const cota = await prisma.cota.create({
      data: {
        consorcioId: consorcio.id,
        numero: c.numero,
        ordemSorteio: c.ordem,
        isCompartilhada: false,
        status: c.contemplada ? "CONTEMPLADA" : "ATIVA",
        tokenAcesso: tokenAcessoCota,
      },
    });

    await prisma.cotaParticipante.create({
      data: {
        cotaId: cota.id,
        usuarioId: user.id,
        percentual: 100.0,
        valorParcela: 100.0,
        tokenAcesso: tokenAcessoParticipante,
      },
    });

    cotasCriadas.push({ ...cota, titularId: user.id, titularNome: user.name });
  }
  console.log(`🎫 10 cotas vinculadas com seus titulares e tokens de acesso.`);

  // 5. Gerar as 100 Contribuições (10 cotas x 10 ciclos)
  // Datas de vencimento: 05 de Fev a 05 de Nov de 2026
  const datasVencimento = [
    new Date("2026-02-05T00:00:00.000Z"),
    new Date("2026-03-05T00:00:00.000Z"),
    new Date("2026-04-05T00:00:00.000Z"),
    new Date("2026-05-05T00:00:00.000Z"),
    new Date("2026-06-05T00:00:00.000Z"),
    new Date("2026-07-05T00:00:00.000Z"),
    new Date("2026-08-05T00:00:00.000Z"),
    new Date("2026-09-05T00:00:00.000Z"),
    new Date("2026-10-05T00:00:00.000Z"),
    new Date("2026-11-05T00:00:00.000Z"),
  ];

  let totalContribuicoes = 0;
  let totalPagas = 0;
  let totalPendentes = 0;

  for (let ciclo = 1; ciclo <= 10; ciclo++) {
    const dataVenc = datasVencimento[ciclo - 1];
    const valorParcelaCiclo = 100.0 + (ciclo - 1) * 5.0; // R$ 100, 105, 110 ... 145
    const isCicloPassado = ciclo <= 9;

    for (const cota of cotasCriadas) {
      await prisma.contribuicao.create({
        data: {
          consorcioId: consorcio.id,
          cotaId: cota.id,
          usuarioId: cota.titularId,
          numeroCiclo: ciclo,
          valorPrevisto: valorParcelaCiclo,
          dataVencimento: dataVenc,
          dataPagamento: isCicloPassado ? dataVenc : null,
          status: isCicloPassado ? "PAGO" : "PENDENTE",
        },
      });
      totalContribuicoes++;
      if (isCicloPassado) totalPagas++;
      else totalPendentes++;
    }
  }

  console.log(`💰 ${totalContribuicoes} parcelas geradas:`);
  console.log(`   - ${totalPagas} parcelas pagas e quitadas (Ciclos 1 a 9)`);
  console.log(`   - ${totalPendentes} parcelas pendentes (Ciclo 10 - Nov/2026)`);

  // 6. Log de Auditoria
  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "CRIACAO_CONSORCIO",
      detalhes: `Consórcio "${consorcio.nome}" implantado com sucesso com 10 cotas. Ciclos 1 a 9 registrados como pagos e Ciclo 10 aberto para vencimento em 05/11/2026.`,
      justificativa: "Implantação de consórcio em andamento transferido da planilha oficial.",
    },
  });

  console.log("\n🎉 Implantação concluída com 100% de sucesso no Supabase!");
}

main()
  .catch((e) => {
    console.error("❌ Erro na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
