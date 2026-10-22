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
  console.log("Registrando sincronização com o GitHub no Notion...");

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
            text: { content: '🐙 Repositório Remoto no GitHub e Versionamento de Código' }
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
              content: 'O projeto foi inicializado no Git, conectado à conta do GitHub e publicado em um novo repositório remoto público:'
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
          { type: 'text', text: { content: 'Repositório Remoto: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'https://github.com/marcosbsdev/clube-da-cota', link: { url: 'https://github.com/marcosbsdev/clube-da-cota' } } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Branch e Commit Inicial: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Branch main com commit 1a1374d cobrindo todos os módulos do MVP com descrição técnica minuciosa.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Segurança & Boas Práticas: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Configurado .gitignore para ignorar node_modules, .next, banco SQLite dev.db e variáveis sensíveis (.env). Criado arquivo .env.example com documentação de chaves necessárias.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Documentação do Repositório: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'README.md completo com objetivos da plataforma, instruções de setup local, tabela de contas pré-cadastradas para testes e comandos para execução das suítes de testes automatizados.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("✅ Publicação no GitHub documentada com sucesso no Notion!");
}

run().catch(console.error);
