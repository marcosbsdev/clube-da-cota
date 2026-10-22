import { appendToNotion } from './notion_manager.mjs';

async function update() {
  const blocks = [
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Simplificação das Paletas de Cores no Perfil: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Removidos os subtítulos explicativos de cada cor no Perfil e simplificados os nomes das 5 paletas para: Azul (Padrão), Escuro, Roxo, Azul Claro e Laranja, proporcionando uma interface mais limpa e minimalista.' } }
        ]
      }
    }
  ];

  await appendToNotion(blocks);
  console.log("✅ Simplificação das paletas documentada no Notion com sucesso!");
}

update().catch(console.error);
