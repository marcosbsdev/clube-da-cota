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
  console.log("Registrando decisÃµes no Notion...");

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
            text: { content: 'ðŸš€ AtualizaÃ§Ãµes da ImplementaÃ§Ã£o do MVP (Clube da Cota)' }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Nome oficial aprovado: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Clube da Cota (domÃ­nio verificado disponÃ­vel no Registro.br: clubedacota.com.br).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Paleta de Cores & Identidade: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Cor padrÃ£o definida como Azul Royal. Adicionado seletor na pÃ¡gina de perfil onde o usuÃ¡rio pode escolher permanentemente entre Azul, Escuro (Grafite), Roxo, Oceano e Coral.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Stack TecnolÃ³gica: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Next.js 14 (App Router) + TypeScript + Tailwind CSS + PWA + Prisma ORM (SQLite local e pronto para PostgreSQL/Supabase na nuvem).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Status Atual: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Os 6 mÃ³dulos essenciais do MVP implementados e validados com testes unitÃ¡rios (100% de sucesso). Servidor de desenvolvimento rodando localmente em http://localhost:3000.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… AtualizaÃ§Ã£o registrada com sucesso no Notion!");
}

run().catch(console.error);

