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

export type StatusAssinaturaVigencia = "PERMANENTE" | "VIGENTE" | "A_VENCER" | "EXPIRADO";

export interface VigenciaPlanoInfo {
  status: StatusAssinaturaVigencia;
  diasRestantes: number | null;
  dataExpiracao: Date | null;
  dataExpiracaoFormatada: string | null;
  isAtivo: boolean;
  alertaRenovacao: boolean;
  badgeTexto: string;
  badgeClasse: string;
  label: string;
}

/**
 * Calcula o status de vigência da assinatura do usuário com base no papel e na data de expiração.
 */
export function getVigenciaPlano(user: {
  role?: string;
  planoExpiraEm?: Date | string | null;
}): VigenciaPlanoInfo {
  const role = user.role || "COMUM";

  if (role === "COMUM") {
    return {
      status: "PERMANENTE",
      diasRestantes: null,
      dataExpiracao: null,
      dataExpiracaoFormatada: null,
      isAtivo: true,
      alertaRenovacao: false,
      badgeTexto: "Gratuito",
      badgeClasse: "bg-slate-100 text-slate-700 border-slate-200",
      label: "Plano Gratuito (1 consórcio ativo)",
    };
  }

  if (role === "SUPER_ADMIN") {
    return {
      status: "PERMANENTE",
      diasRestantes: null,
      dataExpiracao: null,
      dataExpiracaoFormatada: null,
      isAtivo: true,
      alertaRenovacao: false,
      badgeTexto: "Acesso Total",
      badgeClasse: "bg-purple-100 text-purple-800 border-purple-200",
      label: "Super Admin (Vitalício)",
    };
  }

  // Planos PRO e PRO_MASTER
  if (!user.planoExpiraEm) {
    return {
      status: "VIGENTE",
      diasRestantes: null,
      dataExpiracao: null,
      dataExpiracaoFormatada: "Vigência ativa",
      isAtivo: true,
      alertaRenovacao: false,
      badgeTexto: "Ativo",
      badgeClasse: "bg-emerald-100 text-emerald-800 border-emerald-200",
      label: "Assinatura Ativa",
    };
  }

  const expiraEm = new Date(user.planoExpiraEm);
  const agora = new Date();
  const diffMs = expiraEm.getTime() - agora.getTime();
  const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const dia = String(expiraEm.getDate()).padStart(2, "0");
  const mes = String(expiraEm.getMonth() + 1).padStart(2, "0");
  const ano = expiraEm.getFullYear();
  const dataExpiracaoFormatada = `${dia}/${mes}/${ano}`;

  if (diasRestantes <= 0) {
    return {
      status: "EXPIRADO",
      diasRestantes: 0,
      dataExpiracao: expiraEm,
      dataExpiracaoFormatada,
      isAtivo: false,
      alertaRenovacao: true,
      badgeTexto: "Expirado",
      badgeClasse: "bg-rose-100 text-rose-800 border-rose-200",
      label: `Assinatura expirou em ${dataExpiracaoFormatada}. Renove para desbloquear seus recursos.`,
    };
  }

  if (diasRestantes <= 5) {
    return {
      status: "A_VENCER",
      diasRestantes,
      dataExpiracao: expiraEm,
      dataExpiracaoFormatada,
      isAtivo: true,
      alertaRenovacao: true,
      badgeTexto: `Vence em ${diasRestantes}d`,
      badgeClasse: "bg-amber-100 text-amber-800 border-amber-200",
      label: `Sua assinatura vence em ${diasRestantes} ${
        diasRestantes === 1 ? "dia" : "dias"
      } (${dataExpiracaoFormatada}).`,
    };
  }

  return {
    status: "VIGENTE",
    diasRestantes,
    dataExpiracao: expiraEm,
    dataExpiracaoFormatada,
    isAtivo: true,
    alertaRenovacao: false,
    badgeTexto: `Vigente (${diasRestantes}d)`,
    badgeClasse: "bg-emerald-100 text-emerald-800 border-emerald-200",
    label: `Plano ativo até ${dataExpiracaoFormatada} (${diasRestantes} dias restantes).`,
  };
}

/**
 * Calcula a nova data de expiração somando dias (padrão 30 dias para mensalidade).
 * Se a assinatura ainda estiver no futuro, soma a partir da data futura (não perde dias pagos).
 */
export function calcularNovaDataExpiracao(
  dataAtualExpiracao?: Date | string | null,
  diasAdicionais: number = 30
): Date {
  const agora = new Date();
  let baseDate = agora;

  if (dataAtualExpiracao) {
    const dataExistente = new Date(dataAtualExpiracao);
    if (dataExistente > agora) {
      baseDate = dataExistente;
    }
  }

  const novaData = new Date(baseDate.getTime() + diasAdicionais * 24 * 60 * 60 * 1000);
  return novaData;
}

