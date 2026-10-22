import { appendToNotion } from './notion_manager.mjs';

async function update() {
  const blocks = [
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Ajuste de Usabilidade (Criação de Consórcio): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionados campos para Chave Pix e Dados Bancários (Conta Corrente/Instruções) na Etapa 1 do assistente de criação, para que o criador defina livremente onde receber os pagamentos e esses dados fiquem visíveis aos participantes.' } }
        ]
      }
    }
  ];

  await appendToNotion(blocks);
  console.log("✅ Ajuste registrado no Notion!");
}

update().catch(console.error);
