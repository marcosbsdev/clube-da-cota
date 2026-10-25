# 018. Painel Super Admin para Gestão Avançada de Contas, Senhas e Governança de Usuários

**Data:** 25/10/2026  
**Status:** Aprovado  
**Autor:** Antigravity / Time de Arquitetura Clube da Cota  

---

## 1. Contexto e Motivação

Com o crescimento de consórcios e a entrada de múltiplos participantes no Clube da Cota (muitos dos quais são leigos ou cadastrados diretamente pelos organizadores em listas informais), surgiram quatro necessidades críticas de suporte e governança operacional:

1. **Correção de Erros de Digitação nos Cadastros:**
   Erros em nomes, chaves Pix incorretas ou números de telefone mal digitados que impediam a comunicação direta via WhatsApp e o envio correto de notificações.

2. **Atendimento a Usuários Leigos & Gestão de Senhas:**
   Participantes que esquecem suas credenciais, têm dificuldade com fluxos tradicionais de e-mail de recuperação ou foram cadastrados previamente com senhas provisórias. O Super Admin precisava de uma ferramenta prática para gerar senhas provisórias amigáveis (ex: `Cota#XXXX`) e disparar imediatamente no WhatsApp do participante com 1 clique.

3. **Unificação/Mesclagem de Cadastros Duplicados (Smart Merge):**
   Cenário comum onde um participante foi convidado para um consórcio com o e-mail pessoal e para outro com o e-mail profissional (ou com erro de digitação), gerando duas contas no sistema. O suporte precisava de uma operação atômica segura para fundir a conta duplicada na conta oficial, transferindo todas as cotas, parcelas pagas, comprovantes e consórcios criados sem perda de integridade relacional.

4. **Correção de Vínculos de Consórcios e Cotas (Raio-X do Usuário):**
   Capacidade de inspecionar todas as participações de um usuário e transferir a titularidade de cotas pontuais para o destinatário correto sem corromper o histórico financeiro.

5. **Exclusão Segura com Proteções Rígidas:**
   Possibilidade de excluir contas de teste ou duplicadas, mas com bloqueio intransponível contra auto-exclusão do Super Admin logado e proteção fiscal contra exclusão de usuários com pagamentos confirmados.

---

## 2. Decisão Técnica e Arquitetura

### 2.1. Controle de Acesso Estrito (RBAC)
Todas as Server Actions de administração exigem explicitamente `role === "SUPER_ADMIN"`. Tentativas de acesso por usuários `COMUM`, `PRO` ou `PRO_MASTER` são barradas imediatamente com erro amigável de autorização.

### 2.2. Novas Server Actions Implementadas (`src/app/actions.ts`)

| Ação | Responsabilidade |
| :--- | :--- |
| `getPainelAdminUsuariosAction` | Carrega todos os usuários, métricas globais (KPIs), cotas vinculadas, parcelas e últimos 30 logs de auditoria. |
| `atualizarDadosUsuarioAdminAction` | Edita Nome, E-mail (com validação estrita de unicidade), Telefone, Chave Pix, Tipo de Pix, Role e Validade de Plano SaaS. |
| `redefinirSenhaAdminAction` | Redefinição administrativa em modo Manual ou Aleatório Amigável (`Cota#XXXX`), gerando hash `bcrypt` e ativando a conta. |
| `gerarLinkResetWhatsAppAdminAction` | Cria texto formatado de suporte com senha provisória e URL codificada para abertura direta do WhatsApp Web/App. |
| `mesclarUsuariosAdminAction` | Transação atômica (`prisma.$transaction`) que migra cotas participantes (somando frações caso existam na mesma cota), parcelas, comprovantes e consórcios, apagando a conta duplicada e auditando a ação. |
| `transferirCotaAdminAction` | Transfere a titularidade de uma cota e suas parcelas vinculadas de um participante para outro. |
| `excluirUsuarioAdminAction` | Exclui contas vazias ou duplicadas, impedindo auto-exclusão do Super Admin e bloqueando usuários com pagamentos confirmados. |

