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
  console.log("Registrando Seletor Combo de Consórcios e Bottom Sheet no Notion...");

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
            text: { content: '📁 Seletor Combo em Destaque & Bottom Sheet de Consórcios' }
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
              content: 'Evolução da arquitetura visual e navegação de consórcios no Clube da Cota, substituindo seletores discretos no cabeçalho por um componente Combo proeminente no topo do conteúdo:'
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
          { type: 'text', text: { content: 'Componente Combo Intuitivo: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Exibe badge com quantidade total de consórcios disponíveis (ex: "3 consórcios"), ícone de pasta temática, nome do consórcio ativo, resumo de cotas/frequência/papel e gatilho "Trocar ▼" com alto contraste e área de toque ampla.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Gaveta Deslizante (Bottom Sheet): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Ao tocar no combo, abre uma gaveta deslizante no mobile com puxador visual e animação fluida (modal centralizado no desktop), permitindo busca em tempo real por nome e listagem dos consórcios com indicador "✓ Ativo".' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Eliminação de Redundâncias e Duplicações: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Removidos títulos e caixas repetidas em ParticipanteView e CriadorView. O topo da página agora flui de maneira coesa: Cabeçalho limpo -> Combo Seletor -> Métricas e Ações operacionais.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Ações de Gestão Preservadas: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'No painel do criador, mantém botões de visualização em catálogo de cards ("Ver em Cards") e criação de novo consórcio ("Novo Consórcio"), perfeitamente integrados.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'callout',
      callout: {
        icon: { type: 'emoji', emoji: '✨' },
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Experiência fluida tanto para usuários com 1 consórcio quanto para administradores com 10 ou mais consórcios, garantindo troca instantânea com 1 toque.'
            }
          }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Seletor Combo registrado com sucesso no Notion!");
  } catch (err) {
    console.error("❌ Erro ao atualizar Notion:", err.message);
    process.exit(1);
  }
}

run();
