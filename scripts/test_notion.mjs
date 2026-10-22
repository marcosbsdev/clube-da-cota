import { NOTION_TOKEN, PAGE_ID } from './notion_config.mjs';

async function testConnection() {
  console.log(`Conectando ao Notion com a pÃ¡gina ID: ${PAGE_ID}...`);

  try {
    const pageRes = await fetch(`https://api.notion.com/v1/pages/${PAGE_ID}`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!pageRes.ok) {
      const errText = await pageRes.text();
      console.error(`Erro ao acessar pÃ¡gina: HTTP ${pageRes.status} - ${errText}`);
      return;
    }

    const pageData = await pageRes.json();
    console.log("PÃ¡gina acessada com sucesso!");
    console.log("Objeto da pÃ¡gina:", pageData.object, "ID:", pageData.id);

    // Agora busca os blocos de conteÃºdo da pÃ¡gina
    const blocksRes = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children?page_size=100`, {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!blocksRes.ok) {
      const errText = await blocksRes.text();
      console.error(`Erro ao buscar blocos: HTTP ${blocksRes.status} - ${errText}`);
      return;
    }

    const blocksData = await blocksRes.json();
    console.log(`\nEncontrados ${blocksData.results.length} blocos na pÃ¡gina.\n`);

    for (const b of blocksData.results.slice(0, 15)) {
      const type = b.type;
      const content = b[type]?.rich_text?.map(t => t.plain_text).join('') || '';
      console.log(`[${type}] ${content}`);
    }

    if (blocksData.results.length > 15) {
      console.log(`... e mais ${blocksData.results.length - 15} blocos.`);
    }

  } catch (err) {
    console.error("ExceÃ§Ã£o ao conectar com Notion:", err);
  }
}

testConnection();

