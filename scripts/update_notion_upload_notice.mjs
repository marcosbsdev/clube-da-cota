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
  console.log("Registrando aviso de funcionalidade de upload em desenvolvimento no Notion...");

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
            text: { content: '🚧 Feedback de Upload em Desenvolvimento' }
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
              content: 'Alinhamento da experiência do usuário na ação de envio de comprovante PIX:'
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
          { type: 'text', text: { content: 'Substituição do Formulário Simulado: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Removido o mock anterior que pedia nome de arquivo manual.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Aviso Transparente ao Usuário: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Ao tocar em "Enviar Comprovante PIX", abre-se um modal responsivo (gaveta no mobile) informando que o upload real de arquivos (JPG, PNG e PDF) está em fase final de implementação.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Orientação Operacional: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Instrui o participante a utilizar a chave PIX exibida na tela e enviar o comprovante diretamente ao organizador enquanto a integração de armazenamento em nuvem é concluída.' } }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Aviso de upload em desenvolvimento registrado com sucesso no Notion!");
  } catch (err) {
    console.error("❌ Erro ao atualizar Notion:", err.message);
    process.exit(1);
  }
}

run();
