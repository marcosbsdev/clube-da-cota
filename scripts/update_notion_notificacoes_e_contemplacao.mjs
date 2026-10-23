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
  console.log("Registrando Notificações Inbox Zero, Modais de Confirmação e Persistência no Notion...");

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
            text: { content: '🔔 Central de Notificações (Inbox Zero), Modais de Confirmação e Persistência Multi-Camada' }
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
              content: 'Implementada suíte completa de segurança operacional e feedback visual, incluindo central de notificações em tempo real, modais comemorativos e de confirmação, e persistência definitiva de leitura:'
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
              content: 'Modais de Confirmação Operacional: Criação do ModalConfirmarPagamento (exibe cota, participante, ciclo, valor e comprovante PIX com campo de observações customizadas antes de efetivar a baixa) e ModalContemplacao (confirmação comemorativa com valor da bolada calculado ou reversão com justificativa).'
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
              content: 'Visualização Destaque para Contemplação: Botões da ordem de contemplação reformulados com degradê esmeralda, tipografia marcante e ícone Sparkles dourado para cotas contempladas, e botões âmbar com hover interativo para cotas aguardando.'
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
              content: 'Feedback Duplo e Confiável: Mensagens de sucesso agora são exibidas no banner superior verde e no toast flutuante (z-[100]) de forma simultânea e duradoura (4,5 segundos), com atualização silenciosa em background para eliminar piscares e perdas de estado de tela.'
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
              content: 'Central de Notificações no Sininho (Regra Inbox Zero): Popover dinâmico conectado diretamente à trilha de auditoria viva, exibindo apenas novas alterações com tempo relativo formatado ("Agora mesmo", "Há 5 min", "Ontem"), ícones contextuais e usuário responsável. Botão "Marcar lidas", dispensa individual e tela limpa ("Tudo limpo por aqui!") com atalho direto para a Trilha de Auditoria Completa na Gestão.'
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
              content: 'Persistência Anti-F5 em 4 Camadas: Gravação síncrona imediata em document.cookie, cookies de servidor com validade de 1 ano via Server Actions (clube_cota_lidas_${consorcioId}), redundância local em localStorage e reconciliação por timestamp. Garante que notificações marcadas como lidas nunca reapareçam ao atualizar a página.'
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
              content: 'Status: Homologado pelo usuário. 42/42 testes automatizados aprovados (tests/notifications.test.mjs incluso com 100% de sucesso e TypeScript 0 erros).'
            }
          }
        ],
        icon: {
          emoji: '🎉'
        }
      }
    }
  ];

  try {
    const res = await appendToNotion(updateBlocks);
    console.log("✅ Atualização registrada no Notion com sucesso!", res.results?.length, "blocos criados.");
  } catch (err) {
    console.error("❌ Erro ao atualizar o Notion:", err.message);
    process.exit(1);
  }
}

run();