### 2.3. Componente `AdminView.tsx`
Interface moderna estruturada em 3 abas principais:
- **Aba 1: Usuários & Contas 👥:** KPIs no topo, busca em tempo real com filtros por Role, tabela responsiva detalhada, modais de Edição de Cadastro, Gestão de Senha, Raio-X de Cotas e Exclusão Segura.
- **Aba 2: Assinaturas & Planos SaaS 💳:** Integração direta com `<GestaoAssinaturasAdmin />` para auditoria e aprovação de upgrades Pix dos planos PRO e PRO MASTER.
- **Aba 3: Trilha de Auditoria 📜:** Timeline de logs administrativos com identificação de autor, data/hora e justificativa.

### 2.4. Integração na Navegação
- **Desktop (`Header.tsx`):** Exibe o botão **Painel Admin 🛡️** na barra superior e atalho destacado no dropdown do perfil exclusivamente quando `currentUser.role === "SUPER_ADMIN"`.
- **Mobile (`BottomNav.tsx`):** Exibe a aba **Admin** na barra inferior fixada quando o usuário for Super Admin.
- **Página Principal (`page.tsx`):** Roteia dinamicamente para `<AdminView />` sob `activeTab === "admin"`.

---

## 3. Cobertura de Testes Automatizados

Criada a suíte `tests/admin_gestao_usuarios.test.mjs`, integrada ao comando `npm test`:
1. Bloqueio de acesso para usuários sem privilégios `SUPER_ADMIN`.
2. Edição de dados cadastrais e registro na trilha de auditoria (`AuditoriaLog`).
3. Redefinição administrativa de senha e validação de hash `bcrypt`.
4. Criação de estrutura relacional de consórcios, cotas e contribuições.
5. Mesclagem atômica de contas com transferência total de cotas e parcelas (`prisma.$transaction`).
6. Transferência pontual de cota entre participantes.
7. Proteção contra auto-exclusão do Super Admin e integridade de contas com movimentação financeira.

**Total de suítes no projeto:** 15 suítes (100% de aprovação).

---

## 4. Requisito Arquitetural Estrito: Proibição de Banners Estáticos Inline e Exclusividade do ToastModal Flutuante

> 🚨 **REGRA DE OURO ARQUITETURAL DE FEEDBACK VISUAL:**  
> Banners estáticos inline inseridos diretamente no fluxo da página (`mensagemSucesso && (...)` ou caixas verdes/vermelhas fixas no layout) estão **TERMINANTEMENTE PROIBIDOS** em todas as telas e componentes do sistema, incluindo painéis administrativos.

### Motivos Arquiteturais:
1. **Layout Shift Jarring:** O banner inline empurra o conteúdo da página para baixo no momento da exibição e puxa de volta, desestabilizando a rolagem.
2. **Invisibilidade em Telas Roladas:** Quando o usuário executa uma ação em formulários, modais ou tabelas longas (como na edição de cotas ou usuários), a página permanece rolada para baixo e o banner no topo fica completamente fora do campo visual do usuário.
3. **Padrão Exclusivo:** Todo e qualquer feedback de conclusão, erro, alerta ou confirmação de ações DEVE utilizar **EXCLUSIVAMENTE o componente `ToastModal` flutuante** (`src/components/ToastModal.tsx`), posicionado fixamente no topo da viewport (`fixed top-4 ... z-50`), com animação suave, ícone semântico e auto-dismiss em 4 segundos.

---

## 5. Consequências e Benefícios

- **Suporte Ágil e Sem Fricção:** O organizador master consegue resolver qualquer problema de cadastro, telefone ou senha em segundos direto pelo celular ou desktop.
- **Feedback Padronizado:** O usuário sempre recebe o feedback no topo da tela via `ToastModal` flutuante, sem poluição visual ou banners indesejados.
- **WhatsApp Integrado:** Envio de senhas provisórias com link pronto para a conversa com o cotista.
- **Banco de Dados Limpo e Unificado:** A mesclagem atômica previne contas fantasmas e evita duplicidade de participantes em consórcios.
- **Conformidade e Rastreabilidade Total:** Todas as ações geram registros imutáveis na tabela `AuditoriaLog`.
