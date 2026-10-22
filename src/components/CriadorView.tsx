"use client";

import React, { useState } from "react";
import {
  calcularIndicadoresConsorcio,
} from "@/lib/finance";
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
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [modalEstornoAberto, setModalEstornoAberto] = useState(false);
  const [modalRecusaAberto, setModalRecusaAberto] = useState(false);
  const [itemSelecionado, setItemSelecionado] = useState<any>(null);
  const [motivoTexto, setMotivoTexto] = useState("");
  const [msgSucesso, setMsgSucesso] = useState("");

  // Estado da Edição de Consórcio
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [editNome, setEditNome] = useState(consorcio?.nome || "");
  const [editFinalidade, setEditFinalidade] = useState(consorcio?.finalidade || "");
  const [editRegras, setEditRegras] = useState(consorcio?.regras || "");
  const [editDadosPagamento, setEditDadosPagamento] = useState(
    consorcio?.dadosBancarios || consorcio?.chavePix || ""
  );
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [erroEdicao, setErroEdicao] = useState("");

  // Estado da Troca de Posição de Cotas
  const [modalTrocaAberto, setModalTrocaAberto] = useState(false);
  const [trocaCotaId1, setTrocaCotaId1] = useState("");
  const [trocaCotaId2, setTrocaCotaId2] = useState("");
  const [trocaJustificativa, setTrocaJustificativa] = useState("");
  const [salvandoTroca, setSalvandoTroca] = useState(false);
  const [erroTroca, setErroTroca] = useState("");

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
                      <span className="text-xs sm:text-sm font-black text-theme-text">
                        R$ {c.valorTotalBolada.toFixed(0)}
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

  const handleConfirmarPagamento = async (contribuicaoId: string) => {
    await confirmPaymentAction(contribuicaoId, currentUser.id, "Pagamento conferido e confirmado pelo criador.");
    setMsgSucesso("Pagamento confirmado com sucesso!");
    setTimeout(() => setMsgSucesso(""), 3000);
  };

  const handleSalvarEstorno = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSelecionado || !motivoTexto.trim()) return;

    await revertPaymentAction(itemSelecionado.id, currentUser.id, motivoTexto);
    setModalEstornoAberto(false);
    setMotivoTexto("");
    setMsgSucesso("Pagamento revertido e registrado na auditoria.");
    setTimeout(() => setMsgSucesso(""), 3000);
  };

  const handleSalvarRecusaComprovante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemSelecionado || !motivoTexto.trim()) return;

    await rejectReceiptAction(itemSelecionado.comprovante.id, currentUser.id, motivoTexto);
    setModalRecusaAberto(false);
    setMotivoTexto("");
    setMsgSucesso("Comprovante recusado com justificativa enviada ao participante.");
    setTimeout(() => setMsgSucesso(""), 3000);
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
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const handleSalvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNome.trim()) {
      setErroEdicao("O nome do consórcio é obrigatório.");
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
      dadosPagamento: editDadosPagamento,
    });

    setSalvandoEdicao(false);

    if (res.success) {
      setMsgSucesso("Informações do consórcio atualizadas com sucesso!");
      setModalEditarAberto(false);
      setTimeout(() => setMsgSucesso(""), 3500);
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
      setMsgSucesso(res.message || "Troca de posição efetivada com sucesso!");
      setModalTrocaAberto(false);
      setTrocaCotaId1("");
      setTrocaCotaId2("");
      setTrocaJustificativa("");
      setTimeout(() => setMsgSucesso(""), 3500);
      if (onAtualizarConsorcio) {
        onAtualizarConsorcio();
      }
    } else {
      setErroTroca(res.error || "Erro ao trocar posições.");
    }
  };

  const handleToggleContemplada = async (cotaId: string, novoStatus: "ATIVA" | "CONTEMPLADA") => {
    const res = await toggleCotaContempladaAction({
      consorcioId: consorcio.id,
      usuarioId: currentUser.id,
      cotaId,
      status: novoStatus,
    });

    if (res.success) {
      setMsgSucesso(res.message || "Status de contemplação atualizado!");
      setTimeout(() => setMsgSucesso(""), 3500);
      if (onAtualizarConsorcio) {
        onAtualizarConsorcio();
      }
    } else {
      alert(res.error || "Erro ao atualizar contemplação.");
    }
  };

  const cotasOrdenadas = [...(consorcio?.cotas || [])].sort((a: any, b: any) => {
    const posA = a.ordemSorteio || a.numero;
    const posB = b.ordemSorteio || b.numero;
    return posA - posB;
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

  return (
    <div className="space-y-6">
      {msgSucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msgSucesso}</span>
        </div>
      )}

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
              setEditDadosPagamento(consorcio?.dadosBancarios || consorcio?.chavePix || "");
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

      {/* Grid Principal Responsivo: Esquerda (Operacional) e Direita (Alertas & Auditoria) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Principal: Comprovantes & Controle de Parcelas */}
        <div className="lg:col-span-8 space-y-6">
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

              <button
                type="button"
                onClick={() => {
                  setErroTroca("");
                  setTrocaCotaId1("");
                  setTrocaCotaId2("");
                  setTrocaJustificativa("");
                  setModalTrocaAberto(true);
                }}
                className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
                title="Trocar posição de recebimento entre dois participantes"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>Trocar Posição</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {cotasOrdenadas.map((cota: any) => {
                const pos = cota.ordemSorteio || cota.numero;
                const isContemplada = cota.status === "CONTEMPLADA";
                const nomes = cota.participantes.map((p: any) => p.usuario.name).join(" & ");

                return (
                  <div
                    key={cota.id}
                    className={`p-3 rounded-2xl border transition flex items-center justify-between gap-2.5 ${
                      isContemplada
                        ? "bg-emerald-50/70 border-emerald-200"
                        : "bg-slate-50/80 hover:bg-slate-100/80 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 shadow-2xs ${
                          isContemplada
                            ? "bg-emerald-600 text-white"
                            : "bg-white border border-slate-200 text-slate-700"
                        }`}
                      >
                        #{pos}
                      </div>
                      <div className="min-w-0 truncate">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {nomes}
                          </span>
                          <span className="text-[10px] text-slate-500 font-semibold bg-white border border-slate-200 px-1.5 py-0.2 rounded-md flex-shrink-0">
                            Cota #{cota.numero}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                          Ciclo {pos} • Bolada: R$ {consorcio.valorTotalBolada.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleContemplada(cota.id, isContemplada ? "ATIVA" : "CONTEMPLADA")
                        }
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border transition cursor-pointer flex items-center gap-1 ${
                          isContemplada
                            ? "bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                            : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                        }`}
                        title={isContemplada ? "Clique para reverter para ativa" : "Marcar como contemplada"}
                      >
                        {isContemplada ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span>Contemplada</span>
                          </>
                        ) : (
                          <span>Aguardando</span>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
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
                        <span className="text-sm font-black text-slate-900">R$ {c.valorPrevisto.toFixed(2)}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 truncate">
                        <FileText className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{c.comprovante?.arquivoNome}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-200/60">
                      <button
                        onClick={() => handleConfirmarPagamento(c.id)}
                        className="py-2.5 px-3 bg-theme-main hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-sm touch-target"
                      >
                        Confirmar
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

            {/* Filtros por Status */}
            <div className="flex gap-2 overflow-x-auto pb-2 border-b border-slate-100">
              {["TODOS", "PENDENTE", "PAGO", "EM_ATRASO"].map((st) => (
                <button
                  key={st}
                  onClick={() => setFiltroStatus(st)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex-shrink-0 ${
                    filtroStatus === st
                      ? "bg-slate-800 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {st === "TODOS" ? "Todos os Ciclos" : st === "PAGO" ? "Confirmados (Pagos)" : st === "PENDENTE" ? "Pendentes" : "Em Atraso"}
                </button>
              ))}
            </div>

            {/* Lista em Grid de Cards Responsivos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-4">
              {listaFiltrada.map((c: any) => (
                <div key={c.id} className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-xs sm:text-sm">
                        {c.usuario?.name}
                      </span>
                      <span className="text-[10px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 font-semibold">
                        Cota #{c.cota?.numero} • Ciclo {c.numeroCiclo}
                      </span>
                    </div>
                    <p className="text-base font-black text-slate-900 mt-1">
                      R$ {c.valorPrevisto.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Vencimento: {formatarData(c.dataVencimento)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {c.status === "PAGO" ? (
                      <div className="flex items-center gap-1.5">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                          Pago
                        </span>
                        <button
                          onClick={() => {
                            setItemSelecionado(c);
                            setModalEstornoAberto(true);
                          }}
                          title="Estornar ou desfazer confirmação com justificativa"
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleConfirmarPagamento(c.id)}
                        className="px-3.5 py-2 bg-theme-main text-white text-xs font-bold rounded-xl shadow-sm hover:opacity-90 transition touch-target"
                      >
                        Confirmar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Alertas de Atraso e Auditoria */}
        <div className="lg:col-span-4 space-y-6">
          {/* Alerta de Contribuições Vencidas e Não Pagas (Página 75 do PDF) */}
          {contribuicoesAtrasadas.length > 0 && (
            <div className="bg-rose-50/90 border-2 border-rose-300 rounded-3xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-rose-900 text-sm">
                    Alerta de Atraso ({contribuicoesAtrasadas.length})
                  </h4>
                  <p className="text-[11px] text-rose-700">Parcelas vencidas aguardando pagamento</p>
                </div>
              </div>

              <div className="space-y-2.5">
                {contribuicoesAtrasadas.map((c: any) => (
                  <div key={c.id} className="bg-white p-3 rounded-2xl border border-rose-200 flex justify-between items-center text-xs shadow-sm">
                    <div>
                      <p className="font-bold text-slate-800">{c.usuario.name}</p>
                      <p className="text-[11px] text-slate-500">
                        Cota #{c.cota?.numero} • Venceu em {formatarData(c.dataVencimento)}
                      </p>
                      <span className="font-black text-rose-700 text-sm block mt-0.5">R$ {c.valorPrevisto.toFixed(2)}</span>
                    </div>
                    <div className="text-right">
                      <button
                        onClick={() => handleConfirmarPagamento(c.id)}
                        className="text-[11px] bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl hover:bg-emerald-700 transition shadow-sm"
                      >
                        Confirmar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trilha de Auditoria (Página 83 do PDF: data/hora, responsável, ação e justificativa) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-theme-light text-theme-text flex items-center justify-center font-bold text-sm">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">Histórico de Auditoria</h4>
                  <p className="text-[11px] text-slate-400">Registro seguro e imutável de ações</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                {consorcio.auditorias.length}
              </span>
            </div>

            <div className="space-y-3 text-xs max-h-[480px] overflow-y-auto overflow-x-hidden pr-1">
              {consorcio.auditorias.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50/60 rounded-2xl border border-slate-100">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-medium">Nenhum registro de auditoria até o momento.</p>
                </div>
              ) : (
                consorcio.auditorias.map((a: any) => {
                  const meta = getAcaoAuditoriaMeta(a.tipoAcao);
                  const IconComp = meta.icon;

                  return (
                    <div
                      key={a.id}
                      className="p-3.5 bg-slate-50/90 rounded-2xl border border-slate-200/80 space-y-2.5 overflow-hidden transition hover:bg-slate-50"
                    >
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

                      {/* Conteúdo Formatado com Participantes em Destaque */}
                      {renderAuditoriaDetalhes(a, consorcio)}

                      {/* Rodapé: Responsável e Justificativa */}
                      <div className="space-y-1.5 pt-0.5">
                        {a.usuarioResponsavel?.name && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400">
                            <span>👤 Por:</span>
                            <span className="font-semibold text-slate-600">
                              {a.usuarioResponsavel.name}
                            </span>
                          </div>
                        )}

                        {a.justificativa && (
                          <div className="p-2 bg-slate-100/70 rounded-xl border border-slate-200/60 text-[11px] text-slate-700 flex items-start gap-1.5 break-words">
                            <span className="font-bold flex-shrink-0 text-slate-800">Motivo:</span>
                            <span className="italic leading-relaxed">&ldquo;{a.justificativa}&rdquo;</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

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

              {/* Dados para Pagamento (Chave Pix / Conta Bancária) */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Dados para Receber Pagamentos (PIX / Conta)
                  </label>
                  <span className="text-[10px] text-theme-text font-bold bg-theme-light px-2 py-0.2 rounded-md">
                    Visível aos participantes
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={editDadosPagamento}
                  onChange={(e) => setEditDadosPagamento(e.target.value)}
                  placeholder="Ex: Chave Pix CPF: 123.456.789-00 ou Banco Itaú, Agência 1234, Conta 56789-0 - Titular: Marcos"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Esta instrução é exibida diretamente na tela dos participantes para eles realizarem o pagamento.
                </p>
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
    </div>
  );
}
