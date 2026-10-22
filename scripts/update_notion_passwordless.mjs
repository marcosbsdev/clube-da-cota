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
  console.log("Registrando Acesso Passwordless e Compartilhamento WhatsApp no Notion...");

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
            text: { content: '📲 Acesso Passwordless (Link Mágico) & Compartilhamento via WhatsApp' }
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
              content: 'Implementada a experiência de acesso sem senha para os participantes do Clube da Cota, eliminando a barreira de login para usuários casuais e integrando o compartilhamento direto via WhatsApp:'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: { content: '1. Portal do Participante Sem Senha (/participante/[token])' }
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
              content: 'Zero Fricção de Entrada: O participante clica no link recebido no WhatsApp e abre diretamente seu portal no navegador (desktop ou mobile), sem necessidade de criar conta ou memorizar senhas.'
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
              content: 'Previsão da Bolada em Destaque: Card visual com a ordem de sorteio, data estimada e valor total previsto que o participante receberá quando contemplado (ou selo comemorativo se já contemplado).'
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
              content: 'Pagamento PIX Instantâneo: Exibição da parcela atual com vencimento, chave PIX do organizador com botão de cópia em 1 clique e instruções bancárias.'
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
              content: 'Anexo de Comprovante PIX: Envio direto do comprovante com atualização de status para "Comprovante em análise" e notificação ao organizador.'
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
              content: 'Transparência Coletiva: Acordeão expansível que exibe a ordem de contemplação de todo o grupo de forma clara e anônima.'
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
              content: 'Upgrade Opcional de Conta: Possibilidade de cadastrar uma senha diretamente pelo portal caso o participante deseje acessar de outros aparelhos ou gerenciar múltiplos consórcios.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: { content: '2. Compartilhamento via WhatsApp no Painel do Criador' }
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
              content: 'Botão de Acesso Rápido: Adicionado botão "Acesso" em cada card de cota na seção de Ordem de Contemplação do Criador.'
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
              content: 'Disparo no WhatsApp: Montagem automática da mensagem limpa e profissional com link direto, pronta para envio no WhatsApp Web ou App.'
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
              content: 'Suporte a Cotas Compartilhadas: Apresentação individualizada de links e mensagens quando uma cota possui mais de um participante fracionado.'
            }
          }
        ]
      }
    },
    {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [
          {
            type: 'text',
            text: { content: '3. Garantia por Testes Automatizados' }
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
              content: 'Criação da suíte tests/passwordless_participant.test.mjs com 6 testes aprovados (busca por token, bloqueio de tokens inválidos, anexo de comprovante, persistência em banco, registro na auditoria e ativação de senha).'
            }
          }
        ]
      }
    }
  ];

  try {
    await appendToNotion(updateBlocks);
    console.log("✅ Notion atualizado com sucesso!");
  } catch (err) {
    console.error("❌ Erro ao atualizar o Notion:", err);
    process.exit(1);
  }
}

run();
