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
  console.log("Registrando Troca de Ordem de Contemplação no Notion...");

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
            text: { content: '🎲 Troca de Ordem de Contemplação & Sorteio de Participantes' }
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
              content: 'Implementada a funcionalidade oficial de permuta de posições de contemplação acordadas entre participantes, com total conformidade ao documento de requisitos do Clube da Cota:'
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
          {
            type: 'text',
            text: {
              content: 'Permuta Flexível Acordada: Os participantes combinam informalmente a inversão de seus ciclos de contemplação (ex: Josivan Ciclo #1 e Elion Ciclo #5). O Criador ou Administrador efetiva a troca no sistema.'
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
          {
            type: 'text',
            text: {
              content: 'Schema & Persistência: Adicionado o campo ordemSorteio Int? ao modelo Cota no Prisma Schema, permitindo diferenciar o número fixo da cota do seu ciclo de recebimento da bolada.'
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
          {
            type: 'text',
            text: {
              content: 'Proteção de Cotas Contempladas: Cotas cujo status seja CONTEMPLADA não podem ser permutadas, garantindo integridade dos ciclos já finalizados.'
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
          {
            type: 'text',
            text: {
              content: 'Trilha de Auditoria Obrigatória: Cada troca de posição gera automaticamente um registro imutável em AuditoriaLog (tipo TROCA_POSICAO_COTA) com data, hora, criador responsável e justificativa opcional.'
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
          {
            type: 'text',
            text: {
              content: 'Transparência Coletiva: Tanto o Criador quanto os Participantes visualizam a ordem oficial atualizada de sorteio, com destaque especial ("⭐ Sua Cota") para a cota do usuário logado.'
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
          {
            type: 'text',
            text: {
              content: 'Interface Mobile-First & Z-Index z-[100]: Modal de permuta adaptado para desktop e gaveta inferior no mobile, sem conflito com barra de navegação inferior.'
            }
          }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("✅ Troca de Ordem de Contemplação registrada com sucesso no Notion!");
}

run().catch(console.error);
