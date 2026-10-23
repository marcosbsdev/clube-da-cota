import { NOTION_TOKEN, PAGE_ID } from './notion_config.mjs';

async function appendToNotion(children) {
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

const bullet = (content) => ({
  object: 'block',
  type: 'bulleted_list_item',
  bulleted_list_item: { rich_text: [{ type: 'text', text: { content } }] }
});

async function run() {
  console.log("Registrando sub-abas da Gestão do Grupo e isolamento da Trilha de Auditoria no Notion...");

  const updateBlocks = [
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🛡️ Gestão do Grupo: Sub-abas e Trilha de Auditoria Restrita (Pro Master & Super Admin)' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: 'A tela de Gestão do Grupo foi reorganizada em duas sub-abas para reduzir a quantidade de informação exibida de uma só vez e isolar o Histórico de Auditoria com controle de acesso por perfil:' }
        }]
      }
    },
    bullet('Aba "Painel Operacional" (todos os criadores): métricas, alerta de atraso, ordem de contemplação, comprovantes e controle de contribuições, agora em largura total. A antiga coluna lateral de auditoria foi removida, eliminando o aperto dos cards.'),
    bullet('Aba "Trilha de Auditoria" (exclusiva para PRO_MASTER e SUPER_ADMIN): indicadores de auditoria, filtros por tipo de evento (Todos, Pagamentos, Contemplações, Trocas, Edições), busca por responsável, cota ou justificativa, e listagem em grid de 2 colunas com rolagem interna.'),
    bullet('Controle de acesso: o seletor de abas só aparece para PRO_MASTER e SUPER_ADMIN. Perfis COMUM e PRO veem apenas o Painel Operacional, sem acesso à auditoria.'),
    bullet('Sininho de notificações: para PRO_MASTER e SUPER_ADMIN, o atalho "Ver Trilha de Auditoria (Governança)" abre diretamente a aba de auditoria (evento abrir-auditoria / hash #historico-auditoria). Para os demais perfis, o atalho leva à Gestão do Grupo.'),
    bullet('Paleta de cores: abas, indicadores e botões seguem as variáveis do tema selecionado no perfil (theme-main, theme-light, theme-text).'),
    bullet('Validação: TypeScript sem erros (tsc --noEmit) e suítes de testes financeira, autenticação e notificações/auditoria aprovadas.')
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
