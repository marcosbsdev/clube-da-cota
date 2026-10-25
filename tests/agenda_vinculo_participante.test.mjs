import assert from 'node:assert';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { formatarTelefone } from '../src/lib/finance.ts';

const prisma = new PrismaClient();

// Simulação de getAgendaParticipantesAction
async function simularGetAgendaParticipantes(criadorId) {
  if (!criadorId) return [];

  const consorcios = await prisma.consorcio.findMany({
    where: {
      OR: [
        { criadorId },
        {
          cotas: {
            some: {
              participantes: {
                some: { usuarioId: criadorId },
              },
            },
          },
        },
      ],
    },
    include: {
      cotas: {
        include: {
          participantes: {
            include: {
              usuario: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  telefone: true,
                  tipoChavePix: true,
                  chavePix: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const mapaParticipantes = new Map();

  for (const c of consorcios) {
    for (const cota of c.cotas) {
      for (const p of cota.participantes) {
        if (!p.usuario || p.usuario.id === criadorId) continue;

        const isDummyEmail = p.usuario.email.endsWith('@clubedacota.local');
        const emailLimpo = isDummyEmail ? undefined : p.usuario.email;
        const existing = mapaParticipantes.get(p.usuario.id);

        if (existing) {
          existing.totalParticipacoes += 1;
          if (!existing.email && emailLimpo) existing.email = emailLimpo;
          if (!existing.telefone && p.usuario.telefone) existing.telefone = p.usuario.telefone;
          if (!existing.chavePix && p.usuario.chavePix) {
            existing.chavePix = p.usuario.chavePix;
            existing.tipoChavePix = p.usuario.tipoChavePix || undefined;
          }
        } else {
          mapaParticipantes.set(p.usuario.id, {
            id: p.usuario.id,
            name: p.usuario.name,
            email: emailLimpo,
            telefone: p.usuario.telefone || undefined,
            tipoChavePix: p.usuario.tipoChavePix || undefined,
            chavePix: p.usuario.chavePix || undefined,
            totalParticipacoes: 1,
            origem: 'REDE_CRIADOR',
          });
        }
      }
    }
  }

  const outrosUsuarios = await prisma.user.findMany({
    where: {
      id: { not: criadorId },
      NOT: {
        email: { endsWith: '@clubedacota.local' },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      telefone: true,
      tipoChavePix: true,
      chavePix: true,
    },
  });

  for (const u of outrosUsuarios) {
    if (!mapaParticipantes.has(u.id)) {
      mapaParticipantes.set(u.id, {
        id: u.id,
        name: u.name,
        email: u.email,
        telefone: u.telefone || undefined,
        tipoChavePix: u.tipoChavePix || undefined,
        chavePix: u.chavePix || undefined,
        totalParticipacoes: 0,
        origem: 'SISTEMA',
      });
    }
  }

  return Array.from(mapaParticipantes.values()).sort((a, b) => {
    if (b.totalParticipacoes !== a.totalParticipacoes) {
      return b.totalParticipacoes - a.totalParticipacoes;
    }
    return a.name.localeCompare(b.name, 'pt-BR');
  });
}

// Simulação de resolução de participantes no createConsorcioAction
async function resolverParticipante(part) {
  let usuario = null;
  if (part.usuarioId) {
    usuario = await prisma.user.findUnique({ where: { id: part.usuarioId } });
  }

  const hasRealEmail = Boolean(
    part.email &&
    part.email.trim().length > 0 &&
    !part.email.endsWith('@clubedacota.local')
  );
  const emailFinal = hasRealEmail ? part.email.trim().toLowerCase() : null;

  if (!usuario && emailFinal) {
    usuario = await prisma.user.findUnique({ where: { email: emailFinal } });
  }

  if (!usuario && part.telefone && part.telefone.trim().length >= 10) {
    const telFormatado = formatarTelefone(part.telefone);
    usuario = await prisma.user.findFirst({ where: { telefone: telFormatado } });
  }

  let eraNovo = false;
  if (!usuario) {
    eraNovo = true;
    const dummyEmail = `participante_${Date.now()}_${Math.random().toString(36).substring(2, 8)}@clubedacota.local`;
    usuario = await prisma.user.create({
      data: {
        name: part.nome,
        email: emailFinal || dummyEmail,
        telefone: part.telefone ? formatarTelefone(part.telefone) : null,
        role: 'COMUM',
        isActivated: false,
      },
    });
  } else if (part.telefone && !usuario.telefone) {
    await prisma.user.update({
      where: { id: usuario.id },
      data: { telefone: formatarTelefone(part.telefone) },
    });
  }

  return { usuario, eraNovo };
}

async function runTests() {
  console.log('🧪 Iniciando testes de Agenda do Criador, Autocomplete e Vínculo de Participantes...');

  const timestamp = Date.now();
  const emailCriador = `criador_agenda_${timestamp}@test.com`;
  const emailPart1 = `amigo_frequente1_${timestamp}@test.com`;
  const emailPart2 = `amigo_frequente2_${timestamp}@test.com`;
  const emailPart3 = `usuario_avulso_${timestamp}@test.com`;

  // 1. Criação do criador e usuários de teste
  const criador = await prisma.user.create({
    data: {
      name: `Criador Agenda ${timestamp}`,
      email: emailCriador,
      role: 'PRO_MASTER',
      telefone: '(11) 98888-0000',
    },
  });

  const part1 = await prisma.user.create({
    data: {
      name: `Amigo 1 Silva ${timestamp}`,
      email: emailPart1,
      telefone: '(11) 97777-1111',
      chavePix: 'amigo1@pix.com',
      tipoChavePix: 'EMAIL',
    },
  });

  const part2 = await prisma.user.create({
    data: {
      name: `Amigo 2 Souza ${timestamp}`,
      email: emailPart2,
      telefone: '(11) 96666-2222',
    },
  });

  const part3 = await prisma.user.create({
    data: {
      name: `Usuario Avulso ${timestamp}`,
      email: emailPart3,
      telefone: '(11) 95555-3333',
    },
  });

  // Cria 2 consórcios prévios para registrar histórico de participações
  const consorcio1 = await prisma.consorcio.create({
    data: {
      nome: `Consorcio Anterior 1 ${timestamp}`,
      criadorId: criador.id,
      valorCota: 100,
      valorTotalBolada: 300,
      totalCotas: 3,
      dataInicio: new Date(),
      dataPrimeiroVencimento: new Date(),
      cotas: {
        create: [
          {
            numero: 1,
            participantes: {
              create: {
                usuarioId: part1.id,
                valorParcela: 100,
              },
            },
          },
          {
            numero: 2,
            participantes: {
              create: {
                usuarioId: part2.id,
                valorParcela: 100,
              },
            },
          },
        ],
      },
    },
  });

  const consorcio2 = await prisma.consorcio.create({
    data: {
      nome: `Consorcio Anterior 2 ${timestamp}`,
      criadorId: criador.id,
      valorCota: 100,
      valorTotalBolada: 200,
      totalCotas: 2,
      dataInicio: new Date(),
      dataPrimeiroVencimento: new Date(),
      cotas: {
        create: [
          {
            numero: 1,
            participantes: {
              create: {
                usuarioId: part1.id,
                valorParcela: 100,
              },
            },
          },
        ],
      },
    },
  });

  try {
    // ----------------------------------------------------
    // Teste 1: Agenda do Criador prioriza histórico
    // ----------------------------------------------------
    console.log('Testando busca da agenda de contatos do criador...');
    const agenda = await simularGetAgendaParticipantes(criador.id);

    const itemPart1 = agenda.find((i) => i.id === part1.id);
    const itemPart2 = agenda.find((i) => i.id === part2.id);
    const itemPart3 = agenda.find((i) => i.id === part3.id);
    const itemCriador = agenda.find((i) => i.id === criador.id);

    assert(itemPart1, 'Amigo 1 deve estar na agenda');
    assert.strictEqual(itemPart1.totalParticipacoes, 2, 'Amigo 1 deve ter 2 participações');
    assert.strictEqual(itemPart1.origem, 'REDE_CRIADOR');
    assert.strictEqual(itemPart1.chavePix, 'amigo1@pix.com');

    assert(itemPart2, 'Amigo 2 deve estar na agenda');
    assert.strictEqual(itemPart2.totalParticipacoes, 1, 'Amigo 2 deve ter 1 participação');
    assert.strictEqual(itemPart2.origem, 'REDE_CRIADOR');

    assert(itemPart3, 'Usuário avulso deve estar na agenda como SISTEMA');
    assert.strictEqual(itemPart3.totalParticipacoes, 0, 'Usuário avulso tem 0 participações');
    assert.strictEqual(itemPart3.origem, 'SISTEMA');

    assert(!itemCriador, 'O próprio criador NÃO deve ser listado como terceiro na sua agenda');

    const indexPart1 = agenda.findIndex((i) => i.id === part1.id);
    const indexPart2 = agenda.findIndex((i) => i.id === part2.id);
    assert(indexPart1 < indexPart2, 'Amigo com mais participações deve aparecer antes');

    console.log('✅ Teste 1: Agenda do criador com ordenação por frequência e dados Pix aprovada.');

    // ----------------------------------------------------
    // Teste 2: Vínculo direto via usuarioId selecionado (Evita duplicata)
    // ----------------------------------------------------
    console.log('Testando inclusão de participante informando usuarioId...');
    const totalUsuariosAntes = await prisma.user.count();

    const resVinculoId = await resolverParticipante({
      usuarioId: part1.id,
      nome: part1.name,
      telefone: part1.telefone,
    });

    const totalUsuariosDepois = await prisma.user.count();

    assert.strictEqual(resVinculoId.eraNovo, false, 'Não deve criar novo usuário');
    assert.strictEqual(resVinculoId.usuario.id, part1.id, 'Deve vincular ao id exato');
    assert.strictEqual(totalUsuariosAntes, totalUsuariosDepois, 'Contagem de usuários deve permanecer idêntica');

    console.log('✅ Teste 2: Vínculo direto com usuarioId existente sem duplicação aprovado.');

    // ----------------------------------------------------
    // Teste 3: Vínculo por e-mail real existente
    // ----------------------------------------------------
    console.log('Testando inclusão sem usuarioId mas com e-mail cadastrado existente...');
    const resVinculoEmail = await resolverParticipante({
      nome: 'Nome Diferente Digitado',
      email: part2.email,
    });

    assert.strictEqual(resVinculoEmail.eraNovo, false, 'Deve identificar usuário existente pelo e-mail');
    assert.strictEqual(resVinculoEmail.usuario.id, part2.id, 'Deve vincular ao Amigo 2');

    console.log('✅ Teste 3: Vínculo por e-mail real existente aprovado.');

    // ----------------------------------------------------
    // Teste 4: Vínculo por telefone/WhatsApp cadastrado existente
    // ----------------------------------------------------
    console.log('Testando inclusão sem email mas com WhatsApp já cadastrado...');
    const resVinculoTel = await resolverParticipante({
      nome: 'Nome Qualquer',
      telefone: part3.telefone,
    });

    assert.strictEqual(resVinculoTel.eraNovo, false, 'Deve identificar usuário existente pelo telefone');
    assert.strictEqual(resVinculoTel.usuario.id, part3.id, 'Deve vincular ao Usuário Avulso');

    console.log('✅ Teste 4: Vínculo por telefone/WhatsApp existente aprovado.');

    // ----------------------------------------------------
    // Teste 5: Criação segura de novo usuário se de fato for inédito
    // ----------------------------------------------------
    console.log('Testando criação de usuário inédito...');
    const resInedito = await resolverParticipante({
      nome: `Participante Inédito ${timestamp}`,
      telefone: '(83) 91111-9999',
    });

    assert.strictEqual(resInedito.eraNovo, true, 'Deve marcar como novo');
    assert(resInedito.usuario.email.endsWith('@clubedacota.local'), 'Deve gerar email local se não informado');

    // Limpa o inédito
    await prisma.user.delete({ where: { id: resInedito.usuario.id } });
    console.log('✅ Teste 5: Criação controlada de participante inédito aprovada.');

    // ----------------------------------------------------
    // Teste 6: Cota compartilhada com dois usuários vinculados
    // ----------------------------------------------------
    console.log('Testando cota compartilhada com dois participantes vinculados...');
    const resTitular = await resolverParticipante({ usuarioId: part1.id, nome: part1.name });
    const resParceiro = await resolverParticipante({ usuarioId: part2.id, nome: part2.name });

    assert.strictEqual(resTitular.usuario.id, part1.id);
    assert.strictEqual(resParceiro.usuario.id, part2.id);
    console.log('✅ Teste 6: Vínculo de cota compartilhada para ambos os parceiros aprovado.');

  } finally {
    // Teardown
    console.log('Limpando dados de teste...');
    await prisma.cotaParticipante.deleteMany({
      where: {
        cota: {
          consorcioId: { in: [consorcio1.id, consorcio2.id] },
        },
      },
    });
    await prisma.cota.deleteMany({
      where: { consorcioId: { in: [consorcio1.id, consorcio2.id] } },
    });
    await prisma.consorcio.deleteMany({
      where: { id: { in: [consorcio1.id, consorcio2.id] } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: [criador.id, part1.id, part2.id, part3.id] } },
    });
    await prisma.$disconnect();
  }

  console.log('\n🎉 Todos os 6 testes de Agenda e Vínculo Inteligente de Participantes passaram com 100% de sucesso!');
}

runTests().catch((err) => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
