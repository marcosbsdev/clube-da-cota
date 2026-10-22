import { NOTION_TOKEN, PAGE_ID } from './notion_config.mjs';

async function fetchBlocks(blockId) {
  let all = [];
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
    const data = await res.json();
    all.push(...data.results);
    cursor = data.has_more ? data.next_cursor : undefined;
  } while (cursor);
  return all;
}

async function deleteBlock(blockId) {
  await fetch(`https://api.notion.com/v1/blocks/${blockId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
    }
  });
}

async function organize() {
  console.log("Organizando e revisando a seÃ§Ã£o final do Notion...");
  const blocks = await fetchBlocks(PAGE_ID);

  // Encontra onde comeÃ§a o bloco "ðŸš€ AtualizaÃ§Ãµes da ImplementaÃ§Ã£o"
  const startIdx = blocks.findIndex(b => {
    const text = b[b.type]?.rich_text?.map(t => t.plain_text).join('') || '';
    return text.includes("AtualizaÃ§Ãµes da ImplementaÃ§Ã£o") || text.includes("SimplificaÃ§Ã£o da CriaÃ§Ã£o");
  });

  if (startIdx !== -1) {
    console.log(`Removendo ${blocks.length - startIdx} blocos de rascunho anteriores para organizar uma seÃ§Ã£o definitiva...`);
    for (let i = startIdx; i < blocks.length; i++) {
      await deleteBlock(blocks[i].id);
    }
  }

  // Agora inclui a seÃ§Ã£o final consolidada, limpa e oficial
  const finalBlocks = [
    {
      object: 'block',
      type: 'divider',
      divider: {}
    },
    {
      object: 'block',
      type: 'heading_1',
      heading_1: {
        rich_text: [{ type: 'text', text: { content: 'ðŸš€ DecisÃµes de ImplementaÃ§Ã£o & Changelog ContÃ­nuo' } }]
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: 'ðŸ“Œ' },
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Esta seÃ§Ã£o Ã© atualizada automaticamente pela IA sempre que novas decisÃµes, ajustes de usabilidade ou alteraÃ§Ãµes de escopo forem decididos na conversa.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '1. Nome Oficial & Marca' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Nome definido: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Clube da Cota (domÃ­nio verificado disponÃ­vel no Registro.br: clubedacota.com.br).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '2. Identidade Visual & Acessibilidade' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Cor PadrÃ£o: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Azul Royal.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'PersonalizaÃ§Ã£o Permanente por UsuÃ¡rio: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'O participante ou criador pode acessar seu Perfil e escolher entre 5 paletas (Azul PadrÃ£o, Escuro/Grafite, Roxo, Oceano e Coral). A escolha Ã© salva permanentemente na conta.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Foco em Leigos e Idosos: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'BotÃµes altos (touch-target > 44px), tipografia legÃ­vel, barra de navegaÃ§Ã£o inferior estilo app (PWA) e sinalizaÃ§Ã£o dupla com Ã­cones e cores para status (Pago, Pendente, Atraso).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '3. Regras de CriaÃ§Ã£o de ConsÃ³rcio' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Dados para Receber Pagamentos (Campo Ãšnico): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Na Etapa 1 do assistente de criaÃ§Ã£o, foi disponibilizado um campo Ãºnico livre e flexÃ­vel onde o criador informa onde receber os pagamentos (Chave Pix, dados bancÃ¡rios ou instruÃ§Ãµes). Esse texto Ã© apresentado na Ã­ntegra aos participantes.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Cotas Compartilhadas: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Suporte a divisÃ£o 50/50 entre dois participantes em uma Ãºnica cota no sorteio e na lista.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '4. Stack TecnolÃ³gica & Estado do MVP' } }]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Stack: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Next.js 14 + Tailwind CSS + PWA + Prisma ORM (SQLite local, preparado para PostgreSQL / Supabase).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'ExecuÃ§Ã£o Atual: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'AplicaÃ§Ã£o funcional rodando localmente em http://localhost:3000 com testes unitÃ¡rios cobrindo regras financeiras com 100% de aprovaÃ§Ã£o.' } }
        ]
      }
    }
  ];

  const patchRes = await fetch(`https://api.notion.com/v1/blocks/${PAGE_ID}/children`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${NOTION_TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ children: finalBlocks })
  });

  if (!patchRes.ok) {
    throw new Error(`Erro ao salvar no Notion: ${patchRes.status} ${await patchRes.text()}`);
  }

  console.log("âœ… SeÃ§Ã£o de DecisÃµes do Notion organizada e sincronizada com sucesso!");
}

organize().catch(console.error);

