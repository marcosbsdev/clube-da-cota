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
  console.log("Registrando mÃ³dulo de multiconsÃ³rcios no Notion...");

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
            text: { content: 'ðŸ“‚ VisÃ£o MulticonsÃ³rcios e Central de GestÃ£o do Administrador' }
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
              content: 'Implementada a arquitetura e interface multiconsÃ³rcios, permitindo que administradores visualizem todos os seus grupos e escolham em qual entrar para ver seus respectivos dashboards:'
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
          { type: 'text', text: { content: 'Central "Meus ConsÃ³rcios Administrados": ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Painel em cards detalhados exibindo todos os consÃ³rcios gerenciados pelo usuÃ¡rio, com status (Ativo), quantidade de cotas, valor da cota, bolada prevista, nÃºmero de membros e barra visual de arrecadaÃ§Ã£o.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Acesso Direto ao Dashboard EspecÃ­fico: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Cada card possui o botÃ£o "Entrar no Dashboard â†’", carregando instantaneamente os 4 KPIs exclusivos, comprovantes pendentes, tabela de parcelas e histÃ³rico de auditoria daquele consÃ³rcio.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Barra de ConsÃ³rcio Ativo e AlternÃ¢ncia RÃ¡pida: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'No topo da aba de GestÃ£o, Ã© informado com clareza o consÃ³rcio atual em operaÃ§Ã£o, com botÃ£o para retornar a "Meus ConsÃ³rcios" e menu dropdown "Trocar" para alternar entre grupos em um Ãºnico toque.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Seletor Global no Header (Mobile & Desktop): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'No cabeÃ§alho superior, ao lado da logo, o consÃ³rcio ativo Ã© exibido com badge de contagem de grupos e abre modal interativo para rÃ¡pida navegaÃ§Ã£o entre grupos de qualquer pÃ¡gina.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Backend DinÃ¢mico: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'A Server Action getConsorcioData agora suporta consulta parametrizada por consorcioId e compila a lista todosConsorcios com cÃ¡lculo individual de arrecadaÃ§Ã£o e participantes.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… VisÃ£o multiconsÃ³rcios documentada com sucesso no Notion!");
}

run().catch(console.error);

