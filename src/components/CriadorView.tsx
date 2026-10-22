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
} from "lucide-react";

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
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-4 h-4 text-theme-text" />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Histórico de Auditoria</h4>
                <p className="text-[11px] text-slate-400">Registro seguro e imutável de ações</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs max-h-[460px] overflow-y-auto pr-1">
              {consorcio.auditorias.map((a: any) => (
                <div key={a.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex justify-between items-center text-[10px] text-slate-400">
                    <span className="font-bold text-theme-text uppercase">{a.tipoAcao}</span>
                    <span>{new Date(a.createdAt).toLocaleString("pt-BR")}</span>
                  </div>
                  <p className="font-medium text-slate-800 mt-1">{a.detalhes}</p>
                  {a.justificativa && (
                    <p className="text-[11px] text-slate-500 italic mt-1 bg-white p-2 rounded-lg border border-slate-100">
                      Motivo: &quot;{a.justificativa}&quot;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Reversão / Estorno com Justificativa Obrigatória */}
      {modalEstornoAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-xl max-h-[92vh] sm:max-h-[88vh] flex flex-col shadow-2xl border-t sm:border border-slate-100">
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
    </div>
  );
}
