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
  console.log("Registrando ajuste do criador opcional no Notion...");

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
            text: { content: 'ðŸ‘¥ Flexibilidade na InclusÃ£o de Participantes (Criador Opcional)' }
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
              content: 'Ajustada a Etapa 2 do Assistente de CriaÃ§Ã£o de ConsÃ³rcio para garantir flexibilidade total sobre a participaÃ§Ã£o do criador no grupo:'
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
          { type: 'text', text: { content: 'Criador Opcional como Participante: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'O usuÃ¡rio logado nÃ£o Ã© mais prÃ©-adicionado obrigatoriamente Ã  lista de cotas. Ele pode ser um mero organizador/administrador sem cotas ou optar por participar.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Liberdade de Cotas para o Criador: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Quando optar por participar, o criador pode adquirir 1 cota, mÃºltiplas cotas (2, 3, etc.) ou configurar uma cota compartilhada (50/50 com outra pessoa).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'RemoÃ§Ã£o Completa: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Todos os participantes adicionados Ã  lista possuem botÃ£o de exclusÃ£o (lixeira), sem travas ou exceÃ§Ãµes.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Atalho de Preenchimento RÃ¡pido: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionado botÃ£o opcional "Eu tambÃ©m vou participar (Preencher meus dados no formulÃ¡rio)" que insere nome e e-mail do criador nos campos de cadastro sem forÃ§ar inclusÃ£o imediata.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… Ajuste do criador documentado com sucesso no Notion!");
}

run().catch(console.error);

