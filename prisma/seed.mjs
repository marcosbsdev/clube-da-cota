import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do Clube da Cota...");

  // Limpa registros anteriores se houver
  await prisma.auditoriaLog.deleteMany({});
  await prisma.comprovante.deleteMany({});
  await prisma.contribuicao.deleteMany({});
  await prisma.cotaParticipante.deleteMany({});
  await prisma.cota.deleteMany({});
  await prisma.consorcio.deleteMany({});
  await prisma.user.deleteMany({});

  const passwordHash = await bcrypt.hash("123456", 10);

  // 1. Super Admin Inicial (Marcos Batista conforme especificação)
  const marcos = await prisma.user.create({
    data: {
      name: "Marcos Batista",
      email: "markos.system@gmail.com",
      passwordHash,
      role: "SUPER_ADMIN",
      preferredTheme: "blue", // Azul como padrão
      isActivated: true,
    },
  });

  // 2. Criando outros participantes do exemplo da especificação
  const fabio = await prisma.user.create({
    data: {
      name: "Fábio Augusto",
      email: "fabio@exemplo.com",
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  const patrick = await prisma.user.create({
    data: {
      name: "Patrick Dias",
      email: "patrick@exemplo.com",
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  const josivan = await prisma.user.create({
    data: {
      name: "Josivan Costa",
      email: "josivan@exemplo.com",
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  const elion = await prisma.user.create({
    data: {
      name: "Elion Santos",
      email: "elion@exemplo.com",
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  const lucas = await prisma.user.create({
    data: {
      name: "Lucas Silveira",
      email: "lucas@exemplo.com",
      passwordHash,
      role: "COMUM",
      preferredTheme: "blue",
      isActivated: true,
    },
  });

  console.log("Usuários criados com sucesso.");

  // 3. Criando Consórcio de Exemplo (Família & Amigos 2026)
  const dataInicio = new Date("2026-10-01");
  const dataPrimeiroVencimento = new Date("2026-10-15");

  const consorcio = await prisma.consorcio.create({
    data: {
      nome: "Consórcio Família & Amigos 2026",
      finalidade: "Poupança coletiva para férias e projetos pessoais",
      regras: "Contribuições mensais até dia 15. Comprovantes via Pix.",
      dataInicio,
      dataPrimeiroVencimento,
      frequencia: "MENSAL",
      valorCota: 500.0,
      valorTotalBolada: 5000.0,
      totalCotas: 10,
      criadorId: marcos.id,
      chavePix: "markos.system@gmail.com",
      dadosBancarios: "Banco do Brasil - Ag 1234-5 Conta 98765-4",
    },
  });

  // 4. Criação das Cotas
  // Cota 1: Fábio (100%)
  const cota1 = await prisma.cota.create({
    data: { consorcioId: consorcio.id, numero: 1, isCompartilhada: false },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota1.id, usuarioId: fabio.id, percentual: 100.0, valorParcela: 500.0 },
  });

  // Cota 2: Marcos (100%)
  const cota2 = await prisma.cota.create({
    data: { consorcioId: consorcio.id, numero: 2, isCompartilhada: false },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota2.id, usuarioId: marcos.id, percentual: 100.0, valorParcela: 500.0 },
  });

  // Cota 3: Compartilhada (Patrick 50% + Josivan 50%) - Exemplo do PDF!
  const cota3 = await prisma.cota.create({
    data: { consorcioId: consorcio.id, numero: 3, isCompartilhada: true },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota3.id, usuarioId: patrick.id, percentual: 50.0, valorParcela: 250.0 },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota3.id, usuarioId: josivan.id, percentual: 50.0, valorParcela: 250.0 },
  });

  // Cota 4: Elion (100%)
  const cota4 = await prisma.cota.create({
    data: { consorcioId: consorcio.id, numero: 4, isCompartilhada: false },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota4.id, usuarioId: elion.id, percentual: 100.0, valorParcela: 500.0 },
  });

  // Cota 5: Lucas (100%)
  const cota5 = await prisma.cota.create({
    data: { consorcioId: consorcio.id, numero: 5, isCompartilhada: false },
  });
  await prisma.cotaParticipante.create({
    data: { cotaId: cota5.id, usuarioId: lucas.id, percentual: 100.0, valorParcela: 500.0 },
  });

  console.log("Cotas e participantes vinculados.");

  // 5. Gerando contribuições do 1º Ciclo (Outubro/2026)
  const vencimentoCiclo1 = new Date("2026-10-15");

  // Fábio: Pago
  await prisma.contribuicao.create({
    data: {
      consorcioId: consorcio.id,
      cotaId: cota1.id,
      usuarioId: fabio.id,
      numeroCiclo: 1,
      valorPrevisto: 500.0,
      dataVencimento: vencimentoCiclo1,
      status: "PAGO",
      dataPagamento: new Date("2026-10-14"),
      responsavelAlteracaoId: marcos.id,
    },
  });

  // Marcos: Pendente no prazo (ou pago)
  await prisma.contribuicao.create({
    data: {
      consorcioId: consorcio.id,
      cotaId: cota2.id,
      usuarioId: marcos.id,
      numeroCiclo: 1,
      valorPrevisto: 500.0,
      dataVencimento: new Date("2026-11-15"),
      status: "PENDENTE",
    },
  });

  // Cota 3 Compartilhada: Patrick pagou sua metade
  await prisma.contribuicao.create({
    data: {
      consorcioId: consorcio.id,
      cotaId: cota3.id,
      usuarioId: patrick.id,
      numeroCiclo: 1,
      valorPrevisto: 250.0,
      dataVencimento: vencimentoCiclo1,
      status: "PAGO",
      dataPagamento: new Date("2026-10-15"),
      responsavelAlteracaoId: marcos.id,
    },
  });

  // Josivan: cota compartilhada pendente
  await prisma.contribuicao.create({
    data: {
      consorcioId: consorcio.id,
      cotaId: cota3.id,
      usuarioId: josivan.id,
      numeroCiclo: 1,
      valorPrevisto: 250.0,
      dataVencimento: vencimentoCiclo1,
      status: "EM_ATRASO",
    },
  });

  // Lucas: Em atraso com comprovante enviado aguardando análise
  const contribLucas = await prisma.contribuicao.create({
    data: {
      consorcioId: consorcio.id,
      cotaId: cota5.id,
      usuarioId: lucas.id,
      numeroCiclo: 1,
      valorPrevisto: 500.0,
      dataVencimento: vencimentoCiclo1,
      status: "PENDENTE",
    },
  });

  await prisma.comprovante.create({
    data: {
      contribuicaoId: contribLucas.id,
      usuarioId: lucas.id,
      arquivoUrl: "/uploads/comprovante_lucas_out2026.pdf",
      arquivoNome: "comprovante_pix_outubro.pdf",
      tamanhoBytes: 245000,
      mimeType: "application/pdf",
      status: "PENDENTE",
    },
  });

  // Registro de Auditoria Inicial
  await prisma.auditoriaLog.create({
    data: {
      consorcioId: consorcio.id,
      usuarioResponsavelId: marcos.id,
      tipoAcao: "CRIACAO_CONSORCIO",
      detalhes: "Consórcio criado com 10 cotas e ativação imediata.",
      justificativa: "Implantação inicial do grupo.",
    },
  });

  console.log("Seed concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
