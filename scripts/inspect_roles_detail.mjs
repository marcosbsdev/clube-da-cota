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

async function run() {
  const blocks = await fetchAllBlocks(PAGE_ID);
  
  for (let i = 15; i <= 45; i++) {
    const b = blocks[i];
    if (!b) continue;
    const textArr = b[b.type]?.rich_text || [];
    const text = textArr.map(t => t.plain_text).join('');
    console.log(`[#${i} ${b.type}]: ${text}`);
  }
}

run().catch(console.error);

