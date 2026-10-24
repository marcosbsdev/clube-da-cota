"use client";

import React, { useState, useEffect } from "react";
import {
  TipoChavePix,
  TIPOS_CHAVE_PIX,
  getTipoChavePixLabel,
  calcularBoladaCiclo,
  calcularIndicadoresConsorcio,
  calcularValorCiclo,
  formatarDataSegura,
  formatarMesAnoCiclo,
  formatarMoedaBRL,
  isModeloAcrescimo,
} from "@/lib/finance";
import { ToastModal, ToastData } from "@/components/ToastModal";
import {
  confirmPaymentAction,
  revertPaymentAction,
  rejectReceiptAction,
  updateConsorcioInfoAction,
  swapCotaPositionsAction,
  toggleCotaContempladaAction,
} from "@/app/actions";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  Filter,
  RotateCcw,
  ShieldCheck,
  Check,
  FolderKanban,
  Layers,
  Plus,
  ChevronDown,
  ArrowRight,
  TrendingUp,
  Users,
  Edit3,
  Lock,
  X,
  ArrowLeftRight,
  Share2,
  Copy,
  ExternalLink,
  MessageCircle,
  Sparkles,
  Calendar,
  Search,
} from "lucide-react";

function formatarDataHoraAuditoria(d: string | Date) {
  const date = new Date(d);
  return `${date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}, ${date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })}`;
}

function getAcaoAuditoriaMeta(tipoAcao: string) {
  switch (tipoAcao) {
    case "TROCA_POSICAO_COTA":
      return {
        label: "Permuta de Contemplação",
        bg: "bg-amber-100 text-amber-900 border-amber-200/80",
        icon: ArrowLeftRight,
      };
    case "CONTEMPLACAO_COTA":
      return {
        label: "Contemplação Registrada",
        bg: "bg-emerald-100 text-emerald-900 border-emerald-200/80",
        icon: CheckCircle2,
      };
    case "REVERSAO_CONTEMPLACAO_COTA":
      return {
        label: "Reversão de Contemplação",
        bg: "bg-orange-100 text-orange-900 border-orange-200/80",
        icon: RotateCcw,
      };
    case "EDICAO_DADOS_CONSORCIO":
      return {
        label: "Edição de Dados",
        bg: "bg-blue-100 text-blue-900 border-blue-200/80",
        icon: Edit3,
      };
    case "CONFIRMACAO_PAGAMENTO":
      return {
        label: "Pagamento Confirmado",
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
        icon: CheckCircle2,
      };
    case "ESTORNO_PAGAMENTO":
      return {
        label: "Estorno de Pagamento",
        bg: "bg-rose-100 text-rose-900 border-rose-200/80",
        icon: RotateCcw,
      };
    case "RECUSA_COMPROVANTE":
      return {
        label: "Comprovante Recusado",
        bg: "bg-rose-100 text-rose-900 border-rose-200/80",
        icon: X,
      };
    case "CRIACAO_CONSORCIO":
      return {
        label: "Consórcio Criado",
        bg: "bg-violet-100 text-violet-900 border-violet-200/80",
        icon: FolderKanban,
      };
    default:
      return {
        label: tipoAcao.replace(/_/g, " "),
        bg: "bg-slate-100 text-slate-800 border-slate-200/80",
        icon: FileText,
      };
  }
}

function getParticipantesCota(numero: number, consorcio: any): string {
  if (!consorcio?.cotas) return "";
  const cota = consorcio.cotas.find((c: any) => c.numero === Number(numero));
  if (!cota || !cota.participantes) return "";
  return cota.participantes.map((p: any) => p.usuario?.name).filter(Boolean).join(" & ") || "";
}

function getNomeUsuarioAfetado(usuarioId: string, consorcio: any): string {
  if (!usuarioId || !consorcio) return "";
  for (const c of consorcio.cotas || []) {
    for (const p of c.participantes || []) {
      if (p.usuarioId === usuarioId || p.usuario?.id === usuarioId) {
        return p.usuario?.name || "";
      }
    }
  }
  const contrib = consorcio.contribuicoes?.find((cb: any) => cb.usuarioId === usuarioId);
  if (contrib?.usuario?.name) return contrib.usuario.name;
  return "";
}

