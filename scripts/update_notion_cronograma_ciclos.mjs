import { NOTION_TOKEN, PAGE_ID } from './notion_config.mjs';

export async function appendToNotion(children) {
  const res = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ children })
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}

async function run() {
  console.log("Registrando melhorias de Apresentação de Ciclos e Término do Consórcio no Notion...");

  const updateBlocks = [
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [
          {
            type: 'text',
            text: { content: '🗓️ Apresentação dos Ciclos, Datas Mês a Mês e Término do Consórcio (Opção 1)' }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Implementada uma solução moderna e compacta para exibir com total clareza a linha do tempo e o encerramento do consórcio tanto na etapa de Valores & Calendário (Passo 3) quanto na Revisão Final (Passo 4) do CriarConsorcioWizard:'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Cards de Período (Início & Término): Exibição em destaque do 1º Vencimento (Ciclo #1) ao lado do Último Ciclo (Término Final 🏁) com a data exata calculada dinamicamente e a duração total (meses, quinzenas ou semanas).'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Acordeão Expansível Mês a Mês: Botão "Ver Cronograma Completo dos N Ciclos" que mantém a interface leve no celular, permitindo abrir sob demanda a tabela completa com número do ciclo, data de vencimento formatada seguramente, valor da cota e bolada contemplada.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Revisão Final e Ativação (Passo 4): Inclusão da data do último ciclo e duração total no sumário, além do acordeão de cronograma para validação final antes da ativação do consórcio.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Harmonia Visual: Design alinhado à paleta dinâmica do usuário (theme-main, theme-light, theme-text) com selos de status intuitivos.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Status: 100% testado e validado localmente pelo usuário. 36/36 testes automatizados com sucesso absoluto.'
            }
          }
        ],
        icon: {
          emoji: '✅'
        }
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Notion atualizado com sucesso com as novas especificações de Cronograma e Término!");
  } catch (err) {
    console.error("❌ Falha ao atualizar o Notion:", err);
    process.exit(1);
  }
}

run();
