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
  console.log("Registrando correção matemática da Bolada por Ciclo de Contemplação no Notion...");

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
            text: { content: '🎯 Correção Matemática: Cálculo Preciso da Bolada por Ciclo de Contemplação' }
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
              content: 'Corrigida uma discrepância conceitual entre o "Volume Total Movimentado pelo Consórcio" e a "Bolada Individual por Ciclo de Contemplação" no Portal do Participante e no Dashboard do Criador:'
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
              content: 'Portal do Participante (/participante/[token]): O card "Sua Contemplação (Bolada)" exibia indevidamente a arrecadação global somada de todos os meses do grupo (ex: R$ 52.875,00). Agora calcula dinamicamente o valor real entregue no ciclo específico de sorteio daquela cota (ex: R$ 3.000,00 no Ciclo #1) e aplica proporcionalidade exata para cotas compartilhadas.'
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
              content: 'Visão do Criador (CriadorView.tsx): Na lista ordenada de contemplação, cada ciclo agora reflete com fidelidade a bolada correspondente àquele mês (considerando o acréscimo progressivo ciclo a ciclo). No card principal do dashboard, a métrica de bolada exibe a faixa real (ex: R$ 3.000 a R$ 4.050).'
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
              content: 'Status: 100% validado pelo usuário em ambiente de desenvolvimento. 36/36 testes automatizados aprovados com sucesso.'
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
    console.log("✅ Notion atualizado com sucesso!");
  } catch (err) {
    console.error("❌ Falha ao atualizar o Notion:", err);
    process.exit(1);
  }
}

run();
