import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Iniciando importação contábil do consórcio 'Amigos Secad 2026'...");

  // 1. Localizar o Criador (Marcos Batista - Super Admin)
  const criador = await prisma.user.findFirst({
    where: {
      OR: [
        { email: "markos.system@gmail.com" },
        { role: "SUPER_ADMIN" },
      ],
    },
  });

  if (!criador) {
    throw new Error("Super Admin Marcos Batista não encontrado no banco de dados.");
  }
  console.log(`✅ Criador localizado: ${criador.name} (${criador.email}) - Role: ${criador.role}`);

  // 2. Definir participantes conforme cronograma
  const senhaPadrao = await bcrypt.hash("123456", 10);

  const participantesData = [
    { nome: "Thiago Leandro", email: "thiago.leandro@clubedacota.com.br" },
    { nome: "Ronne", email: "ronne@clubedacota.com.br" },
    { nome: "Wilka", email: "wilka@clubedacota.com.br" },
    { nome: "Jordania", email: "jordania@clubedacota.com.br" },
    { nome: "Dina", email: "dina@clubedacota.com.br" },
    { nome: "Renan", email: "renan@clubedacota.com.br" },
    { nome: "Kate", email: "kate@clubedacota.com.br" },
    { nome: "Marcos Batista", email: criador.email, isCriador: true, id: criador.id },
    { nome: "Alline", email: "alline@clubedacota.com.br" },
    { nome: "Elias", email: "elias@clubedacota.com.br" },
    { nome: "Vânia", email: "vania@clubedacota.com.br" },
    { nome: "Ronaldo", email: "ronaldo@clubedacota.com.br" },
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
      console.log(`👤 Participante existente reaproveitado: ${user.name} (${user.email})`);
    }
    usuariosMap.set(p.nome, user);
  }

  // Idempotência: Se já existir consórcio anterior com o mesmo nome, remove antes
  const consorcioExistente = await prisma.consorcio.findFirst({
    where: { nome: "Amigos Secad 2026" },
  });
  if (consorcioExistente) {
    console.log(`⚠️ Removendo versão anterior de 'Amigos Secad 2026' para importação limpa...`);
    await prisma.consorcio.delete({ where: { id: consorcioExistente.id } });
  }

  // 3. Criar o Consórcio com os parâmetros confirmados
  const dataInicio = new Date("2026-02-28T00:00:00.000Z");
  const dataPrimeiroVencimento = new Date("2026-02-28T00:00:00.000Z");

  const consorcio = await prisma.consorcio.create({
    data: {
      nome: "Amigos Secad 2026",
      criadorId: criador.id,
      finalidade: "Consórcio entre amigos Secad 2026",
      regras: "Consórcio de 11 meses com valor fixo de R$ 1.000,00 por cota integral (R$ 500,00 na cota compartilhada). Vencimento no dia 28 de cada mês. Bolada total de R$ 11.000,00.",
      dataInicio: dataInicio,
      dataPrimeiroVencimento: dataPrimeiroVencimento,
      status: "ATIVO",
      frequencia: "MENSAL",
      modeloContribuicao: "FIXO",
      valorCota: 1000.0,
      valorAcrescimo: 0.0,
      valorTotalBolada: 11000.0,
      totalCotas: 11,
      tipoChavePix: criador.tipoChavePix || "CELULAR",
      chavePix: criador.chavePix || "11963030266",
    },
  });
  console.log(`🎉 Consórcio criado com sucesso: ${consorcio.nome} (ID: ${consorcio.id})`);

  // 4. Mapeamento das 11 Cotas e titulares
  // Ciclos 1 a 9 = Contempladas
  // Ciclos 10 e 11 = Ativas (pendentes)
  const cotasConfig = [
    { numero: 1, mes: "Fevereiro", titulares: [{ nome: "Thiago Leandro", percentual: 100.0, valor: 1000.0 }], ordem: 1, contemplada: true },
    { numero: 2, mes: "Março", titulares: [{ nome: "Ronne", percentual: 100.0, valor: 1000.0 }], ordem: 2, contemplada: true },
    { numero: 3, mes: "Abril", titulares: [{ nome: "Wilka", percentual: 100.0, valor: 1000.0 }], ordem: 3, contemplada: true },
    { numero: 4, mes: "Maio", titulares: [{ nome: "Jordania", percentual: 100.0, valor: 1000.0 }], ordem: 4, contemplada: true },
    { numero: 5, mes: "Junho", titulares: [{ nome: "Dina", percentual: 100.0, valor: 1000.0 }], ordem: 5, contemplada: true },
    { numero: 6, mes: "Julho", titulares: [{ nome: "Renan", percentual: 100.0, valor: 1000.0 }], ordem: 6, contemplada: true },
    {
      numero: 7,
      mes: "Agosto",
      isCompartilhada: true,
      titulares: [
        { nome: "Kate", percentual: 50.0, valor: 500.0 },
        { nome: "Marcos Batista", percentual: 50.0, valor: 500.0 },
      ],
      ordem: 7,
      contemplada: true,
    },
    { numero: 8, mes: "Setembro", titulares: [{ nome: "Alline", percentual: 100.0, valor: 1000.0 }], ordem: 8, contemplada: true },
    { numero: 9, mes: "Outubro", titulares: [{ nome: "Elias", percentual: 100.0, valor: 1000.0 }], ordem: 9, contemplada: true },
    { numero: 10, mes: "Novembro", titulares: [{ nome: "Vânia", percentual: 100.0, valor: 1000.0 }], ordem: 10, contemplada: false },
    { numero: 11, mes: "Dezembro", titulares: [{ nome: "Ronaldo", percentual: 100.0, valor: 1000.0 }], ordem: 11, contemplada: false },
  ];

  const cotasParticipantesCriadas = [];

  for (const c of cotasConfig) {
    const tokenAcessoCota = crypto.randomUUID();
    const cota = await prisma.cota.create({
      data: {
        consorcioId: consorcio.id,
        numero: c.numero,
        ordemSorteio: c.ordem,
        isCompartilhada: Boolean(c.isCompartilhada),
        status: c.contemplada ? "CONTEMPLADA" : "ATIVA",
        tokenAcesso: tokenAcessoCota,
      },
    });

    for (const tit of c.titulares) {
      const user = usuariosMap.get(tit.nome);
      if (!user) throw new Error(`Usuário ${tit.nome} não localizado no mapa.`);
      const tokenAcessoParticipante = crypto.randomUUID();

      await prisma.cotaParticipante.create({
        data: {
          cotaId: cota.id,
          usuarioId: user.id,
          percentual: tit.percentual,
          valorParcela: tit.valor,
          tokenAcesso: tokenAcessoParticipante,
        },
      });

      cotasParticipantesCriadas.push({
        cotaId: cota.id,
        cotaNumero: cota.numero,
        usuarioId: user.id,
        usuarioNome: user.name,
        percentual: tit.percentual,
        valorParcela: tit.valor,
      });
    }
  }

  console.log(`🎫 11 cotas registradas (incluindo cota 7 compartilhada entre Kate e Marcos Batista).`);

  // 5. Datas de vencimento oficiais: Dia 28 de cada mês de 2026
  const datasVencimento = [
    new Date("2026-02-28T00:00:00.000Z"),
    new Date("2026-03-28T00:00:00.000Z"),
    new Date("2026-04-28T00:00:00.000Z"),
    new Date("2026-05-28T00:00:00.000Z"),
    new Date("2026-06-28T00:00:00.000Z"),
    new Date("2026-07-28T00:00:00.000Z"),
    new Date("2026-08-28T00:00:00.000Z"),
    new Date("2026-09-28T00:00:00.000Z"),
    new Date("2026-10-28T00:00:00.000Z"),
    new Date("2026-11-28T00:00:00.000Z"),
    new Date("2026-12-28T00:00:00.000Z"),
  ];

  let totalContribuicoes = 0;
  let totalPagas = 0;
  let totalPendentes = 0;

  for (let ciclo = 1; ciclo <= 11; ciclo++) {
    const dataVenc = datasVencimento[ciclo - 1];
    const isCicloPassado = ciclo <= 9; // Fev a Out quitados

    for (const cp of cotasParticipantesCriadas) {
      await prisma.contribuicao.create({
        data: {
          consorcioId: consorcio.id,
          cotaId: cp.cotaId,
          usuarioId: cp.usuarioId,
          numeroCiclo: ciclo,
          valorPrevisto: cp.valorParcela,
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

  console.log(`💰 ${totalContribuicoes} parcelas geradas no total:`);
  console.log(`   - ${totalPagas} parcelas quitadas (Ciclos 1 a 9: Fev a Out)`);
  console.log(`   - ${totalPendentes} parcelas pendentes (Ciclos 10 e 11: Nov e Dez)`);

  // 6. Registro oficial de auditoria
  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: criador.id,
      tipoAcao: "CRIACAO_CONSORCIO",
      detalhes: `Consórcio "${consorcio.nome}" implantado com sucesso com 11 cotas e bolada de R$ 11.000,00. Cota 7 dividida entre Kate e Marcos Batista. Ciclos 1 a 9 quitados e Ciclos 10 e 11 abertos com vencimento no dia 28.`,
      justificativa: "Carga contábil oficial de consórcio em andamento transferido da lista Secad 2026.",
    },
  });

  console.log("\n🎉 Implantação do consórcio 'Amigos Secad 2026' concluída com 100% de sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro na importação:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
