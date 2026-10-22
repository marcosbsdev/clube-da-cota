import { appendToNotion } from './notion_manager.mjs';

async function update() {
  const blocks = [
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Simplificação da Criação: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Unificação dos dados para receber pagamentos em um único campo livre na Etapa 1. O criador pode colar sua Chave Pix, dados de conta bancária ou instruções gerais em uma única área de texto.' } }
        ]
      }
    }
  ];

  await appendToNotion(blocks);
  console.log("✅ Simplificação sincronizada no Notion!");
}

update().catch(console.error);
