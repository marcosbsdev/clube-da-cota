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
  console.log("Registrando melhorias de Datas, Cotas em Tempo Real e Paleta Visual no Notion...");

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
            text: { content: '📅 Sincronização de Datas, Contador de Cotas em Tempo Real & Unificação com Paleta do Usuário' }
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
              content: 'Implementado um conjunto de melhorias fundamentais na criação de consórcios, focando em precisão temporal, feedback em tempo real e harmonia visual com as paletas de cores do sistema:'
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
            text: { content: '1. Sincronização de Datas e Correção Definitiva de Fuso Horário' }
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
              content: 'Sincronização Passo 1 e Passo 3: A Data Prevista de Início definida no Passo 1 agora preenche automaticamente a data do Primeiro Vencimento no Passo 3, mantendo a coerência sem exigir redigitação.'
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
              content: 'Imunidade a Fuso Horário (UTC-3 de Brasília): Criada a função formatarDataSegura em finance.ts, evitando que o JavaScript subtraia 1 dia ao formatar strings ISO sem hora. No banco, as datas são salvas com horário ancorado ao meio-dia (T12:00:00).'
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
              content: 'Revisão Transparente (Passo 4): Exibição explícita e formatada tanto da Data de Início quanto da data do 1º Vencimento / Sorteio.'
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
            text: { content: '2. Contador de Cotas e Membros em Tempo Real (Passo 2)' }
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
              content: 'Visibilidade Total: Card em destaque no topo da lista exibindo o Total de Cotas acumuladas, a quantidade de ciclos/meses calculados, a contagem de membros únicos e badge de mínimo obrigatório (mín. 2).'
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
              content: 'Pílula de Soma: Indicador visual sobre a lista somando as cotas instantaneamente a cada inclusão individual ou compartilhada.'
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
            text: { content: '3. Foco em Chave Pix & Harmonização com a Paleta de Cores' }
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
              content: 'Placeholder Simplificado: O campo de recebimento de pagamentos agora foca diretamente na Chave Pix (CPF, celular, e-mail ou aleatória), eliminando instruções bancárias desnecessárias.'
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
              content: 'Harmonia Visual Total: O simulador de acréscimo progressivo e os cards de cotas abandonaram o fundo amarelo/âmbar e passaram a adotar a paleta ativa do usuário (Azul, Roxo, Oceano, Coral ou Dark), com degradê elegante no mês final da bolada.'
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
