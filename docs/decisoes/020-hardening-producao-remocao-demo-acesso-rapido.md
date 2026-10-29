# 020. Hardening para Produção (PRD), Remoção de Contas de Teste e Menu Profissional de Usuário

**Data:** 28/10/2026  
**Status:** Aprovado  
**Autor:** Antigravity / Time de Arquitetura Clube da Cota  

---

## 1. Contexto e Motivação

Durante a fase de desenvolvimento e validação do MVP, foram incorporados facilitadores de teste para agilizar a navegação entre papéis e validação de fluxos:
1. **Acesso Rápido de Teste (1-Clique) no Login:** Um bloco no rodapé da tela inicial de autenticação que permitia entrar instantaneamente em contas pré-cadastradas sem digitar senha.
2. **Alternador de Contas no Topo da Aplicação (`Header.tsx`):** Um dropdown no avatar do usuário que listava todos os usuários do banco de dados e permitia assumir a identidade de qualquer usuário com 1 clique ("Alternar Conta de Teste").
3. **Terminologia Residual de Teste na Gestão (`CriadorView.tsx`):** Menções a *"Consórcio de Teste"* e *"rascunhos de teste"* nos botões e modais de exclusão.

Com a maturidade das regras de negócio, dos 4 níveis de acesso (RBAC), do módulo financeiro e da trilha de governança, o sistema entrou em fase de preparação para implantação em **Produção (PRD)**, tornando imperativo remover esses artifícios para garantir confidencialidade, segurança de acesso e uma experiência profissional de SaaS.

---

## 2. Decisões Técnicas e Arquitetura

### 2.1. Higienização da Tela de Autenticação (`AuthView.tsx`)
- **Remoção do Bloco de 1-Clique:** Eliminada a seção *"Acesso Rápido de Teste (1-Clique)"* do rodapé do card de autenticação.
- **Fluxo Oficial de Produção:** O acesso ao sistema ocorre estritamente por e-mail e senha criptografada (bcrypt), com suporte a cadastro autônomo e recuperação de senha segura via token descartável.

### 2.2. Menu Autêntico de Usuário no Header (`Header.tsx`)
- **Eliminação da Troca Arbitrária de Contas:** Removida a listagem de todos os participantes do sistema do dropdown superior.
- **Novo Menu SaaS de Perfil:**
  - Card de identificação com avatar, Nome, E-mail e badge do plano ativo (`formatRole(userRole)`).
  - Atalho direto para **"Meu Perfil & Configurações"** (`onChangeTab("perfil")`).
  - Atalho exclusivo para o **"Painel Super Admin"** (`onChangeTab("admin")`) visível apenas para contas com papel `SUPER_ADMIN`.
  - Botão de logout seguro **"Sair da Conta (Logout)"** com destaque visual em vermelho.

### 2.3. Padronização de Terminologia na Gestão de Consórcios (`CriadorView.tsx`)
- Substituição do rótulo *"Excluir Consórcio de Teste"* por **"Excluir Consórcio"**.
- Título do modal atualizado para **"Excluir Consórcio?"**.
- Textos descritivos higienizados: *"Encerre este grupo após a conclusão dos sorteios ou exclua grupos sem pagamentos"* e *"Ao excluir este consórcio, a sua vaga de 1 consórcio ativo será liberada imediatamente para criar um novo grupo!"*.
- Preservação integral da regra de ouro: consórcios com pagamentos confirmados permanecem estritamente bloqueados para exclusão física, exigindo o encerramento/arquivamento contábil.

---

## 3. Cobertura de Testes Automatizados

- Todas as 17 suítes de testes foram executadas e aprovadas com **100% de sucesso**:
  1. `tests/finance.test.mjs` (14 testes)
  2. `tests/auth.test.mjs` (6 testes)
  3. `tests/sanitize.test.mjs` (5 testes)
  4. `tests/participantes_repasse.test.mjs` (6 testes)
  5. `tests/planos_upgrade.test.mjs` (5 testes)
  6. `tests/assinaturas_gestao.test.mjs` (5 testes)
  7. `tests/consorcio_ciclo_vida.test.mjs` (4 testes)
  8. `tests/consorcio_vencido_gestao.test.mjs` (4 testes)
  9. `tests/notifications.test.mjs` (8 testes)
  10. `tests/cadastro_participante_link.test.mjs` (6 testes)
  11. `tests/perfil_dados.test.mjs` (5 testes)
  12. `tests/agenda_vinculo_participante.test.mjs` (6 testes)
  13. `tests/sorteio_ordem_contemplacao.test.mjs` (7 testes)
  14. `tests/export_cronograma_image.test.mjs` (5 testes)
  15. `tests/admin_gestao_usuarios.test.mjs` (7 testes)
  16. `tests/pix_pagamento_participante.test.mjs` (8 testes)
  17. `tests/pagination.test.mjs` (4 testes)
- **Compilação Next.js (`npm run build`):** Validação estrita de tipagem TypeScript e empacotamento estático/dinâmico sem advertências.

---

## 4. Consequências e Benefícios

- **Segurança da Informação:** Nenhum usuário comum ou participante externo consegue assumir a identidade de outros usuários sem credenciais legítimas.
- **Prontidão para PRD (Produção):** A interface reflete um produto de mercado profissional, pronto para onboarding de clientes reais.
- **Consistência Visual:** Eliminação de elementos auxiliares de desenvolvimento e poluição visual.
