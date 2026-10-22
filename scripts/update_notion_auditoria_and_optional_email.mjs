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
  console.log("Registrando melhorias de Auditoria e E-mail Opcional no Notion...");

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
            text: { content: '🛡️ Histórico de Auditoria Humanizado & E-mail Opcional para Participantes' }
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
              content: 'Implementadas duas importantes evoluções de usabilidade e experiência do usuário no Clube da Cota:'
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
            text: { content: '1. Humanização do Histórico de Auditoria' }
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
              content: 'Destaque Central aos Participantes: O nome dos participantes envolvidos (ex: Fábio Augusto, Elion Santos, Camila Pro) passou a ser exibido em primeiro plano em destaque visual (tipografia preta e negrito), facilitando a identificação imediata.'
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
              content: 'Fim dos JSONs crus: As operações de permuta de cotas e edição de consórcio agora são convertidas em cards visuais limpos com indicação de antes/depois (ex: Ciclo #1 ➔ Ciclo #4).'
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
              content: 'Eliminação da Barra de Rolagem: Correção estrutural de overflow-x com quebra segura de texto (break-words), garantindo leitura confortável em mobile e desktop.'
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
            text: { content: '2. E-mail Opcional no Cadastro de Membros' }
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
              content: 'Zero Atrito para Grupos de Amigos e Família: O criador pode cadastrar participantes apenas com o Nome completo, sem ser obrigado a solicitar e-mails no WhatsApp.'
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
              content: 'Arquitetura Segura: Para membros sem e-mail, o backend cria internamente um identificador de participante seguro com status isActivated: false, vinculando cotas e parcelas sem comprometer a integridade relacional do banco.'
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
              content: 'Preparação para Ativação Futura: Participantes sem e-mail poderão ter seu e-mail informado posteriormente para ativação de login e convites digitais.'
            }
          }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("✅ Documentação atualizada com sucesso no Notion!");
}

run().catch(console.error);
