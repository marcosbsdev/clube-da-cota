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

async function search() {
  const blocks = await fetchAllBlocks(PAGE_ID);
  console.log(`Buscando em ${blocks.length} blocos...`);

  const terms = ['perfil', 'perfis', 'papel', 'papÃ©is', 'role', 'roles', 'super admin', 'comum', 'pro', 'criador', 'participante'];

  blocks.forEach((b, idx) => {
    const textArr = b[b.type]?.rich_text || [];
    const text = textArr.map(t => t.plain_text).join('');
    const lower = text.toLowerCase();

    // Procura seÃ§Ãµes especÃ­ficas sobre tipos de perfis/roles
    if (
      lower.includes('perfil') || 
      lower.includes('perfis') || 
      lower.includes('tipos de usuÃ¡rio') ||
      lower.includes('super admin') ||
      lower.includes('nÃ­veis de acesso') ||
      lower.includes('pro-master')
    ) {
      console.log(`[Bloco #${idx} - ${b.type}]: ${text.slice(0, 160)}...`);
    }
  });
}

search().catch(console.error);

