import assert from "node:assert";
import { determinarDestinatarioPixParcela } from "../src/lib/finance.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

console.log("🧪 Iniciando testes de Resolução Dinâmica de Chave PIX da Parcela...");

// Cenário 1: Contemplado do mês marcou que quer receber PIX direto e tem chave cadastrada
const mockConsorcio = {
  id: "consorcio-1",
  nome: "Consórcio dos Amigos",
  criadorNome: "Organizador Central",
  chavePix: "11999990000",
  tipoChavePix: "CELULAR",
  dadosBancarios: "Banco 001 Ag 0001 CC 12345-6",
  cotas: [
    {
      id: "cota-1",
      numero: 1,
      ordemSorteio: 1,
      status: "CONTEMPLADA",
      participantes: [
        {
          id: "part-1",
          usuarioId: "user-contemplado-1",
          usuario: {
            id: "user-contemplado-1",
            name: "Lucas Silva",
            receberPixDireto: true,
            chavePix: "lucas@email.com",
            tipoChavePix: "EMAIL",
          },
        },
      ],
    },
    {
      id: "cota-2",
      numero: 2,
      ordemSorteio: 2,
      status: "ATIVA",
      participantes: [
        {
          id: "part-2",
          usuarioId: "user-sem-pix-direto",
          usuario: {
            id: "user-sem-pix-direto",
            name: "Carlos Eduardo",
            receberPixDireto: false,
            chavePix: null,
            tipoChavePix: null,
          },
        },
      ],
    },
    {
      id: "cota-3",
      numero: 3,
      ordemSorteio: 3,
      status: "ATIVA",
      participantes: [
        {
          id: "part-3",
          name: "Participante Sem Cadastro",
          usuarioId: "guest-id",
          usuario: null, // Sem conta cadastrada
        },
      ],
    },
    {
      id: "cota-4",
      numero: 4,
      ordemSorteio: 4,
      status: "ATIVA",
      participantes: [
        {
          id: "part-4",
          usuarioId: "user-chave-vazia",
          usuario: {
            id: "user-chave-vazia",
            name: "Ana Paula",
            receberPixDireto: true,
            chavePix: "   ", // Chave vazia ou em branco
            tipoChavePix: "CPF_CNPJ",
          },
        },
      ],
    },
  ],
};

// Teste 1: Contemplado com receberPixDireto = true e chave válida
console.log("Testando contemplado com PIX direto ativado...");
const res1 = determinarDestinatarioPixParcela({
  consorcio: mockConsorcio,
  proximaContribuicao: { numeroCiclo: 1, valorPrevisto: 100 },
  currentUserId: "outro-usuario",
});
assert.strictEqual(res1.modo, "DIRETO_CONTEMPLADO", "Deveria ser modo DIRETO_CONTEMPLADO");
assert.strictEqual(res1.chavePix, "lucas@email.com", "Chave Pix deveria ser a de Lucas");
assert.strictEqual(res1.nomeDestinatario, "Lucas Silva", "Destinatário deveria ser Lucas Silva");
assert.strictEqual(res1.contempladoDesejaPixDireto, true, "contempladoDesejaPixDireto deve ser true");
assert.strictEqual(res1.souEuOContemplado, false, "souEuOContemplado deve ser false");
console.log("✅ Teste 1: Contemplado com PIX direto ativado aprovado com sucesso.");

// Teste 2: Contemplado com receberPixDireto = false -> Pix do Consórcio
console.log("Testando contemplado com receberPixDireto = false...");
const res2 = determinarDestinatarioPixParcela({
  consorcio: mockConsorcio,
  proximaContribuicao: { numeroCiclo: 2, valorPrevisto: 105 },
  currentUserId: "outro-usuario",
});
assert.strictEqual(res2.modo, "CONSORCIO_CENTRALIZADO", "Deveria ser modo CONSORCIO_CENTRALIZADO");
assert.strictEqual(res2.chavePix, "11999990000", "Chave Pix deve ser a do Consórcio");
assert.strictEqual(res2.nomeDestinatario, "Organizador Central", "Destinatário deve ser o organizador");
assert.strictEqual(res2.contempladoDesejaPixDireto, false, "contempladoDesejaPixDireto deve ser false");
console.log("✅ Teste 2: Contemplado com receberPixDireto desativado direciona para o consórcio com sucesso.");

// Teste 3: Contemplado sem cadastro de usuário (usuario = null) -> Pix do Consórcio
console.log("Testando contemplado sem cadastro de usuário no sistema...");
const res3 = determinarDestinatarioPixParcela({
  consorcio: mockConsorcio,
  proximaContribuicao: { numeroCiclo: 3, valorPrevisto: 110 },
  currentUserId: "outro-usuario",
});
assert.strictEqual(res3.modo, "CONSORCIO_CENTRALIZADO", "Deveria ser modo CONSORCIO_CENTRALIZADO");
assert.strictEqual(res3.chavePix, "11999990000", "Chave Pix deve ser a do Consórcio");
assert.strictEqual(res3.contempladoDesejaPixDireto, false, "contempladoDesejaPixDireto deve ser false");
console.log("✅ Teste 3: Contemplado sem cadastro de usuário direciona para o consórcio com sucesso.");

