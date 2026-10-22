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
  console.log("Registrando regra de mÃ­nimo de 2 participantes no Notion...");

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
            text: { content: 'ðŸ”’ Regra de NegÃ³cio: MÃ­nimo de 2 Participantes ObrigatÃ³rios' }
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
              content: 'Estabelecida a regra fundamental de que todo consÃ³rcio deve ter obrigatoriamente no mÃ­nimo 2 participantes (proibindo consÃ³rcios unipessoais):'
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
          { type: 'text', text: { content: 'ProibiÃ§Ã£o de ConsÃ³rcio Unipessoal: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Um consÃ³rcio tem como essÃªncia a poupanÃ§a rotativa e mÃºtua em grupo; portanto, a criaÃ§Ã£o com apenas 1 participante Ã© bloqueada.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Contagem de Cotas Compartilhadas: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Uma cota compartilhada entre 2 titulares (50/50) contabiliza 2 participantes fÃ­sicos distintos, satisfazendo o requisito mÃ­nimo de 2 pessoas.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'ValidaÃ§Ã£o no Frontend: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Na Etapa 2 do Assistente de CriaÃ§Ã£o (CriarConsorcioWizard), o botÃ£o "AvanÃ§ar para Valores" bloqueia e notifica com aviso visual: "Um consÃ³rcio deve ter obrigatoriamente no mÃ­nimo 2 participantes."' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'ValidaÃ§Ã£o de SeguranÃ§a no Backend: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'A Server Action createConsorcioAction rejeita requisiÃ§Ãµes com menos de 2 participantes com mensagem de erro amigÃ¡vel, garantindo integridade mesmo se a chamada for direta.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Garantia por Testes UnitÃ¡rios: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'FunÃ§Ã£o pura validarMinimoParticipantes em lib/finance.ts com cobertura completa de 5 cenÃ¡rios (vazio, 1 pessoa, 1 cota compartilhada, 2 participantes e 3 participantes) no arquivo tests/finance.test.mjs.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… Regra de 2 participantes documentada com sucesso no Notion!");
}

run().catch(console.error);

