import { appendToNotion } from './notion_manager.mjs';

async function update() {
  const blocks = [
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Modelo de Acréscimo Mensal Progressivo: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Implementado no Passo 3 do assistente o seletor entre "Valor Fixo" e "Com Acréscimo Mensal". O criador informa o valor inicial (ex: R$ 500,00) e o valor acrescentado por ciclo (ex: R$ 5,00). O sistema calcula e exibe uma simulação em tempo real da evolução das parcelas (Mês 1: R$ 500, Mês 2: R$ 505, Mês 3: R$ 510...) e o valor total acumulado da bolada.' } }
        ]
      }
    }
  ];

  await appendToNotion(blocks);
  console.log("✅ Acréscimo mensal documentado no Notion com sucesso!");
}

update().catch(console.error);
