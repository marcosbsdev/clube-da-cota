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
  console.log("Registrando MÃ³dulo de AutenticaÃ§Ã£o Real no Notion...");

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
            text: { content: 'ðŸ” MÃ³dulo de AutenticaÃ§Ã£o Real (Login, Cadastro, Logout & RecuperaÃ§Ã£o)' }
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
              content: 'Foi implementado o mÃ³dulo completo de autenticaÃ§Ã£o e controle de sessÃµes para o Clube da Cota, em conformidade com as diretrizes de seguranÃ§a da especificaÃ§Ã£o:'
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
          { type: 'text', text: { content: 'Login Seguro: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'ValidaÃ§Ã£o de e-mail e comparaÃ§Ã£o de senha via hash criptogrÃ¡fico bcrypt. SessÃµes gerenciadas via cookies HTTP-only de alta seguranÃ§a (clube_cota_session).' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Cadastro de Novos UsuÃ¡rios: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'FormulÃ¡rio completo com nome, e-mail, senha (mÃ­nimo 6 caracteres) e confirmaÃ§Ã£o, atribuindo perfil inicial Comum e ativando a conta.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'RecuperaÃ§Ã£o de Senha ("Esqueci minha senha"): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'GeraÃ§Ã£o de token temporÃ¡rio de redefiniÃ§Ã£o com validade de 1 hora (resetToken e resetExpiresAt adicionados ao modelo User do Prisma), permitindo definir nova senha com hash imediato.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Logout (Sair da Conta): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'BotÃ£o "Sair da Conta" disponÃ­vel no menu do Header superior e na aba Perfil, encerrando a sessÃ£o e retornando Ã  tela de login.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'Facilidade de DemonstraÃ§Ã£o (1-Clique): ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'Mantido bloco de atalhos rÃ¡pidos na tela de login para que avaliadores e testers possam alternar entre contas de teste sem necessidade de digitar credenciais repetidamente.' } }
        ]
      }
    },
    {
      object: 'block',
      type: 'bulleted_list_item',
      bulleted_list_item: {
        rich_text: [
          { type: 'text', text: { content: 'ValidaÃ§Ã£o Automatizada: ' }, annotations: { bold: true } },
          { type: 'text', text: { content: 'SuÃ­te de testes criada em tests/auth.test.mjs com 100% de aprovaÃ§Ã£o (5/5 testes cobrindo login correto, rejeiÃ§Ã£o de senha incorreta, cadastro, recuperaÃ§Ã£o com token e limpeza de dados).' } }
        ]
      }
    }
  ];

  await appendToNotion(updateBlocks);
  console.log("âœ… MÃ³dulo de autenticaÃ§Ã£o documentado com sucesso no Notion!");
}

run().catch(console.error);