function renderAuditoriaDetalhes(a: any, consorcio: any) {
  let parsedJson: any = null;
  if (typeof a.detalhes === "string" && (a.detalhes.startsWith("{") || a.detalhes.startsWith("["))) {
    try {
      parsedJson = JSON.parse(a.detalhes);
    } catch {
      parsedJson = null;
    }
  }

  // 1. Caso TROCA_POSICAO_COTA (seja JSON estruturado ou texto plano do teste)
  if (
    a.tipoAcao === "TROCA_POSICAO_COTA" ||
    (parsedJson && parsedJson.cota1 && parsedJson.cota2)
  ) {
    let num1 = parsedJson?.cota1?.numero;
    let num2 = parsedJson?.cota2?.numero;
    let anterior1 = parsedJson?.cota1?.ordemAnterior;
    let novo1 = parsedJson?.cota1?.novaOrdem;
    let anterior2 = parsedJson?.cota2?.ordemAnterior;
    let novo2 = parsedJson?.cota2?.novaOrdem;
    let nome1 = parsedJson?.cota1?.participantes;
    let nome2 = parsedJson?.cota2?.participantes;

    // Se não veio do JSON, extrai por regex do texto
    if (!num1 || !num2) {
      const match = typeof a.detalhes === "string" ? a.detalhes.match(/Cota #(\d+).*?ciclo #(\d+).*?Cota #(\d+).*?ciclo #(\d+)/i) : null;
      if (match) {
        num1 = Number(match[1]);
        novo1 = Number(match[2]);
        num2 = Number(match[3]);
        novo2 = Number(match[4]);
      }
    }

    if (!nome1 && num1) nome1 = getParticipantesCota(num1, consorcio);
    if (!nome2 && num2) nome2 = getParticipantesCota(num2, consorcio);

    if (num1 && num2) {
      return (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider pb-1 border-b border-slate-100">
            <span>Participantes</span>
            <span>Novo Ciclo</span>
          </div>

          {/* Participante 1 */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 gap-2">
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 leading-tight">
                {nome1 || `Cota #${num1}`}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Cota #{num1} {anterior1 ? `• era Ciclo #${anterior1}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-950 font-black text-xs rounded-lg border border-amber-300 shadow-2xs">
                Ciclo #{novo1}
              </span>
            </div>
          </div>

          {/* Participante 2 */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50/80 rounded-xl border border-slate-100 gap-2">
            <div className="min-w-0">
              <p className="text-xs font-black text-slate-900 leading-tight">
                {nome2 || `Cota #${num2}`}
              </p>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Cota #{num2} {anterior2 ? `• era Ciclo #${anterior2}` : ""}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="inline-block px-2.5 py-1 bg-amber-100 text-amber-950 font-black text-xs rounded-lg border border-amber-300 shadow-2xs">
                Ciclo #{novo2}
              </span>
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. Caso CONFIRMACAO_PAGAMENTO
  if (a.tipoAcao === "CONFIRMACAO_PAGAMENTO") {
    const matchPag = typeof a.detalhes === "string" ? a.detalhes.match(/R\$\s*([\d.,]+).*?participante\s+(.*?)\s+marcada como\s*(PAGO)/i) : null;
    if (matchPag) {
      const valor = matchPag[1];
      const nomePart = matchPag[2];
      return (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-900 leading-tight">{nomePart}</p>
            <p className="text-[11px] text-slate-500 mt-0.5">Parcela mensal confirmada</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-block text-xs font-black text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
              R$ {valor} • PAGO
            </span>
          </div>
        </div>
      );
    }
  }

  // 3. Caso ESTORNO_PAGAMENTO
  if (a.tipoAcao === "ESTORNO_PAGAMENTO") {
    const matchEstorno = typeof a.detalhes === "string" ? a.detalhes.match(/R\$\s*([\d.,]+).*?revertido para\s*(\w+)/i) : null;
    const nomePart = a.usuarioAfetadoId ? getNomeUsuarioAfetado(a.usuarioAfetadoId, consorcio) : "";
    if (matchEstorno) {
      const valor = matchEstorno[1];
      const status = matchEstorno[2];
      return (
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
          <div className="min-w-0">
            {nomePart && <p className="text-xs font-black text-slate-900 leading-tight">{nomePart}</p>}
            <p className="text-[11px] text-slate-500 mt-0.5">Pagamento estornado / revertido</p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="inline-block text-xs font-black text-rose-800 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shadow-2xs">
              R$ {valor} • {status}
            </span>
          </div>
        </div>
      );
    }
  }

  // 4. Caso CONTEMPLACAO_COTA ou REVERSAO_CONTEMPLACAO_COTA
  if (a.tipoAcao === "CONTEMPLACAO_COTA" || a.tipoAcao === "REVERSAO_CONTEMPLACAO_COTA") {
    const num = parsedJson?.numero;
    const nomePart = parsedJson?.participantes || (num ? getParticipantesCota(num, consorcio) : "");
    const ciclo = parsedJson?.ordemSorteio || num;
    const isContemplada = a.tipoAcao === "CONTEMPLACAO_COTA" || parsedJson?.novoStatus === "CONTEMPLADA";

    return (
      <div className="bg-white p-3 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-2 shadow-2xs">
        <div className="min-w-0">
          <p className="text-xs font-black text-slate-900 leading-tight">
            {nomePart || `Cota #${num}`}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cota #{num} {ciclo ? `• Ciclo #${ciclo}` : ""}
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span
            className={`inline-block text-xs font-black px-2.5 py-1 rounded-lg border shadow-2xs ${
              isContemplada
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-700 border-slate-200"
            }`}
          >
            {isContemplada ? "🏆 Contemplada" : "Ativa"}
          </span>
        </div>
      </div>
    );
  }

  // 5. Caso EDICAO_DADOS_CONSORCIO com JSON
  if (parsedJson && (parsedJson.antes || parsedJson.depois)) {
    const antes = parsedJson.antes || {};
    const depois = parsedJson.depois || {};
    const mudancas: { campo: string; de?: string | null; para?: string | null }[] = [];

    if (antes.nome !== depois.nome && (antes.nome || depois.nome)) {
      mudancas.push({ campo: "Nome do Consórcio", de: antes.nome, para: depois.nome });
    }
    if (antes.finalidade !== depois.finalidade && (antes.finalidade || depois.finalidade)) {
      mudancas.push({ campo: "Finalidade", de: antes.finalidade, para: depois.finalidade });
    }
    const pagAntes = antes.chavePix || antes.dadosPagamento;
    const pagDepois = depois.chavePix || depois.dadosPagamento;
    if (pagAntes !== pagDepois && (pagAntes || pagDepois)) {
      mudancas.push({ campo: "Dados de Pagamento (PIX)", de: pagAntes, para: pagDepois });
    }
    if (antes.regras !== depois.regras && (antes.regras || depois.regras)) {
      mudancas.push({ campo: "Regras Gerais", de: antes.regras, para: depois.regras });
    }

    if (mudancas.length === 0) {
      return (
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 text-xs text-slate-700 leading-relaxed shadow-2xs">
          Dados cadastrais e instruções de pagamento atualizados.
        </div>
      );
    }

    return (
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 space-y-2 text-xs shadow-2xs">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          Campos alterados:
        </p>
        <div className="space-y-1.5">
          {mudancas.map((m, idx) => (
            <div key={idx} className="p-2 bg-slate-50/80 rounded-lg border border-slate-100 text-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                {m.campo}
              </span>
              <div className="flex items-center gap-1.5 flex-wrap text-slate-800">
                {m.de && (
                  <>
                    <span className="text-slate-400 line-through break-all">{m.de}</span>
                    <span className="text-slate-400">→</span>
                  </>
                )}
                <span className="font-bold text-slate-900 break-all">{m.para || "(vazio)"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // 6. Caso padrão / texto plano: enriquece menções a "Cota #X" com o nome do participante se possível
  let textoFinal = a.detalhes;
  if (typeof textoFinal === "string") {
    textoFinal = textoFinal.replace(/Cota #(\d+)/gi, (match, numStr) => {
      const numCota = Number(numStr);
      const nome = getParticipantesCota(numCota, consorcio);
      return nome && !textoFinal.includes(nome) ? `${match} (${nome})` : match;
    });
  }

  return (
    <div className="bg-white p-3 rounded-2xl border border-slate-200/80 text-xs text-slate-800 font-medium leading-relaxed break-words shadow-2xs">
      {textoFinal}
    </div>
  );
}

interface CriadorViewProps {
  consorcio: any;
  currentUser: any;
  todosConsorcios?: any[];
  onSelecionarConsorcio?: (id: string) => void;
  onCriarNovoConsorcio?: () => void;
  onAtualizarConsorcio?: () => void;
}

export function CriadorView({
  consorcio,
  currentUser,
  todosConsorcios = [],
  onSelecionarConsorcio,
  onCriarNovoConsorcio,
  onAtualizarConsorcio,
}: CriadorViewProps) {
  const [modoVisao, setModoVisao] = useState<"DASHBOARD" | "LISTA_CONSORCIOS">(
    consorcio ? "DASHBOARD" : "LISTA_CONSORCIOS"
  );

  // Sub-abas de Gestão: Operacional vs Trilha de Auditoria (Exclusivo Pro Master e Super Admin)
  const isPrivilegiadoAuditoria = currentUser?.role === "PRO_MASTER" || currentUser?.role === "SUPER_ADMIN";
  const [abaGestao, setAbaGestao] = useState<"OPERACIONAL" | "AUDITORIA">("OPERACIONAL");
  const [buscaAuditoria, setBuscaAuditoria] = useState("");
  const [filtroTipoAuditoria, setFiltroTipoAuditoria] = useState<string>("TODOS");

  // Listener para abrir a aba de auditoria via evento ou hash
  useEffect(() => {
    const handleAbrirAuditoria = () => {
      if (isPrivilegiadoAuditoria) {
        setAbaGestao("AUDITORIA");
        setTimeout(() => {
          const elem = document.getElementById("historico-auditoria");
          if (elem) elem.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    };

    window.addEventListener("abrir-auditoria", handleAbrirAuditoria);
    if (window.location.hash === "#historico-auditoria" && isPrivilegiadoAuditoria) {
      setAbaGestao("AUDITORIA");
    }

    return () => {
      window.removeEventListener("abrir-auditoria", handleAbrirAuditoria);
    };
  }, [isPrivilegiadoAuditoria]);
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [modalEstornoAberto, setModalEstornoAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [toast, setToast] = useState<ToastData | null>(null);

  // Estado da Confirmação de Recebimento de Mensalidade
  const [modalConfirmarPagamentoAberto, setModalConfirmarPagamentoAberto] = useState(false);
  const [contribuicaoParaConfirmar, setContribuicaoParaConfirmar] = useState<any>(null);
  const [justificativaConfirmacao, setJustificativaConfirmacao] = useState("Pagamento conferido e confirmado pelo criador.");
  const [isConfirmandoPagamento, setIsConfirmandoPagamento] = useState(false);

  // Estado da Confirmação de Contemplação / Reversão
  const [modalContemplacaoAberto, setModalContemplacaoAberto] = useState(false);
  const [cotaAlvoContemplacao, setCotaAlvoContemplacao] = useState<any>(null);
  const [acaoContemplacao, setAcaoContemplacao] = useState<"CONTEMPLADA" | "ATIVA">("CONTEMPLADA");
  const [justificativaContemplacao, setJustificativaContemplacao] = useState("");
  const [isSalvandoContemplacao, setIsSalvandoContemplacao] = useState(false);

  // Estado da Edição de Consórcio
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [editNome, setEditNome] = useState(consorcio?.nome || "");
  const [editFinalidade, setEditFinalidade] = useState(consorcio?.finalidade || "");
  const [editRegras, setEditRegras] = useState(consorcio?.regras || "");
  const [editTipoChavePix, setEditTipoChavePix] = useState<TipoChavePix>(
    (consorcio?.tipoChavePix as TipoChavePix) || "CHAVE_ALEATORIA"
  );
  const [editChavePix, setEditChavePix] = useState(consorcio?.chavePix || "");
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  // Estado da Troca de Posição de Cotas
  const [modalTrocaAberto, setModalTrocaAberto] = useState(false);
  const [trocaCotaId1, setTrocaCotaId1] = useState("");
  const [trocaCotaId2, setTrocaCotaId2] = useState("");
  const [trocaJustificativa, setTrocaJustificativa] = useState("");
  const [salvandoTroca, setSalvandoTroca] = useState(false);
  const [erroTroca, setErroTroca] = useState("");

  // Estado do Compartilhamento de Link do Participante (Passwordless)
  const [modalCompartilharAberto, setModalCompartilharAberto] = useState(false);
  const [cotaCompartilhar, setCotaCompartilhar] = useState<any>(null);
  const [linkCopiadoIdx, setLinkCopiadoIdx] = useState<number | null>(null);

  // Filtro de visualização do sorteio/contemplação no painel
  const [filtroSorteioCriador, setFiltroSorteioCriador] = useState<"TODAS" | "AGUARDANDO" | "CONTEMPLADAS">("TODAS");

  const handleCopiarLinkParticipante = (token: string, idx: number) => {
    if (!token) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/participante/${token}`;
    navigator.clipboard.writeText(url);
    setLinkCopiadoIdx(idx);
    setTimeout(() => setLinkCopiadoIdx(null), 2500);
  };

  if (!consorcio && todosConsorcios.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center border border-slate-200/80 shadow-sm max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 bg-theme-light rounded-2xl flex items-center justify-center text-theme-text mx-auto">
          <FolderKanban className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-slate-900 text-lg">Nenhum Consórcio Ativo</h3>
        <p className="text-xs text-slate-500">
          Você ainda não administra nenhum grupo de consórcio. Crie seu primeiro grupo agora mesmo!
        </p>
        {onCriarNovoConsorcio && (
          <button
            onClick={onCriarNovoConsorcio}
            className="py-3 px-5 bg-theme-main text-white font-bold rounded-2xl text-xs sm:text-sm inline-flex items-center gap-2 shadow-md hover:opacity-90 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Criar Novo Consórcio</span>
          </button>
        )}
      </div>
    );
  }

  // Visão em Lista / Cards de Todos os Consórcios
  if (modoVisao === "LISTA_CONSORCIOS" || !consorcio) {
    return (
      <div className="space-y-6">
        {/* Cabeçalho da Central */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-theme-light text-theme-text flex items-center justify-center shadow-sm flex-shrink-0">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Painel Administrativo
                </span>
                <span className="text-[10px] font-bold bg-theme-light text-theme-text px-2 py-0.5 rounded-full">
                  {todosConsorcios.length} consórcio(s)
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-0.5">
                Meus Consórcios Administrados
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {consorcio && (
              <button
                onClick={() => setModoVisao("DASHBOARD")}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5"
              >
                <span>Voltar ao Dashboard</span>
              </button>
            )}
            {onCriarNovoConsorcio && (
              <button
                onClick={onCriarNovoConsorcio}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-theme-main hover:opacity-90 text-white transition flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Novo Consórcio</span>
              </button>
            )}
          </div>
        </div>

        {/* Grid de Cards de Consórcios */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todosConsorcios.map((c: any) => {
            const isAtivoAtual = c.id === consorcio?.id;
            return (
              <div
                key={c.id}
                className={`bg-white rounded-3xl p-5 sm:p-6 border transition flex flex-col justify-between ${
                  isAtivoAtual
                    ? "border-theme-main shadow-md ring-2 ring-theme-main/10"
                    : "border-slate-200/80 shadow-sm hover:shadow-md"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {c.status}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {c.papel}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-theme-light text-theme-text">
                          {c.frequencia}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900">{c.nome}</h3>
                      {c.finalidade && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{c.finalidade}</p>
                      )}
                    </div>

                    {isAtivoAtual && (
                      <span className="text-[10px] font-bold bg-theme-light text-theme-text px-2.5 py-1 rounded-xl flex items-center gap-1 flex-shrink-0">
                        <Check className="w-3.5 h-3.5" />
                        <span>Selecionado</span>
                      </span>
                    )}
                  </div>

                  {/* Métricas Rápidas */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-4">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-semibold block">Total Cotas</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800">{c.totalCotas}</span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-semibold block">Valor Cota</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800">
                        R$ {c.valorCota.toFixed(0)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-semibold block">Bolada</span>
                      <span className="text-xs sm:text-sm font-black text-theme-text truncate block">
                        {isModeloAcrescimo(c.modeloContribuicao)
                          ? `${formatarMoedaBRL(c.valorCota * c.totalCotas)} a ${formatarMoedaBRL(
                              calcularValorCiclo(c.totalCotas, c.valorCota, c.modeloContribuicao, c.valorAcrescimo) * c.totalCotas
                            )}`
                          : formatarMoedaBRL(c.valorCota * c.totalCotas)}
                      </span>
                    </div>
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                      <span className="text-[10px] text-slate-400 font-semibold block">Membros</span>
                      <span className="text-xs sm:text-sm font-black text-slate-800">
                        {c.totalParticipantes}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso de Arrecadação */}
                  <div className="space-y-1.5 mb-5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500 font-medium">Arrecadação:</span>
                      <span className="font-bold text-slate-800">
                        R$ {c.totalArrecadado.toFixed(2)} ({c.percentualArrecadado}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-theme-main h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, c.percentualArrecadado)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Criado em {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                  </span>
                  <button
                    onClick={() => {
                      if (onSelecionarConsorcio) {
                        onSelecionarConsorcio(c.id);
                      }
                      setModoVisao("DASHBOARD");
                    }}
                    className={`py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm ${
                      isAtivoAtual
                        ? "bg-slate-900 hover:bg-black text-white"
                        : "bg-theme-main hover:opacity-90 text-white"
                    }`}
                  >
                    <span>Entrar no Dashboard</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card Pontilhado para Criar Novo Consórcio */}
          {onCriarNovoConsorcio && (
            <button
              onClick={onCriarNovoConsorcio}
              className="min-h-[220px] rounded-3xl border-2 border-dashed border-slate-300 hover:border-theme-main bg-slate-50/50 hover:bg-white p-6 flex flex-col items-center justify-center gap-3 text-slate-500 hover:text-theme-text transition group"
            >
              <div className="w-12 h-12 rounded-2xl bg-white group-hover:bg-theme-light border border-slate-200 group-hover:border-theme-main flex items-center justify-center transition shadow-xs">
                <Plus className="w-6 h-6" />
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">Criar Outro Consórcio</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inicie um novo grupo com cotas e prazos personalizados
                </p>
              </div>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Calcula indicadores oficiais
  const kpis = calcularIndicadoresConsorcio(consorcio.contribuicoes);

  // Comprovantes pendentes para análise (Requisito das páginas 79 e 82 do PDF)
  const comprovantesPendentes = consorcio.contribuicoes.filter(
    (c: any) => c.comprovante && c.comprovante.status === "PENDENTE"
  );

  // Contribuições em atraso (Alerta em destaque)
  const contribuicoesAtrasadas = consorcio.contribuicoes.filter(
    (c: any) => c.status === "EM_ATRASO"
  );

  // Lista filtrada para a tabela/relatório
  const listaFiltrada = consorcio.contribuicoes.filter((c: any) => {
    if (filtroStatus === "TODOS") return true;
    return c.status === filtroStatus;
  });

  const abrirModalConfirmarPagamento = (contribuicao: any) => {
    setContribuicaoParaConfirmar(contribuicao);
    setJustificativaConfirmacao("Pagamento conferido e confirmado pelo criador.");
    setModalConfirmarPagamentoAberto(true);
  };

  const handleConfirmarPagamento = (contribuicaoId: string) => {
    const item = consorcio.contribuicoes.find((c: any) => c.id === contribuicaoId);
    if (item) {
      abrirModalConfirmarPagamento(item);
    }
  };

  const handleExecutarConfirmacaoPagamento = async () => {
    if (!contribuicaoParaConfirmar) return;
    setIsConfirmandoPagamento(true);
    try {
      const res = await confirmPaymentAction(
        contribuicaoParaConfirmar.id,
        currentUser.id,
        justificativaConfirmacao.trim() || "Pagamento conferido e confirmado pelo criador."
      );
      if (res.success) {
        setModalConfirmarPagamentoAberto(false);
        const nomeParticipante = contribuicaoParaConfirmar.usuario?.name || "Participante";
        const cotaNum = contribuicaoParaConfirmar.cota?.numero;
        const valorFormatado = formatarMoedaBRL(contribuicaoParaConfirmar.valorPrevisto);

        setToast({
          titulo: "Recebimento Confirmado!",
          mensagem: `A mensalidade de ${valorFormatado} da Cota #${cotaNum} (${nomeParticipante}) foi marcada como PAGA.`,
          tipo: "success",
        });

        if (onAtualizarConsorcio) {
          await onAtualizarConsorcio();
        }
      } else {
        alert(res.error || "Não foi possível confirmar o recebimento.");
      }
    } catch (err: any) {
      alert("Erro ao confirmar recebimento: " + err.message);
    } finally {
      setIsConfirmandoPagamento(false);
    }
  };

  const handleSalvarEstorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSelecionado || !motivoTexto.trim()) return;

    await revertPaymentAction(itemSelecionado.id, currentUser.id, motivoTexto);
    setModalEstornoAberto(false);
    setMotivoTexto("");
    setToast({
      titulo: "Pagamento Revertido",
      mensagem: "A mensalidade retornou para pendente e foi registrada na auditoria.",
      tipo: "info",
    });
  };

  const handleSalvarRecusaComprovante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSelecionado || !motivoTexto.trim()) return;

    await rejectReceiptAction(itemSelecionado.comprovante.id, currentUser.id, motivoTexto);
    setModalRecusaAberto(false);
    setMotivoTexto("");
    setToast({
      titulo: "Comprovante Recusado",
      mensagem: "O comprovante foi recusado e o participante poderá reenviar.",
      tipo: "warning",
    });
  };

  // Exportação simples para CSV (Requisito da página 82 do PDF)
  const exportarCSV = () => {
    let csv = "Ciclo,Cota,Participante,Valor,Vencimento,Status\n";
    consorcio.contribuicoes.forEach((c: any) => {
      const venc = new Date(c.dataVencimento).toLocaleDateString("pt-BR");
      csv += `Ciclo #${c.numeroCiclo},Cota #${c.cota?.numero},"${c.usuario?.name}",R$ ${c.valorPrevisto.toFixed(2)},${venc},${c.status}\n`;
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `relatorio_${consorcio.nome.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatarData = (d: string) => {
    return formatarDataSegura(d);
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim()) {
      setErroEdicao("O nome do consórcio é obrigatório.");
      return;
    }

    if (!editChavePix.trim()) {
      setErroEdicao("A chave Pix do consórcio é obrigatória.");
      return;
    }

    setSalvandoEdicao(true);
    setErroEdicao("");

    const res = await updateConsorcioInfoAction({
      consorcioId: consorcio.id,
      usuarioId: currentUser.id,
      nome: editNome,
      finalidade: editFinalidade,
      regras: editRegras,
      tipoChavePix: editTipoChavePix,
      chavePix: editChavePix.trim(),
      dadosPagamento: editChavePix.trim(),
    });

    setSalvandoEdicao(false);

    if (res.success) {
      setToast({
        titulo: "Consórcio Atualizado!",
        mensagem: "Informações do consórcio atualizadas com sucesso.",
        tipo: "success",
      });
      setModalEditarAberto(false);
      if (onAtualizarConsorcio) {
        onAtualizarConsorcio();
      }
    } else {
      setErroEdicao(res.error || "Erro ao atualizar consórcio.");
    }
  };

  const handleSalvarTroca = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trocaCotaId1 || !trocaCotaId2) {
      setErroTroca("Selecione as duas cotas para realizar a troca.");
      return;
    }

    setSalvandoTroca(true);
    setErroTroca("");

    const res = await swapCotaPositionsAction({
      consorcioId: consorcio.id,
      usuarioId: currentUser.id,
      cotaId1: trocaCotaId1,
      cotaId2: trocaCotaId2,
      justificativa: trocaJustificativa,
    });

    setSalvandoTroca(false);

    if (res.success) {
      setToast({
        titulo: "Posições Trocadas!",
        mensagem: res.message || "A nova ordem das cotas foi definida com sucesso.",
        tipo: "success",
      });
      setModalTrocaAberto(false);
      setTrocaCotaId1("");
      setTrocaCotaId2("");
      setTrocaJustificativa("");
      if (onAtualizarConsorcio) {
        onAtualizarConsorcio();
      }
    } else {
      setErroTroca(res.error || "Erro ao trocar posições.");
    }
  };

  const abrirModalContemplacao = (cota: any, novoStatus: "CONTEMPLADA" | "ATIVA") => {
    setCotaAlvoContemplacao(cota);
    setAcaoContemplacao(novoStatus);
    const pos = cota.ordemSorteio || cota.numero;
    if (novoStatus === "CONTEMPLADA") {
      setJustificativaContemplacao(`Cota #${cota.numero} contemplada no sorteio do Ciclo #${pos}.`);
    } else {
      setJustificativaContemplacao(`Contemplação da cota #${cota.numero} revertida para aguardando pelo criador.`);
    }
    setModalContemplacaoAberto(true);
  };

  const handleToggleContemplada = (cotaId: string, novoStatus: "ATIVA" | "CONTEMPLADA") => {
    const cota = consorcio.cotas.find((c: any) => c.id === cotaId);
    if (cota) {
      abrirModalContemplacao(cota, novoStatus);
    }
  };

  const handleConfirmarAcaoContemplacao = async () => {
    if (!cotaAlvoContemplacao) return;
    setIsSalvandoContemplacao(true);
    try {
      const res = await toggleCotaContempladaAction({
        consorcioId: consorcio.id,
        usuarioId: currentUser.id,
        cotaId: cotaAlvoContemplacao.id,
        status: acaoContemplacao,
        justificativa: justificativaContemplacao.trim(),
      });

      if (res.success) {
        setModalContemplacaoAberto(false);
        const pos = cotaAlvoContemplacao.ordemSorteio || cotaAlvoContemplacao.numero;
        const nomes =
          cotaAlvoContemplacao.participantes?.map((p: any) => p.usuario.name).join(" & ") ||
          `Cota #${cotaAlvoContemplacao.numero}`;
        const partPrinc = cotaAlvoContemplacao.participantes?.[0]?.usuario;
        const temPixDireto = Boolean(
          partPrinc?.isActivated &&
          partPrinc?.receberPixDireto &&
          partPrinc?.chavePix
        );
        const { boladaTotal, boladaLiquida } = calcularBoladaCiclo({
          numeroCiclo: pos,
          valorBase: consorcio.valorCota,
          modelo: consorcio.modeloContribuicao,
          acrescimo: consorcio.valorAcrescimo,
          totalCotas: consorcio.totalCotas,
          temPixDireto,
        });
        const valorApresentado = temPixDireto ? boladaLiquida : boladaTotal;

        if (acaoContemplacao === "CONTEMPLADA") {
          setToast({
            titulo: "Cota Contemplada!",
            mensagem: `A Cota #${cotaAlvoContemplacao.numero} (${nomes}) foi contemplada no Ciclo #${pos} com a bolada ${temPixDireto ? "líquida (Pix direto) de " : "de "}${formatarMoedaBRL(valorApresentado)}.`,
            tipo: "success",
          });
        } else {
          setToast({
            titulo: "Contemplação Revertida",
            mensagem: `A Cota #${cotaAlvoContemplacao.numero} (${nomes}) retornou ao status 'Aguardando Sorteio'.`,
            tipo: "info",
          });
        }

        if (onAtualizarConsorcio) {
          await onAtualizarConsorcio();
        }
      } else {
        alert(res.error || "Erro ao atualizar contemplação.");
      }
    } catch (err: any) {
      alert("Erro ao atualizar contemplação: " + err.message);
    } finally {
      setIsSalvandoContemplacao(false);
    }
  };

  const cotasOrdenadas = [...(consorcio?.cotas || [])].sort((a: any, b: any) => {
    const posA = a.ordemSorteio || a.numero;
    const posB = b.ordemSorteio || b.numero;
    return posA - posB;
  });

  const cotasAguardandoCriador = cotasOrdenadas.filter((c: any) => c.status !== "CONTEMPLADA");
  const cotasContempladasCriador = cotasOrdenadas.filter((c: any) => c.status === "CONTEMPLADA");
  const cotasExibidasCriador = cotasOrdenadas.filter((c: any) => {
    if (filtroSorteioCriador === "AGUARDANDO") return c.status !== "CONTEMPLADA";
    if (filtroSorteioCriador === "CONTEMPLADAS") return c.status === "CONTEMPLADA";
    return true;
  });

  const cotasDisponiveisParaTroca = cotasOrdenadas.filter((c: any) => c.status !== "CONTEMPLADA");

  const cotaSelecionada1 = consorcio?.cotas?.find((c: any) => c.id === trocaCotaId1);
  const cotaSelecionada2 = consorcio?.cotas?.find((c: any) => c.id === trocaCotaId2);

  const cotaSelecionada1Nomes =
    cotaSelecionada1?.participantes?.map((p: any) => p.usuario.name).join(" & ") ||
    `Cota #${cotaSelecionada1?.numero}`;
  const cotaSelecionada2Nomes =
    cotaSelecionada2?.participantes?.map((p: any) => p.usuario.name).join(" & ") ||
    `Cota #${cotaSelecionada2?.numero}`;

  const cotaSelecionada1Pos = cotaSelecionada1?.ordemSorteio || cotaSelecionada1?.numero;
  const cotaSelecionada2Pos = cotaSelecionada2?.ordemSorteio || cotaSelecionada2?.numero;

  const auditoriasFiltradas = (consorcio?.auditorias || []).filter((a: any) => {
    if (filtroTipoAuditoria === "PAGAMENTO") {
      if (!a.tipoAcao.includes("PAGAMENTO") && a.tipoAcao !== "RECUSA_COMPROVANTE") return false;
    } else if (filtroTipoAuditoria === "CONTEMPLACAO") {
      if (!a.tipoAcao.includes("CONTEMPLACAO")) return false;
    } else if (filtroTipoAuditoria === "TROCA") {
      if (!a.tipoAcao.includes("TROCA")) return false;
    } else if (filtroTipoAuditoria === "EDICAO") {
      if (!a.tipoAcao.includes("EDICAO") && !a.tipoAcao.includes("CRIACAO")) return false;
    }

    if (buscaAuditoria.trim()) {
      const q = buscaAuditoria.toLowerCase();
      const resp = (a.usuarioResponsavel?.name || "").toLowerCase();
      const detalhes = (typeof a.detalhes === "string" ? a.detalhes : JSON.stringify(a.detalhes)).toLowerCase();
      const justificativa = (a.justificativa || "").toLowerCase();
      const tipo = (a.tipoAcao || "").toLowerCase();
      return resp.includes(q) || detalhes.includes(q) || justificativa.includes(q) || tipo.includes(q);
    }

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Toast Modal Flutuante com auto-dismiss */}
      <ToastModal toast={toast} onClose={() => setToast(null)} />

      {/* Barra de Ações Rápidas do Gestor */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-4 rounded-3xl border border-slate-200/80 shadow-2xs">
        <div>
          <h2 className="text-base font-black text-slate-900">
            Painel de Gestão & Indicadores
          </h2>
          <p className="text-xs text-slate-500">
            Controle financeiro, arrecadação e conferência de comprovantes
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditNome(consorcio?.nome || "");
              setEditFinalidade(consorcio?.finalidade || "");
              setEditRegras(consorcio?.regras || "");
              setEditTipoChavePix((consorcio?.tipoChavePix as TipoChavePix) || "CHAVE_ALEATORIA");
              setEditChavePix(consorcio?.chavePix || "");
              setErroEdicao("");
              setModalEditarAberto(true);
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white hover:bg-slate-100 text-slate-800 transition flex items-center gap-1.5 border border-slate-200 shadow-2xs cursor-pointer"
            title="Editar nome, finalidade e dados de pagamento"
          >
            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
            <span>Editar Consórcio</span>
          </button>

          <button
            onClick={() => setModoVisao("LISTA_CONSORCIOS")}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1.5 cursor-pointer"
            title="Visualizar todos os consórcios em cards"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver em Cards ({todosConsorcios.length})</span>
          </button>

          {onCriarNovoConsorcio && (
            <button
              onClick={onCriarNovoConsorcio}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-black text-white transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Consórcio</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Abas de Gestão: Operacional vs Trilha de Auditoria (Exclusivo Pro Master e Super Admin) */}
      {isPrivilegiadoAuditoria && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-2xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setAbaGestao("OPERACIONAL")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                abaGestao === "OPERACIONAL"
                  ? "bg-theme-main text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Painel Operacional</span>
            </button>

            <button
              type="button"
              onClick={() => setAbaGestao("AUDITORIA")}
              className={`flex-1 sm:flex-initial px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                abaGestao === "AUDITORIA"
                  ? "bg-theme-main text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Trilha de Auditoria</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  abaGestao === "AUDITORIA"
                    ? "bg-white/20 text-white"
                    : "bg-slate-200 text-slate-700"
                }`}
              >
                {consorcio.auditorias.length}
              </span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-semibold bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Acesso Governança: <strong className="text-slate-800 font-bold">{currentUser?.role === "SUPER_ADMIN" ? "Super Admin" : "Pro Master"}</strong></span>
          </div>
        </div>
      )}

      {/* 1. ABA OPERACIONAL: Largura Total para todas as tabelas e controles */}
      {(abaGestao === "OPERACIONAL" || !isPrivilegiadoAuditoria) && (
        <div className="space-y-6">
          {/* 4 Cards de Métricas Principais (Exigidos no PDF: páginas 76 e 82) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200/80 shadow-sm transition hover:shadow-md">
              <span className="text-xs sm:text-sm text-slate-500 font-semibold block whitespace-nowrap">Total Previsto</span>
              <p className="text-lg sm:text-2xl font-black text-slate-900 mt-1 whitespace-nowrap">
                R$ {kpis.totalPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5 block whitespace-nowrap">{consorcio.totalCotas} cotas ativas</span>
            </div>

            <div className="bg-theme-light p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-theme-light shadow-sm transition hover:shadow-md">
              <span className="text-xs sm:text-sm text-theme-text font-bold block whitespace-nowrap">Total Recebido</span>
              <p className="text-lg sm:text-2xl font-black text-theme-text mt-1 whitespace-nowrap">
                R$ {kpis.totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] sm:text-xs text-theme-text font-semibold mt-0.5 block whitespace-nowrap">{kpis.percentualRecebido}% arrecadado</span>
            </div>

            <div className="bg-amber-50/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-amber-200/80 shadow-sm transition hover:shadow-md">
              <span className="text-xs sm:text-sm text-amber-800 font-bold block whitespace-nowrap">Pendente no Prazo</span>
              <p className="text-lg sm:text-2xl font-black text-amber-900 mt-1 whitespace-nowrap">
                R$ {kpis.totalPendentePrazo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] sm:text-xs text-amber-700 font-medium mt-0.5 block whitespace-nowrap">Aguardando vencimento</span>
            </div>

            <div className="bg-rose-50/80 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-rose-200/80 shadow-sm transition hover:shadow-md">
              <span className="text-xs sm:text-sm text-rose-700 font-bold block whitespace-nowrap">Em Atraso</span>
              <p className="text-lg sm:text-2xl font-black text-rose-800 mt-1 whitespace-nowrap">
                R$ {kpis.totalEmAtraso.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
              <span className="text-[11px] sm:text-xs text-rose-600 font-bold mt-0.5 block whitespace-nowrap">{kpis.quantidadeAtrasados} cota(s) pendente(s)</span>
            </div>
          </div>

          {/* Alerta de Contribuições Vencidas e Não Pagas (Largura Total) */}
          {contribuicoesAtrasadas.length > 0 && (
            <div className="bg-rose-50/90 border-2 border-rose-300 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-rose-900 text-sm sm:text-base">
                      Alerta de Contribuições em Atraso ({contribuicoesAtrasadas.length})
                    </h4>
                    <p className="text-xs text-rose-700">Parcelas com vencimento expirado que aguardam pagamento</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {contribuicoesAtrasadas.map((c: any) => (
                  <div key={c.id} className="bg-white p-3.5 rounded-2xl border border-rose-200 flex justify-between items-center text-xs shadow-2xs">
                    <div>
                      <p className="font-bold text-slate-800 text-sm">{c.usuario.name}</p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Cota #{c.cota?.numero} • Venceu em {formatarData(c.dataVencimento)}
                      </p>
                      <span className="font-black text-rose-700 text-sm block mt-0.5">{formatarMoedaBRL(c.valorPrevisto)}</span>
                    </div>
                    <button
                      onClick={() => abrirModalConfirmarPagamento(c)}
                      className="text-xs bg-theme-main hover:opacity-90 text-white font-bold px-3 py-2 rounded-xl transition shadow-2xs cursor-pointer flex items-center gap-1 active:scale-95 shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Confirmar</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ordem de Contemplação & Sorteio (Posições de Recebimento) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                  🎲
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Ordem de Contemplação & Sorteio
                  </h4>
                  <p className="text-xs text-slate-400">
                    Cronograma de recebimento da bolada por ciclo
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                {/* Filtros Rápidos Harmonizados com a Paleta */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setFiltroSorteioCriador("TODAS")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filtroSorteioCriador === "TODAS"
                        ? "bg-theme-main text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Todas</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filtroSorteioCriador === "TODAS"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cotasOrdenadas.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroSorteioCriador("AGUARDANDO")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filtroSorteioCriador === "AGUARDANDO"
                        ? "bg-theme-main text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Aguardando</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filtroSorteioCriador === "AGUARDANDO"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cotasAguardandoCriador.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFiltroSorteioCriador("CONTEMPLADAS")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filtroSorteioCriador === "CONTEMPLADAS"
                        ? "bg-theme-main text-white shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>Contempladas</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filtroSorteioCriador === "CONTEMPLADAS"
                          ? "bg-white/20 text-white"
                          : "bg-slate-200 text-slate-700"
                      }`}
                    >
                      {cotasContempladasCriador.length}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setErroTroca("");
                    setTrocaCotaId1("");
                    setTrocaCotaId2("");
                    setTrocaJustificativa("");
                    setModalTrocaAberto(true);
                  }}
                  className="px-3 py-2 bg-theme-main hover:opacity-90 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Trocar posição de recebimento entre dois participantes"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Trocar Posição</span>
                  <span className="sm:hidden">Trocar</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {cotasExibidasCriador.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 space-y-1">
                  <p className="text-xs font-bold text-slate-700">Nenhuma cota encontrada neste filtro.</p>
                  <p className="text-[11px] text-slate-500">Selecione &ldquo;Todas&rdquo; para ver todas as cotas.</p>
                </div>
              ) : (
                cotasExibidasCriador.map((cota: any) => {
                const pos = cota.ordemSorteio || cota.numero;
                const isContemplada = cota.status === "CONTEMPLADA";
                const nomes = cota.participantes.map((p: any) => p.usuario.name).join(" & ");
                const participantePrincipal = cota.participantes?.[0]?.usuario;
                const temPixDireto = Boolean(
                  participantePrincipal?.isActivated &&
                  participantePrincipal?.receberPixDireto &&
                  participantePrincipal?.chavePix
                );
                const {
                  valorCotaNoCiclo,
                  boladaTotal,
                  boladaLiquida,
                  cotaPropriaRetida,
                } = calcularBoladaCiclo({
                  numeroCiclo: pos,
                  valorBase: consorcio.valorCota,
                  modelo: consorcio.modeloContribuicao,
                  acrescimo: consorcio.valorAcrescimo,
                  totalCotas: consorcio.totalCotas,
                  temPixDireto,
                });
                const mesAnoCiclo = formatarMesAnoCiclo(consorcio, pos);

                return (
                  <div
                    key={cota.id}
                    className={`p-3.5 sm:p-4 rounded-2xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-2xs ${
                      isContemplada
                        ? "bg-theme-light/60 border-theme-main/30 hover:border-theme-main/50 ring-1 ring-theme-main/10"
                        : "bg-white hover:bg-slate-50/80 border-slate-200/90"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-black text-xs sm:text-sm shrink-0 shadow-2xs ${
                          isContemplada
                            ? "bg-theme-main text-white ring-2 ring-theme-main/20"
                            : "bg-slate-100 border border-slate-200 text-slate-700"
                        }`}
                      >
                        #{pos}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900">
                            {nomes}
                          </h4>
                          <span className="text-[10px] sm:text-[11px] text-slate-600 font-semibold bg-white border border-slate-200 px-2 py-0.5 rounded-md shrink-0">
                            Cota #{cota.numero} • Ciclo #{pos}
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-xs text-slate-600 font-medium mt-1 flex items-center gap-2 flex-wrap">
                          {isContemplada ? (
                            <span className="inline-flex items-center gap-1 font-bold text-theme-text">
                              <Calendar className="w-3.5 h-3.5 shrink-0 text-theme-main" />
                              <span>Contemplado em <strong>{mesAnoCiclo}</strong></span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-600">
                              <Calendar className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span>Recebe em: <strong className="text-slate-900">{mesAnoCiclo}</strong></span>
                            </span>
                          )}
                          <span className="text-slate-300 hidden sm:inline">•</span>
                          {temPixDireto ? (
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500">
                                Bolada Líquida:{" "}
                                <strong className={isContemplada ? "text-theme-text font-black" : "text-emerald-700 font-bold"}>
                                  {formatarMoedaBRL(boladaLiquida)}
                                </strong>
                              </span>
                              <span className="text-[10px] text-slate-400 hidden lg:inline">
                                (Total: {formatarMoedaBRL(boladaTotal)}, retém {formatarMoedaBRL(cotaPropriaRetida)})
                              </span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded-md font-bold flex items-center gap-0.5">
                                <span>⚡</span> Pix Direto
                              </span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 flex-wrap">
                              <span className="text-slate-500">
                                Bolada: <strong className={isContemplada ? "text-theme-text font-black" : "text-slate-900 font-bold"}>{formatarMoedaBRL(boladaTotal)}</strong>
                              </span>
                              <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0.2 rounded-md font-medium">
                                Centralizado
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => {
                          setCotaCompartilhar(cota);
                          setModalCompartilharAberto(true);
                        }}
                        className="text-xs font-bold px-3 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-white hover:bg-theme-light hover:border-theme-main/30 text-slate-700 hover:text-theme-text transition cursor-pointer flex items-center gap-1.5 shadow-2xs group"
                        title="Compartilhar link de acesso com o participante via WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-theme-text transition shrink-0" />
                        <span>Acesso</span>
                      </button>

                      {isContemplada ? (
                        <button
                          type="button"
                          onClick={() => abrirModalContemplacao(cota, "ATIVA")}
                          className="text-xs font-black px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 bg-theme-main hover:opacity-90 text-white shadow-sm shadow-theme-main/20 border border-theme-main active:scale-95"
                          title="Cota contemplada com sucesso! Clique para reverter para aguardando."
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300 animate-pulse shrink-0" />
                          <span>Contemplada</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => abrirModalContemplacao(cota, "CONTEMPLADA")}
                          className="text-xs font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-theme-light hover:border-theme-main/40 text-slate-700 hover:text-theme-text transition cursor-pointer flex items-center gap-1.5 shadow-2xs group active:scale-95"
                          title="Clique para confirmar a contemplação e registrar a entrega da bolada"
                        >
                          <Clock className="w-3.5 h-3.5 text-slate-400 group-hover:text-theme-text transition shrink-0" />
                          <span className="group-hover:hidden">Aguardando</span>
                          <span className="hidden group-hover:inline font-black text-theme-text">Contemplar</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              }))}
            </div>
          </div>
          {/* Comprovantes Aguardando Análise (Páginas 79 e 82 do PDF) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <span className="w-2.5 h-2.5 bg-theme-main rounded-full animate-pulse"></span>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Comprovantes para Análise</h4>
                  <p className="text-xs text-slate-400">Envios pendentes de aprovação pelo criador</p>
                </div>
              </div>
              <span className="bg-theme-light text-theme-text text-xs font-bold px-3 py-1 rounded-full">
                {comprovantesPendentes.length} pendente(s)
              </span>
            </div>

            {comprovantesPendentes.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-8 h-8 text-slate-300 mx-auto mb-1" />
                <p className="text-xs text-slate-400">Nenhum comprovante pendente no momento.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {comprovantesPendentes.map((c: any) => (
                  <div key={c.id} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{c.usuario.name}</p>
                          <p className="text-xs text-slate-500">
                            Cota #{c.cota?.numero} • Ciclo {c.numeroCiclo}
                          </p>
                        </div>
                        <span className="text-[11px] font-bold text-theme-text bg-theme-light px-2.5 py-0.5 rounded-md">
                          {c.comprovante?.mimeType === "application/pdf" ? "PDF" : "Imagem"}
                        </span>
                      </div>

                      <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                        <span className="text-xs text-slate-500 font-medium">Valor:</span>
                        <span className="text-sm font-black text-slate-900">{formatarMoedaBRL(c.valorPrevisto)}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.comprovante?.arquivoNome}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => abrirModalConfirmarPagamento(c)}
                        className="py-2.5 px-3 bg-theme-main hover:opacity-90 text-white font-bold text-xs rounded-xl transition shadow-2xs touch-target cursor-pointer flex items-center justify-center gap-1.5 active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar</span>
                      </button>
                      <button
                        onClick={() => {
                          setItemSelecionado(c);
                          setModalRecusaAberto(true);
                        }}
                        className="py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition touch-target"
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Gestão Completa de Parcelas com Filtros & Exportação */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Controle de Contribuições</h4>
                <p className="text-xs text-slate-500">Acompanhe e gerencie cada cota e ciclo do consórcio</p>
              </div>
              <button
                onClick={exportarCSV}
                className="flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition shadow-sm"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Exportar CSV</span>
              </button>
            </div>

            {/* Filtros por Status Harmonizados com a Paleta */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
              {[
                { id: "TODOS", label: "Todos os Ciclos", count: consorcio?.contribuicoes?.length || 0 },
                { id: "PENDENTE", label: "Pendentes", count: consorcio?.contribuicoes?.filter((c: any) => c.status === "PENDENTE").length || 0 },
                { id: "PAGO", label: "Confirmados (Pagos)", count: consorcio?.contribuicoes?.filter((c: any) => c.status === "PAGO").length || 0 },
                { id: "EM_ATRASO", label: "Em Atraso", count: consorcio?.contribuicoes?.filter((c: any) => c.status === "EM_ATRASO").length || 0 },
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setFiltroStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer flex items-center gap-1.5 ${
                    filtroStatus === st.id
                      ? "bg-theme-main text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  <span>{st.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroStatus === st.id
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {st.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Lista em Grid de Cards com Rolagem Interna Compacta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4 max-h-[480px] overflow-y-auto pr-1">
              {listaFiltrada.length === 0 ? (
                <div className="col-span-full py-10 px-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 space-y-1">
                  <p className="text-xs font-bold text-slate-700">Nenhuma contribuição encontrada neste filtro.</p>
                  <p className="text-[11px] text-slate-500">Selecione &ldquo;Todos os Ciclos&rdquo; para ver todas as parcelas.</p>
                </div>
              ) : (
                listaFiltrada.map((c: any) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition shadow-2xs ${
                      c.status === "PAGO"
                        ? "bg-theme-light/40 border-theme-main/30 hover:border-theme-main/50"
                        : c.status === "EM_ATRASO"
                        ? "bg-rose-50/60 border-rose-200/80 hover:bg-rose-50"
                        : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80"
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-800 text-xs sm:text-sm truncate">
                          {c.usuario?.name}
                        </span>
                        <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold shrink-0">
                          Cota #{c.cota?.numero} • Ciclo {c.numeroCiclo}
                        </span>
                      </div>
                      <p className={`text-base font-black mt-1 ${c.status === "PAGO" ? "text-theme-text" : c.status === "EM_ATRASO" ? "text-rose-700" : "text-slate-900"}`}>
                        {formatarMoedaBRL(c.valorPrevisto)}
                      </p>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Vencimento: <strong className="text-slate-700 font-bold">{formatarData(c.dataVencimento)}</strong>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {c.status === "PAGO" ? (
                        <div className="flex items-center gap-1.5">
                          <span className="px-3 py-1 rounded-full text-xs font-bold bg-theme-light text-theme-text border border-theme-main/30 inline-flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-theme-main" />
                            <span>Pago</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setItemSelecionado(c);
                              setModalEstornoAberto(true);
                            }}
                            title="Estornar ou desfazer confirmação com justificativa"
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => abrirModalConfirmarPagamento(c)}
                          className="px-3.5 py-2 bg-theme-main hover:opacity-90 text-white text-xs font-bold rounded-xl shadow-2xs transition touch-target cursor-pointer flex items-center gap-1.5 active:scale-95"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Confirmar</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. ABA TRILHA DE AUDITORIA: Exclusiva para Pro Master e Super Admin */}
      {isPrivilegiadoAuditoria && abaGestao === "AUDITORIA" && (
        <div id="historico-auditoria" className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200/80 shadow-sm space-y-6 scroll-mt-24">
          {/* Cabeçalho da Trilha de Auditoria */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-theme-light text-theme-text flex items-center justify-center font-bold text-lg shadow-2xs shrink-0">
                <ShieldCheck className="w-6 h-6 text-theme-main" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    Trilha de Auditoria & Governança
                  </h3>
                  <span className="text-[10px] sm:text-[11px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Exclusivo Pro Master & Super Admin</span>
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro cronológico detalhado e imutável de todas as ações executadas neste consórcio.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center">
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                {consorcio.auditorias.length} evento(s) no total
              </span>
            </div>
          </div>

          {/* Cards de Resumo da Auditoria */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/70">
              <span className="text-[11px] font-semibold text-slate-500 block">Total de Eventos</span>
              <span className="text-xl font-black text-slate-900 mt-0.5 block">{consorcio.auditorias.length}</span>
            </div>
            <div className="p-3.5 bg-theme-light/50 rounded-2xl border border-theme-main/20">
              <span className="text-[11px] font-semibold text-theme-text block">Pagamentos Baixados</span>
              <span className="text-xl font-black text-theme-text mt-0.5 block">
                {consorcio.auditorias.filter((a: any) => a.tipoAcao === "CONFIRMACAO_PAGAMENTO").length}
              </span>
            </div>
            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/60">
              <span className="text-[11px] font-semibold text-amber-800 block">Contemplações & Trocas</span>
              <span className="text-xl font-black text-amber-900 mt-0.5 block">
                {consorcio.auditorias.filter((a: any) => a.tipoAcao.includes("CONTEMPLACAO") || a.tipoAcao.includes("TROCA")).length}
              </span>
            </div>
            <div className="p-3.5 bg-slate-100/70 rounded-2xl border border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-600 block">Edições & Estornos</span>
              <span className="text-xl font-black text-slate-800 mt-0.5 block">
                {consorcio.auditorias.filter((a: any) => !a.tipoAcao.includes("CONFIRMACAO_PAGAMENTO") && !a.tipoAcao.includes("CONTEMPLACAO") && !a.tipoAcao.includes("TROCA")).length}
              </span>
            </div>
          </div>

          {/* Barra de Filtros e Busca de Auditoria */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between pt-1">
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {[
                { id: "TODOS", label: "Todos os Eventos" },
                { id: "PAGAMENTO", label: "Pagamentos" },
                { id: "CONTEMPLACAO", label: "Contemplações" },
                { id: "TROCA", label: "Trocas de Posição" },
                { id: "EDICAO", label: "Edição de Dados" },
              ].map((tipo) => (
                <button
                  key={tipo.id}
                  type="button"
                  onClick={() => setFiltroTipoAuditoria(tipo.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 cursor-pointer ${
                    filtroTipoAuditoria === tipo.id
                      ? "bg-theme-main text-white shadow-2xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={buscaAuditoria}
                onChange={(e) => setBuscaAuditoria(e.target.value)}
                placeholder="Buscar por responsável, participante..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-theme-main focus:outline-none"
              />
              {buscaAuditoria && (
                <button
                  type="button"
                  onClick={() => setBuscaAuditoria("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Lista em Grid 2 Colunas da Trilha de Auditoria */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 max-h-[600px] overflow-y-auto pr-1">
            {auditoriasFiltradas.length === 0 ? (
              <div className="col-span-full py-12 px-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 space-y-2">
                <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">Nenhum evento encontrado para este filtro.</p>
                <p className="text-[11px] text-slate-500">Tente selecionar outro filtro ou limpar o campo de busca.</p>
              </div>
            ) : (
              auditoriasFiltradas.map((a: any) => {
                const meta = getAcaoAuditoriaMeta(a.tipoAcao);
                const IconComp = meta.icon;

                return (
                  <div
                    key={a.id}
                    className="p-4 bg-slate-50/90 hover:bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2.5 transition shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Cabeçalho do Card */}
                      <div className="flex justify-between items-start gap-2">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide ${meta.bg}`}
                        >
                          <IconComp className="w-3 h-3 flex-shrink-0" />
                          <span>{meta.label}</span>
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap font-medium">
                          {formatarDataHoraAuditoria(a.createdAt)}
                        </span>
                      </div>

                      {/* Detalhes Formatados */}
                      <div className="mt-2.5">
                        {renderAuditoriaDetalhes(a, consorcio)}
                      </div>
                    </div>

                    {/* Rodapé: Responsável e Justificativa */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-200/60 mt-1">
                      {a.usuarioResponsavel?.name && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>👤 Por:</span>
                          <span className="font-bold text-slate-700">
                            {a.usuarioResponsavel.name}
                          </span>
                        </div>
                      )}

                      {a.justificativa && (
                        <p className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-200/60 italic leading-snug">
                          &ldquo;{a.justificativa}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Recebimento de Mensalidade */}
      {modalConfirmarPagamentoAberto && contribuicaoParaConfirmar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-theme-light text-theme-text flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-6 h-6 text-theme-main" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Confirmar Recebimento
                  </h3>
                  <p className="text-xs text-slate-400">
                    Conferência e baixa da mensalidade
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalConfirmarPagamentoAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Resumo da Parcela */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Participante
                  </span>
                  <span className="font-bold text-sm text-slate-900 block mt-0.5">
                    {contribuicaoParaConfirmar.usuario?.name || "Participante"}
                  </span>
                  <span className="text-xs text-slate-500">
                    {contribuicaoParaConfirmar.usuario?.email || "Sem e-mail cadastrado"}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Cota
                  </span>
                  <span className="text-xs font-mono font-bold bg-theme-light text-theme-text px-2.5 py-1 rounded-lg inline-block mt-0.5">
                    Cota #{contribuicaoParaConfirmar.cota?.numero}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200/60 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Ciclo:</span>
                  <span className="font-semibold text-slate-700">Ciclo #{contribuicaoParaConfirmar.numeroCiclo}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vencimento:</span>
                  <span className="font-semibold text-slate-700">{formatarDataSegura(contribuicaoParaConfirmar.dataVencimento)}</span>
                </div>
              </div>

              {/* Destaque do Valor */}
              <div className="p-3 bg-theme-light rounded-xl border border-theme-main/30 flex items-center justify-between">
                <span className="text-xs font-bold text-theme-text">Valor a Confirmar:</span>
                <span className="text-lg font-black text-theme-text">
                  {formatarMoedaBRL(contribuicaoParaConfirmar.valorPrevisto)}
                </span>
              </div>

              {/* Informação do comprovante anexo, se houver */}
              {contribuicaoParaConfirmar.comprovante && (
                <div className="p-2.5 bg-blue-50/70 border border-blue-200/70 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                    <span className="truncate font-medium text-blue-950">
                      {contribuicaoParaConfirmar.comprovante.arquivoNome}
                    </span>
                  </div>
                  {contribuicaoParaConfirmar.comprovante.arquivoUrl && (
                    <a
                      href={contribuicaoParaConfirmar.comprovante.arquivoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 shrink-0 ml-2"
                    >
                      <span>Ver Anexo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Campo de Justificativa / Observação */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Observação / Justificativa (Opcional)
              </label>
              <textarea
                rows={2}
                value={justificativaConfirmacao}
                onChange={(e) => setJustificativaConfirmacao(e.target.value)}
                placeholder="Ex: Pagamento conferido e confirmado pelo criador via extrato."
                className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-theme-main focus:outline-none bg-slate-50/50"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                Ficará registrado no histórico de auditoria e no sininho de notificações do consórcio.
              </p>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalConfirmarPagamentoAberto(false)}
                disabled={isConfirmandoPagamento}
                className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecutarConfirmacaoPagamento}
                disabled={isConfirmandoPagamento}
                className="flex-1 py-2.5 px-3 rounded-xl bg-theme-main hover:opacity-90 text-white font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
              >
                {isConfirmandoPagamento ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Confirmando...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Sim, Confirmar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Contemplação / Reversão */}
      {modalContemplacaoAberto && cotaAlvoContemplacao && (() => {
        const pos = cotaAlvoContemplacao.ordemSorteio || cotaAlvoContemplacao.numero;
        const nomes =
          cotaAlvoContemplacao.participantes?.map((p: any) => p.usuario.name).join(" & ") ||
          `Cota #${cotaAlvoContemplacao.numero}`;
        const partPrinc = cotaAlvoContemplacao.participantes?.[0]?.usuario;
        const temPixDireto = Boolean(
          partPrinc?.isActivated &&
          partPrinc?.receberPixDireto &&
          partPrinc?.chavePix
        );
        const {
          valorCotaNoCiclo,
          boladaTotal,
          boladaLiquida,
          cotaPropriaRetida,
        } = calcularBoladaCiclo({
          numeroCiclo: pos,
          valorBase: consorcio.valorCota,
          modelo: consorcio.modeloContribuicao,
          acrescimo: consorcio.valorAcrescimo,
          totalCotas: consorcio.totalCotas,
          temPixDireto,
        });
        const isConfirmar = acaoContemplacao === "CONTEMPLADA";

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
            <div className="bg-white rounded-3xl p-5 sm:p-6 w-full max-w-md shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
                      isConfirmar
                        ? "bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-amber-500/20"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {isConfirmar ? (
                      <Sparkles className="w-6 h-6 fill-white" />
                    ) : (
                      <RotateCcw className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 leading-tight">
                      {isConfirmar ? "Confirmar Contemplação" : "Reverter Contemplação"}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {isConfirmar
                        ? "Entrega da bolada do consórcio"
                        : "Retornar cota para aguardando"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setModalContemplacaoAberto(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Card Resumo da Cota & Bolada */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Participante
                    </span>
                    <span className="font-bold text-sm text-slate-900 block mt-0.5">
                      {nomes}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Cota & Sorteio
                    </span>
                    <span className="text-xs font-mono font-bold bg-theme-light text-theme-text px-2.5 py-1 rounded-lg inline-block mt-0.5">
                      Cota #{cotaAlvoContemplacao.numero} • Ciclo #{pos}
                    </span>
                  </div>
                </div>

                {/* Destaque da Bolada */}
                <div
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isConfirmar
                      ? "bg-theme-light border-theme-main/30"
                      : "bg-amber-50/70 border-amber-200"
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">
                      {isConfirmar ? (temPixDireto ? "Bolada Líquida a Transferir:" : "Bolada a Entregar:") : "Valor da Bolada Deste Ciclo:"}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Ciclo #{pos} de {consorcio.totalCotas} • Previsão: <strong className="text-slate-800">{formatarMesAnoCiclo(consorcio, pos)}</strong>
                    </span>
                  </div>
                  <span
                    className={`text-xl font-black ${
                      isConfirmar ? "text-theme-text" : "text-amber-800"
                    }`}
                  >
                    {formatarMoedaBRL(temPixDireto ? boladaLiquida : boladaTotal)}
                  </span>
                </div>

                {temPixDireto ? (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between font-bold text-emerald-900">
                      <span className="flex items-center gap-1">
                        <span>⚡</span> Modalidade: Pix Direto na Conta
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-md">
                        {getTipoChavePixLabel(partPrinc.tipoChavePix)}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-800">
                      Chave Pix: <strong className="font-mono">{partPrinc.chavePix}</strong>
                    </div>
                    <p className="text-[10px] text-emerald-700">
                      O participante não faz Pix neste ciclo (sua cota de {formatarMoedaBRL(cotaPropriaRetida)} fica retida no bolso) e recebe {formatarMoedaBRL(boladaLiquida)} diretamente dos demais participantes.
                    </p>
                  </div>
                ) : (
                  <div className="p-2.5 bg-slate-100 rounded-xl border border-slate-200 text-[11px] text-slate-600">
                    <span>🏦 <strong>Arrecadação Centralizada:</strong> Os participantes realizam transferências para o Pix oficial do consórcio ({formatarMoedaBRL(boladaTotal)} bruto).</span>
                  </div>
                )}

                {isConfirmar ? (
                  <p className="text-[11px] text-theme-text bg-theme-light/80 p-2.5 rounded-xl border border-theme-main/20 leading-relaxed">
                    ✨ Ao confirmar, esta cota será marcada como <strong>CONTEMPLADA</strong>, refletirá no portal do participante e registrará o evento na auditoria e no sininho.
                  </p>
                ) : (
                  <p className="text-[11px] text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200 leading-relaxed">
                    ⚠️ Ao reverter, a cota voltará ao status <strong>Aguardando</strong> e a alteração ficará documentada na trilha de auditoria do sistema.
                  </p>
                )}
              </div>

              {/* Justificativa / Observação */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {isConfirmar
                    ? "Observação do Sorteio (Opcional)"
                    : "Motivo da Reversão (Opcional)"}
                </label>
                <textarea
                  rows={2}
                  value={justificativaContemplacao}
                  onChange={(e) => setJustificativaContemplacao(e.target.value)}
                  placeholder={
                    isConfirmar
                      ? "Ex: Sorteada no sorteio presencial do dia 22/10."
                      : "Ex: Ajuste de ordem ou clique acidental."
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Botões de Ação */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalContemplacaoAberto(false)}
                  disabled={isSalvandoContemplacao}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmarAcaoContemplacao}
                  disabled={isSalvandoContemplacao}
                  className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs transition shadow-sm flex items-center justify-center gap-1.5 cursor-pointer text-white ${
                    isConfirmar
                      ? "bg-theme-main hover:opacity-90 shadow-theme-main/20"
                      : "bg-amber-600 hover:bg-amber-700"
                  }`}
                >
                  {isSalvandoContemplacao ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : isConfirmar ? (
                    <>
                      <Sparkles className="w-4 h-4 fill-white" />
                      <span>Sim, Contemplar</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      <span>Sim, Voltar para Aguardando</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Reversão / Estorno com Justificativa Obrigatória */}
      {modalEstornoAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Reverter Confirmação de Pagamento</h3>
            <p className="text-xs text-slate-600">
              Conforme a regra do sistema, a reversão de um pagamento exige informar obrigatoriamente a justificativa.
            </p>

            <form onSubmit={handleSalvarEstorno} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo do Estorno *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Comprovante duplicado ou valor estornado na conta bancária."
                  value={motivoTexto}
                  onChange={(e) => setMotivoTexto(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalEstornoAberto(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 transition"
                >
                  Confirmar Estorno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Recusa de Comprovante */}
      {modalRecusaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900">Recusar Comprovante de Pagamento</h3>
            <p className="text-xs text-slate-600">
              O participante será notificado e poderá reenviar um novo arquivo após a recusa.
            </p>

            <form onSubmit={handleSalvarRecusaComprovante} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motivo da Recusa *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Ex: Valor ilegível ou comprovante de data antiga."
                  value={motivoTexto}
                  onChange={(e) => setMotivoTexto(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setModalRecusaAberto(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-md hover:bg-rose-700 transition"
                >
                  Recusar Comprovante
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Edição de Consórcio */}
      {modalEditarAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-slate-100">
            {/* Puxador visual para mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden mb-2"></div>

            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-theme-light text-theme-text flex items-center justify-center font-bold flex-shrink-0">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Editar Dados do Consórcio
                  </h3>
                  <p className="text-xs text-slate-400">
                    Atualize nome, finalidade e dados de pagamento
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalEditarAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo do Formulário com Scroll Suave */}
            <form onSubmit={handleSalvarEdicao} className="space-y-4 overflow-y-auto flex-1 pr-1 py-3">
              {erroEdicao && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {erroEdicao}
                </div>
              )}

              {/* Nome do Consórcio */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Consórcio <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={editNome}
                  onChange={(e) => setEditNome(e.target.value)}
                  placeholder="Ex: Consórcio Viagem 2026"
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Finalidade */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Finalidade / Objetivo
                </label>
                <input
                  type="text"
                  value={editFinalidade}
                  onChange={(e) => setEditFinalidade(e.target.value)}
                  placeholder="Ex: Comprar passagens para o final de ano"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Chave Pix do Consórcio (Obrigatória) */}
              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1">
                    <span>⚡</span> Chave Pix do Consórcio <span className="text-rose-500 font-black">*</span>
                  </label>
                  <span className="text-[10px] text-theme-text font-bold bg-theme-light px-2 py-0.2 rounded-md">
                    Visível aos participantes
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Tipo da Chave
                    </label>
                    <select
                      value={editTipoChavePix}
                      onChange={(e) => setEditTipoChavePix(e.target.value as TipoChavePix)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:border-theme-main focus:outline-none bg-white cursor-pointer"
                    >
                      {TIPOS_CHAVE_PIX.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Chave Pix para Pagamento *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={
                        TIPOS_CHAVE_PIX.find((t) => t.value === editTipoChavePix)?.placeholder ||
                        "Informe a chave Pix"
                      }
                      value={editChavePix}
                      onChange={(e) => setEditChavePix(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:border-theme-main focus:outline-none bg-white shadow-2xs"
                    />
                  </div>
                </div>
              </div>

              {/* Regras Gerais */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Regras Gerais / Avisos
                </label>
                <textarea
                  rows={2}
                  value={editRegras}
                  onChange={(e) => setEditRegras(e.target.value)}
                  placeholder="Ex: Pagamentos até o dia 10 de cada mês. Sorteio todo dia 15."
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Caixa Informativa de Proteção Financeira (Imutabilidade após início) */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <Lock className="w-4 h-4 text-amber-700 flex-shrink-0" />
                  <span>Regras Financeiras Protegidas (Imutáveis após Ativação)</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Para garantir a segurança dos participantes e a validade das parcelas geradas, o <strong>valor da cota (R$ {consorcio.valorCota.toFixed(2)})</strong>, a <strong>quantidade de cotas ({consorcio.totalCotas})</strong> e a <strong>frequência ({consorcio.frequencia?.toLowerCase()})</strong> não podem ser alterados após o início do consórcio.
                </p>
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalEditarAberto(false)}
                  disabled={salvandoEdicao}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoEdicao}
                  className="flex-1 py-3 bg-theme-main hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{salvandoEdicao ? "Salvando..." : "Salvar Alterações"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Troca de Posição entre Participantes */}
      {modalTrocaAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 pb-8 sm:pb-6 w-full sm:max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-slate-100">
            {/* Puxador mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden mb-2"></div>

            {/* Cabeçalho do Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl flex-shrink-0 shadow-2xs">
                  <ArrowLeftRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    Trocar Ordem de Recebimento
                  </h3>
                  <p className="text-xs text-slate-400">
                    Permuta de ciclos acordada entre participantes
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalTrocaAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition"
              >
                ✕
              </button>
            </div>

            {/* Formulário de Troca */}
            <form onSubmit={handleSalvarTroca} className="space-y-4 overflow-y-auto flex-1 pr-1 py-3">
              {erroTroca && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold">
                  {erroTroca}
                </div>
              )}

              <p className="text-xs text-slate-600 leading-relaxed">
                Selecione as duas cotas que combinaram entre si a inversão de seus ciclos de recebimento da bolada:
              </p>

              {/* Seletor Cota 1 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1ª Cota (Quem vai trocar)
                </label>
                <select
                  value={trocaCotaId1}
                  onChange={(e) => setTrocaCotaId1(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:border-theme-main focus:outline-none bg-slate-50/50"
                >
                  <option value="">Selecione a primeira cota...</option>
                  {cotasDisponiveisParaTroca.map((c: any) => {
                    const pos = c.ordemSorteio || c.numero;
                    const nomes = c.participantes.map((p: any) => p.usuario.name).join(" & ");
                    return (
                      <option key={c.id} value={c.id} disabled={c.id === trocaCotaId2}>
                        Ciclo #{pos} • Cota #{c.numero} — {nomes}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Ícone de Inversão Visual */}
              <div className="flex justify-center my-1">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center border border-slate-200 shadow-2xs">
                  <ArrowLeftRight className="w-4 h-4" />
                </div>
              </div>

              {/* Seletor Cota 2 */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2ª Cota (Com quem vai trocar)
                </label>
                <select
                  value={trocaCotaId2}
                  onChange={(e) => setTrocaCotaId2(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-semibold focus:border-theme-main focus:outline-none bg-slate-50/50"
                >
                  <option value="">Selecione a segunda cota...</option>
                  {cotasDisponiveisParaTroca.map((c: any) => {
                    const pos = c.ordemSorteio || c.numero;
                    const nomes = c.participantes.map((p: any) => p.usuario.name).join(" & ");
                    return (
                      <option key={c.id} value={c.id} disabled={c.id === trocaCotaId1}>
                        Ciclo #{pos} • Cota #{c.numero} — {nomes}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Preview da Troca se ambas selecionadas */}
              {cotaSelecionada1 && cotaSelecionada2 && (
                <div className="p-3.5 bg-theme-light border border-theme-main/30 rounded-2xl space-y-2 text-xs">
                  <span className="font-bold text-theme-text block uppercase tracking-wide text-[10px]">
                    Resumo do Acordo de Troca:
                  </span>
                  <div className="space-y-1 text-slate-800">
                    <p>
                      • <strong>{cotaSelecionada1Nomes}</strong>: passa para o <strong>Ciclo #{cotaSelecionada2Pos}</strong>.
                    </p>
                    <p>
                      • <strong>{cotaSelecionada2Nomes}</strong>: passa para o <strong>Ciclo #{cotaSelecionada1Pos}</strong>.
                    </p>
                  </div>
                </div>
              )}

              {/* Observação / Justificativa Opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observação / Justificativa (Opcional)
                </label>
                <input
                  type="text"
                  value={trocaJustificativa}
                  onChange={(e) => setTrocaJustificativa(e.target.value)}
                  placeholder="Ex: Acordo direto entre os participantes"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>

              {/* Nota Informativa */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-500 leading-relaxed">
                ℹ️ Esta troca será registrada na <strong>trilha de auditoria</strong> com data, hora e responsável. Cotas já contempladas não participam de trocas.
              </div>

              {/* Botões de Ação */}
              <div className="flex gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalTrocaAberto(false)}
                  disabled={salvandoTroca}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={salvandoTroca || !trocaCotaId1 || !trocaCotaId2}
                  className="flex-1 py-3 bg-theme-main hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{salvandoTroca ? "Efetivando Troca..." : "Confirmar Troca"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Compartilhamento de Link do Participante (Passwordless) */}
      {modalCompartilharAberto && cotaCompartilhar && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl flex-shrink-0">
                  📲
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base sm:text-lg">
                    Link de Acesso do Participante
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cota #{cotaCompartilhar.numero} • Ciclo #{cotaCompartilhar.ordemSorteio || cotaCompartilhar.numero} ({formatarMesAnoCiclo(consorcio, cotaCompartilhar.ordemSorteio || cotaCompartilhar.numero)})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalCompartilharAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 leading-relaxed">
              💡 <strong>Acesso Sem Senha (Passwordless):</strong> O participante clica no link e acessa direto pelo celular. Ele pode ver a chave PIX, enviar comprovante e acompanhar a previsão da sua bolada sem burocracia.
            </div>

            <div className="space-y-3">
              {cotaCompartilhar.participantes.map((p: any, idx: number) => {
                const tokenEfetivo = p.tokenAcesso || cotaCompartilhar.tokenAcesso || "";
                const origin = typeof window !== "undefined" ? window.location.origin : "";
                const linkUrl = `${origin}/participante/${tokenEfetivo}`;
                const cicloPos = cotaCompartilhar.ordemSorteio || cotaCompartilhar.numero;
                const mesAnoPrevisao = formatarMesAnoCiclo(consorcio, cicloPos);
                const mensagemWhatsapp = `Olá ${p.usuario.name}!\n\nAcompanhe sua cota #${cotaCompartilhar.numero} no consórcio *${consorcio.nome}* pelo seu link exclusivo:\n\n${linkUrl}\n\nLá você pode ver as parcelas, copiar o PIX e acompanhar o recebimento da sua bolada previsto para *${mesAnoPrevisao}*!`;
                const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagemWhatsapp)}`;
                const isCopiado = linkCopiadoIdx === idx;

                return (
                  <div key={p.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Participante
                        </span>
                        <h4 className="text-sm font-black text-slate-900 truncate">
                          {p.usuario.name}
                        </h4>
                      </div>
                      <span className="text-[11px] font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
                        {p.percentual}% da cota
                      </span>
                    </div>

                    {/* Campo de link */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={linkUrl}
                        className="flex-1 bg-white border border-slate-200 text-slate-700 text-xs font-mono py-2 px-3 rounded-xl focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopiarLinkParticipante(tokenEfetivo, idx)}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 transition flex items-center gap-1 shadow-2xs cursor-pointer flex-shrink-0"
                      >
                        {isCopiado ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-700">Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-500" />
                            <span>Copiar</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Botões de Ação Rápida */}
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Abrir WhatsApp</span>
                      </a>

                      <a
                        href={linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Testar Link</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalCompartilharAberto(false)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
