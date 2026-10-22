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
  console.log("Registrando correção de sobreposição e centralização de modals no Notion...");

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
            text: { content: '🪟 Correção de Modals, Z-Index e Centralização Mobile' }
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
              content: 'Ajuste fino na camada de exibição (z-index) e no layout das gavetas e janelas modais do sistema:'
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
          { type: 'text', text: { content: 'Eliminação da Sobreposição da Barra Inferior: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Ajustado o z-index da BottomNav para z-40 e elevado todos os modais/backdrops para z-[100], garantindo que o fundo escuro cubra a tela inteira e a barra inferior nunca mais tampe os botões de ação do rodapé.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Centralização e Simetria Visual: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'No modal informativo de upload, o cabeçalho foi redesenhado com ícone 🚧 centralizado, título em largura total sem reticências (truncate) e botão de fechar posicionado no topo superior direito.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Padding de Segurança Inferior (Safe-Area): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionado pb-8 nos modais mobile para garantir espaço confortável entre o final do conteúdo e a base da tela do smartphone.' } }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Correção de modals registrada com sucesso no Notion!");
  } catch (err) {
    console.error("❌ Erro ao atualizar Notion:", err.message);
    process.exit(1);
  }
}

run();
