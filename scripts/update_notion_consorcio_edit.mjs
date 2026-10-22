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
  console.log("Registrando Edição de Consórcio e Trilha de Auditoria no Notion...");

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
            text: { content: '✏️ Edição de Consórcio & Preservação das Regras Financeiras' }
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
              content: 'Implementada a funcionalidade completa de edição de dados do consórcio no Painel de Gestão, respeitando rigorosamente as regras de governança e imutabilidade:'
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
          { type: 'text', text: { content: 'Acesso Restrito: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Apenas o criador do consórcio, Super Admin ou Pro Master possuem autorização para abrir e salvar alterações.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Campos Editáveis: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Nome do consórcio, finalidade/objetivo, regras gerais e instruções de pagamento (Chave PIX e dados bancários).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Proteção de Imutabilidade Financeira: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Valor da cota, total de cotas e periodicidade permanecem bloqueados e exibidos em destaque informativo com cadeado, garantindo a integridade dos cálculos e a segurança de todos os participantes.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Trilha de Auditoria Obrigatória: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Toda alteração gera automaticamente um registro na tabela AuditoriaLog com identificação do responsável, data/hora e o comparativo dos dados antes e depois da edição.' } }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Edição de Consórcio registrada com sucesso no Notion!");
  } catch (err) {
    console.error("❌ Erro ao atualizar Notion:", err.message);
    process.exit(1);
  }
}

run();
