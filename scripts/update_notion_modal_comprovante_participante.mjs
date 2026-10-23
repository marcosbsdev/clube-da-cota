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
  console.log("Registrando padronização do Modal de Comprovante no Portal do Participante no Notion...");

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
            text: { content: '🚧 Padronização do Modal de Comprovante PIX no Portal Passwordless do Participante' }
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
              content: 'Unificada a experiência de usuário entre a página "Meu Consórcio" e o Portal Passwordless do Participante (/participante/[token]):'
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
              content: 'Modal Informativo "Funcionalidade em Desenvolvimento": Ao clicar em "Enviar Comprovante PIX", o participante agora visualiza o mesmo modal amigável com orientação para pagamento via PIX do grupo e envio direto ao organizador.'
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
              content: 'Consistência Visual: Mesmo layout responsivo gaveta/bottom-sheet no mobile, ícone de obras (🚧), badge "Em breve disponível" e botão "Entendi, obrigado!".'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Status: Testado e aprovado localmente pelo usuário. 36/36 testes automatizados mantidos com 100% de integridade.'
            }
          }
        ],
        icon: {
          emoji: '✅'
        }
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Notion atualizado com sucesso!");
  } catch (err) {
    console.error("❌ Falha ao atualizar o Notion:", err);
    process.exit(1);
  }
}

run();
