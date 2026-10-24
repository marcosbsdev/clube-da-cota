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
  console.log("Registrando correção de vazamento de dados sensíveis e pendências de segurança no Notion...");

  const updateBlocks = [
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🔒 Segurança: Remoção de Dados Sensíveis do Navegador e Pendências para Produção' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: 'Auditoria de segurança nos dados enviados ao navegador. Foi confirmado, com consulta real ao banco, que a resposta de getConsorcioData incluía hashes de senha e tokens de acesso de outros usuários do consórcio. Correção aplicada:' }
        }]
      }
    },
    bullet('Vazamento confirmado: passwordHash do criador, dos participantes e dos responsáveis por auditorias, além de tokenAcesso das cotas e dos participantes, eram enviados a qualquer membro do consórcio.'),
    bullet('Correção: novo módulo src/lib/sanitize.ts (sanitizarParaCliente) aplicado em getConsorcioData, inclusive no currentUser. Nunca saem do servidor: passwordHash, inviteToken, resetToken e datas de expiração.'),
    bullet('Links de acesso (tokenAcesso): enviados apenas ao criador do consórcio e a admins (PRO_MASTER e SUPER_ADMIN), que precisam deles para compartilhar o link de cada cota.'),
    bullet('Notificações: confirmado que o escopo por consórcio está correto (cada usuário só carrega consórcios em que é criador ou participante, e admins veem todos). Mantida a transparência entre membros do mesmo consórcio.'),
    bullet('Testes: novo tests/sanitize.test.mjs (5 testes) incluído no npm test. Total de 27 testes aprovados (financeiro, autenticação, sanitização, notificações) e TypeScript sem erros.'),
    {
      object: 'block',
      type: 'heading_3',
      heading_3: {
        rich_text: [{ type: 'text', text: { content: '⚠️ Pendências de segurança antes de publicar em produção' } }]
      }
    },
    bullet('Login rápido sem senha: quickLoginAction entra como qualquer usuário apenas com o ID, e a lista todosUsuarios (com IDs e e-mails) é enviada antes do login. Remover ou restringir ao ambiente de desenvolvimento.'),
    bullet('Sessão forjável: o cookie clube_cota_session guarda o ID do usuário em texto puro, sem assinatura. Adotar sessão assinada (JWT) ou sessão persistida no banco.'),
    bullet('Recuperação de senha: forgotPasswordAction devolve o token de redefinição na própria resposta. Enviar o token por e-mail e não expô-lo ao solicitante.'),
    bullet('Senhas já expostas: se existirem usuários reais, trocar as senhas, pois os hashes já circularam antes desta correção.')
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
