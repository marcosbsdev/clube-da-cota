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
  console.log("Registrando atualizaÃ§Ã£o de responsividade e layout web no Notion...");

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
            text: { content: 'ðŸ–¥ï¸ AtualizaÃ§Ã£o: Sistema Web Moderno & Totalmente Responsivo' }
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
              content: 'O Clube da Cota foi aprimorado para oferecer uma experiÃªncia fluida de sistema web moderno para desktop e tablets, eliminando a restriÃ§Ã£o de container estreito mobile no navegador, ao mesmo tempo em que preserva a ergonomia PWA em dispositivos mÃ³veis.'
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
          { type: 'text', text: { content: 'Layout Adaptativo (Desktop & Mobile): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'A navegaÃ§Ã£o em desktop utiliza largura expandida (max-w-7xl) com grids de 12 colunas, enquanto em celulares mantÃ©m layout compacto com foco em usabilidade por toque.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Header com NavegaÃ§Ã£o Superior Desktop: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Em telas mÃ©dias e grandes (md/lg), o Header superior abriga diretamente os botÃµes de navegaÃ§Ã£o ("Meu ConsÃ³rcio", "GestÃ£o do Grupo", "Novo ConsÃ³rcio" e "Perfil & Tema"), identidade visual da marca e perfil do usuÃ¡rio.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Barra Inferior MÃ³vel (Bottom Nav): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Configurada como md:hidden, ativada exclusivamente em smartphones para ergonomia com o polegar, sem poluir a visÃ£o no desktop.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Dashboard do Criador em MÃºltiplas Colunas: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Os 4 cards de KPIs distribuem-se em 4 colunas horizontais. O painel operacional organiza anÃ¡lise de comprovantes e controle de parcelas Ã  esquerda (8 colunas) e alertas de atraso com trilha de auditoria Ã  direita (4 colunas).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Ãrea do Participante Estruturada: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Coluna esquerda com resumo financeiro pessoal, prÃ³ximo vencimento e dados para pagamento (Pix/Conta); coluna direita com extrato de parcelas pessoais e acompanhamento coletivo seguro (sem valores alheios).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Assistente de CriaÃ§Ã£o & Perfil em Grids: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Assistente centralizado (max-w-3xl) com passos visÃ­veis e formulÃ¡rios em 2 colunas. Paletas de cores e alternador de usuÃ¡rios dispostos em grids elegantes de 2 a 3 colunas.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… AtualizaÃ§Ã£o de responsividade registrada com sucesso no Notion!");
}

run().catch(console.error);

