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
  console.log("Registrando ajuste de quantidade de cotas compartilhadas no Notion...");

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
            text: { content: 'ðŸ”¢ ExibiÃ§Ã£o e Suporte Ã  Quantidade em Cotas Compartilhadas' }
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
              content: 'Ajustada a exibiÃ§Ã£o e o controle de quantidade de cotas no Assistente de CriaÃ§Ã£o de ConsÃ³rcio:'
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
          { type: 'text', text: { content: 'ExibiÃ§Ã£o da Quantidade na Lista: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Corrigido o card de participantes compartilhados. Agora exibe explicitamente a quantidade de quotas junto da porcentagem (ex: "1 cota(s) compartilhada (50% cada)"), mantendo perfeita simetria com as cotas individuais ("X cota(s) individual").' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Campo de Quantidade Desbloqueado: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'O campo "Quantidade de Cotas" agora permanece ativo e configurÃ¡vel mesmo com a opÃ§Ã£o de cota compartilhada marcada, permitindo que a dupla adquira 1 ou mais cotas conjuntas.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'CriaÃ§Ã£o Completa no Backend: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'A Server Action createConsorcioAction agora itera pela quantidade informada para cotas compartilhadas, gerando as cotas numeradas e o calendÃ¡rio individual de contribuiÃ§Ãµes para ambos os cotistas.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'TransparÃªncia na RevisÃ£o Final (Etapa 4): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'DistinÃ§Ã£o clara entre "Total de Cotas" (arrecadaÃ§Ã£o/ciclos) e "Total de Membros / Participantes" (nÃºmero de pessoas fÃ­sicas reais envolvidas).' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… Ajuste documentado com sucesso no Notion!");
}

run().catch(console.error);

