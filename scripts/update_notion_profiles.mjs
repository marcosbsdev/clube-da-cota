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
  console.log("Registrando perfis e seletor rÃ¡pido no Notion...");

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
            text: { content: 'ðŸ‘¥ Perfis de DemonstraÃ§Ã£o & Seletor RÃ¡pido no Header' }
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
              content: 'Para possibilitar a avaliaÃ§Ã£o de todos os 4 mÃ³dulos essenciais do MVP por diferentes papÃ©is e cenÃ¡rios de cotas, foi adicionado um seletor instantÃ¢neo no Header e no Perfil com os seguintes usuÃ¡rios semeados:'
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
          { type: 'text', text: { content: 'Marcos Batista (Super Admin & Criador): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Acesso total Ã  gestÃ£o do consÃ³rcio, aprovaÃ§Ã£o de comprovantes, estornos e novo consÃ³rcio.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'FÃ¡bio Augusto (Comum - Cota Individual 100%): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'VisÃ£o de participante comum com cota integral (R$ 500), envio de comprovante PIX e visÃ£o coletiva segura.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Patrick Dias & Josivan Costa (Comum - Cota Compartilhada 50/50): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'CenÃ¡rio onde dois amigos dividem uma Ãºnica cota (#3), pagando metade do valor cada um (R$ 250).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Elion Santos & Lucas Silveira (Comum - Participantes): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Participantes individuais para simulaÃ§Ã£o de pagamentos, atrasos e acompanhamento.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… Perfis de demonstraÃ§Ã£o documentados com sucesso no Notion!");
}

run().catch(console.error);

