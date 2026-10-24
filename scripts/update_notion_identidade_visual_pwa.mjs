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
  console.log("Registrando identidade visual, PWA e tela de carregamento animada no Notion...");

  const updateBlocks = [
    { object: 'block', type: 'divider', divider: {} },
    {
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ type: 'text', text: { content: '🪙 Identidade Visual, PWA Instalável e Loading Animado' } }]
      }
    },
    {
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [{
          type: 'text',
          text: { content: 'Aplicada a identidade visual oficial do Clube da Cota (comunidade ao redor da moeda) e configurado o app como PWA instalável na tela inicial do celular:' }
        }]
      }
    },
    bullet('Ícones: adicionados em public/ os ícones PWA (48 a 512 px), os maskable 192 e 512 (Android), apple-touch-icon 180x180 (iOS), favicon.ico, favicon-32x32 e favicon-16x16, além do logo vetorial icon-comunidade.svg.'),
    bullet('manifest.json: nome, short_name, lang pt-BR, scope, display standalone, orientação retrato, theme_color #044E3A (Verde Floresta), background_color #FFFFFF e ícones any/maskable em 192 e 512.'),
    bullet('Meta tags (layout.tsx): theme-color #044E3A, favicons, apple-touch-icon, meta tags apple-mobile-web-app-* e link do manifest, via metadata e viewport do Next.js.'),
    bullet('Tela de carregamento animada: novo componente AppLoadingScreen com logo "respirando", halo pulsante, anel girando e pontinhos de progresso, usando o verde da marca. Respeita prefers-reduced-motion.'),
    bullet('Logo no app: o componente AppLogo substituiu o ícone genérico no cabeçalho e na tela de login/cadastro.'),
    bullet('Observação: a instalação como PWA exige HTTPS (funciona em localhost e em produção). Ainda não há service worker, portanto não há suporte offline.'),
    bullet('Validação: TypeScript sem erros (tsc --noEmit) e suítes de testes financeira e de autenticação aprovadas.')
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