// Teste 4: Contemplado com flag ativada mas chave em branco -> Pix do Consórcio
console.log("Testando contemplado com chave Pix em branco/inválida...");
const res4 = determinarDestinatarioPixParcela({
  consorcio: mockConsorcio,
  proximaContribuicao: { numeroCiclo: 4, valorPrevisto: 115 },
  currentUserId: "outro-usuario",
});
assert.strictEqual(res4.modo, "CONSORCIO_CENTRALIZADO", "Deveria ser modo CONSORCIO_CENTRALIZADO");
assert.strictEqual(res4.chavePix, "11999990000", "Chave Pix deve cair no consórcio");
assert.strictEqual(res4.contempladoDesejaPixDireto, false, "contempladoDesejaPixDireto deve ser false");
console.log("✅ Teste 4: Chave Pix em branco cai em fallback seguro no consórcio com sucesso.");

// Teste 5: O próprio participante logado é o contemplado que ativou Pix Direto
console.log("Testando cenário onde o usuário logado é o próprio contemplado recebedor...");
const res5 = determinarDestinatarioPixParcela({
  consorcio: mockConsorcio,
  proximaContribuicao: { numeroCiclo: 1, valorPrevisto: 100 },
  currentUserId: "user-contemplado-1",
});
assert.strictEqual(res5.modo, "PROPRIO_CONTEMPLADO_RECEBEDOR", "Deveria ser PROPRIO_CONTEMPLADO_RECEBEDOR");
assert.strictEqual(res5.souEuOContemplado, true, "souEuOContemplado deve ser true");
assert.strictEqual(res5.contempladoDesejaPixDireto, true, "contempladoDesejaPixDireto deve ser true");
assert.strictEqual(res5.chavePix, "lucas@email.com", "Chave deve ser a do próprio usuário");
console.log("✅ Teste 5: Usuário contemplado recebedor identificado com sucesso.");

// Teste 6: Validação real no banco de dados com 'Amigos do Pau Darco 2026'
console.log("Testando validação no banco de dados real com 'Amigos do Pau Darco 2026'...");
const consorcioBanco = await prisma.consorcio.findFirst({
  where: { nome: "Amigos do Pau Darco 2026" },
  include: {
    criador: true,
    cotas: {
      include: {
        participantes: {
          include: { usuario: true },
        },
      },
      orderBy: { ordemSorteio: "asc" },
    },
  },
});

if (consorcioBanco) {
  // Ciclo 2: Patrick Guedes (receberPixDireto = false) -> Consórcio Centralizado
  const resCiclo2 = determinarDestinatarioPixParcela({
    consorcio: consorcioBanco,
    proximaContribuicao: { numeroCiclo: 2, valorPrevisto: 105 },
    currentUserId: consorcioBanco.criadorId,
  });
  assert.strictEqual(
    resCiclo2.modo,
    "CONSORCIO_CENTRALIZADO",
    "Ciclo 2 (Patrick Guedes) deve ser CONSORCIO_CENTRALIZADO porque não marcou receberPixDireto"
  );
  assert.strictEqual(
    resCiclo2.chavePix,
    "11963030266",
    "Chave Pix no Ciclo 2 deve ser a do Consórcio (11963030266)"
  );
  console.log("✅ Teste 6.1: Ciclo 2 (Patrick Guedes) exibe corretamente o Pix do Consórcio.");

  // Ciclo 9: Fábio Junior (marcou Pix direto e tem chave "11999887766")
  const resCiclo9 = determinarDestinatarioPixParcela({
    consorcio: consorcioBanco,
    proximaContribuicao: { numeroCiclo: 9, valorPrevisto: 140 },
    currentUserId: consorcioBanco.criadorId,
  });
  assert.strictEqual(
    resCiclo9.modo,
    "DIRETO_CONTEMPLADO",
    "Ciclo 9 (Fábio Junior) deve ser DIRETO_CONTEMPLADO"
  );
  assert.strictEqual(
    resCiclo9.chavePix,
    "11999887766",
    "Chave Pix no Ciclo 9 deve ser a de Fábio Junior (11999887766)"
  );
  assert.strictEqual(
    resCiclo9.nomeDestinatario,
    "Fábio Junior",
    "Nome no Ciclo 9 deve ser Fábio Junior"
  );
  console.log("✅ Teste 6.2: Ciclo 9 (Fábio Junior) exibe corretamente o Pix Direto de Fábio Junior.");

  // Ciclo 10: Marlucio Gago (marcou Pix direto "gago@gmail.com")
  const marlucio = await prisma.user.findFirst({ where: { name: { contains: "Marlucio" } } });
  if (marlucio && marlucio.receberPixDireto) {
    const resCiclo10Outro = determinarDestinatarioPixParcela({
      consorcio: consorcioBanco,
      proximaContribuicao: { numeroCiclo: 10, valorPrevisto: 145 },
      currentUserId: consorcioBanco.criadorId,
    });
    assert.strictEqual(resCiclo10Outro.modo, "DIRETO_CONTEMPLADO", "Ciclo 10 deve ser DIRETO_CONTEMPLADO para terceiros");
    assert.strictEqual(resCiclo10Outro.chavePix, marlucio.chavePix, "Chave Pix deve ser a de Marlucio");

    const resCiclo10Marlucio = determinarDestinatarioPixParcela({
      consorcio: consorcioBanco,
      proximaContribuicao: { numeroCiclo: 10, valorPrevisto: 145 },
      currentUserId: marlucio.id,
    });
    assert.strictEqual(resCiclo10Marlucio.modo, "PROPRIO_CONTEMPLADO_RECEBEDOR", "Marlucio deve ser identificado como recebedor");
    console.log("✅ Teste 6.3: Ciclo 10 (Marlucio Gago) validado com sucesso para pagador e recebedor.");
  }
}

await prisma.$disconnect();

console.log("\n🎉 Todos os testes de Resolução de Chave PIX do Participante passaram com 100% de sucesso!");

console.log("\n🎉 Todos os testes de Resolução de Chave PIX do Participante passaram com 100% de sucesso!");
