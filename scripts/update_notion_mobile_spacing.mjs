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
  console.log("Registrando otimização de espaçamentos e labels mobile no Notion...");

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
            text: { content: '📱 Otimização de Densidade e Labels Mobile (Resolução de Quebras de Linha)' }
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
              content: 'Refinamento completo da experiência visual mobile para telas estreitas (360px a 400px), eliminando textos quebrados e valores divididos:'
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
          { type: 'text', text: { content: 'Seletor Combo Inteligente: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Substituição de labels longas por "Consórcio Ativo" com whitespace-nowrap, badge do papel (Admin/Participante) em pill compacta e prevenção de corte de texto (ex: "A...").' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Layout Financeiro Fintech (Hero + 2 Colunas): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Substituído o grid apertado de 3 colunas (que forçava "R$" e o valor em linhas diferentes) por um Hero Card com Total Previsto em largura ampla e 2 colunas espaçosas (Já Pago e Falta Pagar).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Formatação Monetária Brasileira Padrão: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Aplicação consistente de toLocaleString("pt-BR") (ex: R$ 2.010,00) em todas as visões do participante e do criador.' } }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Otimização mobile registrada com sucesso no Notion!");
  } catch (err) {
    console.error("❌ Erro ao atualizar Notion:", err.message);
    process.exit(1);
  }
}

run();
