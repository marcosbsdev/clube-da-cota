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
  console.log("Registrando Redesign dos Cards, Mês/Ano por Ciclo e Harmonização de Paleta no Notion...");

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
            text: { content: '🎨 Redesign dos Cards, Previsão Mensal por Ciclo e Harmonização Total com a Paleta de Cores' }
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
              content: 'Implementado redesign completo de UX e padronização visual nas áreas de Ordem de Contemplação & Sorteio e Controle de Contribuições, garantindo fidelidade absoluta ao tema escolhido pelo usuário no Perfil:'
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
              content: 'Redesign Espaçoso de Cards (Fim dos Nomes Espremidos): Eliminado o grid de 2 colunas que truncava nomes de participantes ("Marcos Ba..."). Aprovado e aplicado o formato em linha única espaçosa (1 cota por linha) com avatar #pos, pílula de cota/ciclo, cronograma e botões de ação à direita com espaçamento confortável tanto no desktop quanto no mobile.'
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
              content: 'Previsão de Mês/Ano da Bolada por Ciclo: Criação das funções financeiras calcularDataCiclo e formatarMesAnoCiclo com segurança contra fuso horário. Cada cota agora informa com clareza o mês/ano de recebimento (ex: "Recebe em: Dezembro de 2026"), integrado na Visão do Criador, Visão do Participante, acordião de transparência e nas mensagens geradas para WhatsApp.'
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
              content: 'Harmonização Total com a Paleta de Cores: Substituição de cores estáticas avulsas (verde-esmeralda, azul-elétrico e âmbar) pelas variáveis do tema ativo (--theme-main, --theme-light, --theme-text). Os cards, botões de [Confirmar], [Contemplada], [Acesso], badges de [Pago] e modais adaptam-se imediatamente a qualquer paleta do perfil (Azul Royal, Grafite Escuro, Roxo Moderno, Azul Oceano e Coral).'
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
              content: 'Filtros Rápidos com Contadores Integrados: Abas de status ("Todas", "Aguardando", "Contempladas" e "Todos os Ciclos", "Pendentes", "Confirmados", "Em Atraso") reformuladas com contadores dinâmicos em pílulas elegantes, destacando a aba ativa na cor primária do tema.'
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
              content: 'Controle de Altura (Prevenção de Telas Gigantes): Aplicação de rolagem interna suave (max-h-[480px] overflow-y-auto) nas listas de cotas e contribuições, evitando a extensão infinita da página em consórcios com grande volume de participantes.'
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
              content: 'Padronização BRL e Limpeza Visual: Formatação de todos os valores monetários no padrão brasileiro (R$ 500,00) e remoção de textos redundantes no popover de notificações do sininho.'
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
              content: 'Validação e Testes Automatizados: Todos os 22 testes automatizados das suítes financeira, autenticação, permissões e notificações/auditoria foram executados e aprovados com 100% de sucesso.'
            }
          }
        ]
      }
    }
  ];

  try {
    const result = await appendToNotion(updateBlocks);
    console.log("✅ Atualização documentada com sucesso no Notion!", result.results?.length, "blocos adicionados.");
  } catch (err) {
    console.error("❌ Erro ao atualizar o Notion:", err);
    process.exit(1);
  }
}

run();
