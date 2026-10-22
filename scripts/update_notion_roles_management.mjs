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
  console.log("Registrando expansão dos 4 níveis de acesso e ferramenta Super Admin no Notion...");

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
            text: { content: '🛡️ Os 4 Níveis de Acesso & Painel de Governança do Super Admin' }
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
              content: 'Implementada a cobertura total dos 4 níveis de acesso previstos na especificação do projeto, além de ferramenta interativa para o Super Admin gerenciar permissões:'
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
          { type: 'text', text: { content: 'Camila Pro (Nível PRO): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionada para testar o nível PRO (capacidade de criar até 3 consórcios com até 20 membros cada). Já possui o "Consórcio Viagem 2026 - Pro" ativo sob sua gestão.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Renato Master (Nível PRO_MASTER): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionado para testar o nível PRO-MASTER, voltado a organizadores seniores de múltiplos grupos de grande porte.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Ferramenta de Governança Super Admin: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Nova seção exclusiva no Perfil para o Super Admin com lista de todos os usuários e seletor dropdown para promover ou rebaixar papéis (COMUM ↔ PRO ↔ PRO_MASTER ↔ SUPER_ADMIN) em tempo real.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Validação e Segurança no Backend: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'A Server Action updateUserRoleAction valida rigorosamente que apenas usuários com nível SUPER_ADMIN podem alterar os papéis de outros membros.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Testes Automatizados: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Adicionado Teste 6 na suíte tests/auth.test.mjs validando a existência dos 4 papéis e os fluxos de promoção e rebaixamento.' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("✅ Governança de níveis de acesso documentada com sucesso no Notion!");
}

run().catch(console.error);
