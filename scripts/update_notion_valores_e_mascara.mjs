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
  console.log("Registrando Validação Matemática e Máscara Monetária BRL no Notion...");

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
            text: { content: '💰 Validação Matemática Completa & Máscara Monetária BRL (R$ 1.200,00)' }
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
              content: 'Implementada a padronização monetária brasileira e a validação matemática rigorosa de todos os cálculos na tela de "Valores e Calendário" (Passo 3 do Assistente de Criação de Consórcio):'
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
            text: { content: '1. Máscara Monetária no Padrão Brasileiro (BRL)' }
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
              content: 'Formatação BRL Real-Time: Separação correta de milhões, milhares, centenas e centavos com pontos e vírgula (ex: R$ 100,00, R$ 1.200,00, R$ 12.250,00, R$ 1.000.000,00).'
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
              content: 'Digitação Natural (Digit-Shift): Entrada estilo caixas bancários com deslocamento suave de centavos, sem saltos de cursor em desktop e mobile.'
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
              content: 'Suporte a Colar (Paste): Handler inteligente que reconhece números colados com vírgula, ponto ou inteiros brutos e formata instantaneamente.'
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
            text: { content: '2. Validação Matemática dos Cálculos e Projeções' }
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
              content: 'Bolada por Contemplação: Cálculo exato do valor entregue ao contemplado em cada ciclo (ex: de R$ 1.000,00 no Mês 1 a R$ 1.450,00 no Mês 10).'
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
              content: 'Total Pago por Cota (ao final): Calculado com base na Soma da Progressão Aritmética (PA) das parcelas ao longo do consórcio (ex: R$ 1.225,00 por participante).'
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
              content: 'Volume Total Movimentado: Soma de todas as contribuições circulando no grupo (ex: 10 cotas × R$ 1.225,00 = R$ 12.250,00).'
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
              content: 'Validações de Bloqueio: O assistente impede avanço para a revisão com valores zerados (R$ 0,00), acréscimo nulo no modelo progressivo ou sem data informada.'
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
              content: 'Garantia por Testes Unitários: Inclusão do Teste 7 (formatação e parse monetário BRL) e Teste 8 (matemática de PA e projeções) na suíte automatizada.'
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
