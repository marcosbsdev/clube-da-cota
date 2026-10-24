export interface PlanoDetalhes {
  id: "COMUM" | "PRO" | "PRO_MASTER";
  nome: string;
  badge: string;
  valorMensal: number;
  valorFormatado: string;
  maxConsorciosAtivos: number;
  maxParticipantesPorConsorcio: number;
  temAuditoria: boolean;
  beneficios: string[];
}

export const DADOS_PAGAMENTO_UPGRADE = {
  favorecido: "Marcos Batista",
  chavePix: "markos.system@gmail.com",
  tipoChavePix: "E-mail",
  whatsapp: "(11) 96303-0266",
  whatsappSanitizado: "11963030266",
  proValor: "R$ 19,90/mês",
  proMasterValor: "R$ 29,90/mês",
  mensagemPadrao:
    "Para migração de plano, realize a transferência Pix para Marcos Batista (Chave Pix E-mail: markos.system@gmail.com | WhatsApp: (11) 96303-0266). Plano Pro: R$ 19,90 mensal | Plano Pro Master: R$ 29,90 mensal.",
};

export const PLANOS_INFO: Record<"COMUM" | "PRO" | "PRO_MASTER", PlanoDetalhes> = {
  COMUM: {
    id: "COMUM",
    nome: "Comum",
    badge: "bg-slate-100 text-slate-700 border-slate-200",
    valorMensal: 0,
    valorFormatado: "Gratuito",
    maxConsorciosAtivos: 1,
    maxParticipantesPorConsorcio: 10,
    temAuditoria: false,
    beneficios: [
      "Participa de consórcios como membro",
      "Pode criar até 1 consórcio ativo",
      "Até 10 participantes no grupo",
      "Acesso por Magic Link passwordless",
    ],
  },
  PRO: {
    id: "PRO",
    nome: "Pro",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    valorMensal: 19.9,
    valorFormatado: "R$ 19,90 / mês",
    maxConsorciosAtivos: 3,
    maxParticipantesPorConsorcio: 20,
    temAuditoria: false,
    beneficios: [
      "Até 3 consórcios ativos simultâneos",
      "Até 20 participantes por consórcio",
      "Gestão de cotas, repasses e comprovantes",
      "Links automáticos de WhatsApp para cotistas",
      "Preferências de Pix Direto vs Centralizado",
    ],
  },
  PRO_MASTER: {
    id: "PRO_MASTER",
    nome: "Pro Master",
    badge: "bg-purple-100 text-purple-800 border-purple-200",
    valorMensal: 29.9,
    valorFormatado: "R$ 29,90 / mês",
    maxConsorciosAtivos: Infinity,
    maxParticipantesPorConsorcio: Infinity,
    temAuditoria: true,
    beneficios: [
      "Consórcios ativos ilimitados",
      "Participantes ilimitados por grupo",
      "Trilha de Auditoria e Governança Avançada (RBAC)",
      "Histórico detalhado e imutável de todas as ações",
      "Prioridade máxima e suporte premium",
    ],
  },
};
