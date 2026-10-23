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
  console.log("Registrando Mês de Contemplação, Cálculo de Lucro e Ajustes Visuais no Notion...");

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
            text: { content: '🚀 Mês de Contemplação, Lucro Progressivo e Ajustes das Telas de Gestão e Participante' }
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
              content: 'Implementadas melhorias de transparência financeira no Portal do Participante e refinamentos de precisão visual nas páginas "Meu Consórcio" e "Gestão do Grupo":'
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
              content: 'Previsão Clara de Contemplação (/participante/[token]): Exibição em destaque do mês/ano por extenso (ex: "Outubro de 2026") e data exata prevista ou realizada, utilizando função imune a desvios de fuso horário (formatarMesEAnoSeguro).'
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
              content: 'Cálculo de Lucro da Espera: Para consórcios com acréscimo progressivo, calcula e exibe badge verde com o ganho financeiro em relação à bolada inicial do 1º ciclo (ex: "+R$ 1.050,00 (+35% de lucro)" no 15º ciclo) acompanhado de explicação didática.'
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
              content: 'Meu Consórcio (ParticipanteView.tsx): Correção do badge "Sua Participação", que agora exibe a quantidade real de cotas do usuário logado (ex: "4 cotas (15 no grupo)") em vez de apenas o total do grupo.'
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
              content: 'Gestão do Grupo (CriadorView.tsx): Ajuste de CSS (whitespace-nowrap e tipografia destacada) na listagem da ordem de contemplação para evitar que o valor da bolada sofresse cortes com reticências (exibindo "Ciclo 1 • Bolada: R$ 3.000,00" completo).'
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
              content: 'Status: Validado e homologado pelo usuário localmente. 37/37 testes automatizados aprovados (TypeScript 0 erros).'
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
    const res = await appendToNotion(updateBlocks);
    console.log("✅ Atualização registrada no Notion com sucesso!", res.results?.length, "blocos criados.");
  } catch (err) {
    console.error("❌ Erro ao atualizar o Notion:", err.message);
    process.exit(1);
  }
}

run();
