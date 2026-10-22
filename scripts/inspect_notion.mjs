import { NOTION_TOKEN, PAGE_ID } from './notion_config.mjs';

async function fetchAllBlocks(blockId) {
  let allBlocks = [];
  let cursor = undefined;

  do {
    const url = new URL(`https://api.notion.com/v1/blocks/${blockId}/children`);
    url.searchParams.set('page_size', '100');
    if (cursor) url.searchParams.set('start_cursor', cursor);

    const res = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${NOTION_TOKEN}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    allBlocks.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);

  return allBlocks;
}

async function main() {
  console.log("Buscando todos os blocos da pÃ¡gina do Notion...");
  const blocks = await fetchAllBlocks(PAGE_ID);
  console.log(`Total de blocos encontrados na pÃ¡gina: ${blocks.length}`);

  // Analisa os tÃ­tulos (headings) da pÃ¡gina
  const headings = blocks.filter(b => b.type.startsWith('heading_'));
  console.log("\nPrincipais SeÃ§Ãµes / TÃ­tulos identificados na pÃ¡gina:");
  headings.forEach(h => {
    const text = h[h.type]?.rich_text?.map(t => t.plain_text).join('') || '';
    const level = h.type.replace('heading_', 'H');
    console.log(`  [${level}] ${text}`);
  });
}

main().catch(console.error);

