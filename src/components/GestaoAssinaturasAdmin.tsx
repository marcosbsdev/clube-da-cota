"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  Crown,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Eye,
  Calendar,
  DollarSign,
  Users,
  FileText,
  MessageCircle,
  ChevronRight,
  TrendingUp,
  X,
  Check,
} from "lucide-react";
import {
  getPainelAssinaturasAction,
  aprovarAssinaturaAction,
  recusarAssinaturaAction,
  renovarAssinaturaManualAction,
  cancelarAssinaturaAction,
} from "@/app/actions";
import { gerarLinkWhatsApp } from "@/lib/finance";

interface GestaoAssinaturasAdminProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onAssinaturaAlterada?: () => void;
}

export function GestaoAssinaturasAdmin({
  currentUser,
  onAssinaturaAlterada,
}: GestaoAssinaturasAdminProps) {
  const [carregando, setCarregando] = useState(true);
  const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);

  // Dados do painel
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<any[]>([]);
  const [assinantes, setAssinantes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [metricas, setMetricas] = useState({
    totalAssinantesAtivos: 0,
    totalPendentes: 0,
    mrrEstimado: 0,
    prestesAVencer: 0,
  });

  // Filtros de busca
  const [abaAtiva, setAbaAtiva] = useState<"pendentes" | "assinantes" | "historico">("pendentes");
  const [busca, setBusca] = useState("");
  const [filtroPlano, setFiltroPlano] = useState<"TODOS" | "PRO" | "PRO_MASTER">("TODOS");

  // Modais de ação
  const [modalComprovante, setModalComprovante] = useState<{
    aberto: boolean;
    nome: string;
    url: string | null;
    usuarioNome: string;
    plano: string;
    valor: number;
  }>({
    aberto: false,
    nome: "",
    url: null,
    usuarioNome: "",
    plano: "",
    valor: 0,
  });

  const [modalRecusa, setModalRecusa] = useState<{
    aberto: boolean;
    assinaturaId: string | null;
    usuarioNome: string;
    motivo: string;
  }>({
    aberto: false,
    assinaturaId: null,
    usuarioNome: "",
    motivo: "",
  });

  const [modalRenovar, setModalRenovar] = useState<{
    aberto: boolean;
    usuarioId: string | null;
    usuarioNome: string;
    planoAtual: string;
    dias: number;
    observacao: string;
  }>({
    aberto: false,
    usuarioId: null,
    usuarioNome: "",
    planoAtual: "PRO",
    dias: 30,
    observacao: "",
  });

  const carregarDados = useCallback(async () => {
    try {
      setCarregando(true);
      const res = await getPainelAssinaturasAction(currentUser.id);
      if (res.success && res.data) {
        setSolicitacoesPendentes(res.data.solicitacoesPendentes || []);
        setAssinantes(res.data.assinantes || []);
        setHistorico(res.data.historico || []);
        setMetricas(res.data.metricas);
      } else {
        setMensagemErro(res.error || "Erro ao carregar dados de assinaturas.");
      }
    } catch (e: any) {
      setMensagemErro(e.message || "Falha de conexão.");
    } finally {
      setCarregando(false);
    }
  }, [currentUser.id]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const exibirFeedback = (msg: string, erro = false) => {
    if (erro) {
      setMensagemErro(msg);
      setTimeout(() => setMensagemErro(null), 4000);
    } else {
      setMensagemSucesso(msg);
      setTimeout(() => setMensagemSucesso(null), 4000);
    }
  };

  const handleAprovar = async (assinaturaId: string, dias = 30) => {
    try {
      setProcessandoAcao(assinaturaId);
      const res = await aprovarAssinaturaAction({
        assinaturaId,
        adminId: currentUser.id,
        diasAdicionais: dias,
      });
      if (res.success) {
        exibirFeedback(res.message || "Assinatura aprovada com sucesso!");
        await carregarDados();
        onAssinaturaAlterada?.();
      } else {
        exibirFeedback(res.error || "Erro ao aprovar.", true);
      }
    } catch (e: any) {
      exibirFeedback(e.message || "Falha ao processar aprovação.", true);
    } finally {
      setProcessandoAcao(null);
    }
  };

  const handleConfirmarRecusa = async () => {
    if (!modalRecusa.assinaturaId) return;
    if (!modalRecusa.motivo.trim()) {
      exibirFeedback("Por favor, informe a justificativa da recusa.", true);
      return;
    }

    try {
      setProcessandoAcao(modalRecusa.assinaturaId);
      const res = await recusarAssinaturaAction({
        assinaturaId: modalRecusa.assinaturaId,
        adminId: currentUser.id,
        motivoRecusa: modalRecusa.motivo,
      });

      if (res.success) {
        exibirFeedback("Solicitação de assinatura recusada.");
        setModalRecusa({ aberto: false, assinaturaId: null, usuarioNome: "", motivo: "" });
        await carregarDados();
        onAssinaturaAlterada?.();
      } else {
        exibirFeedback(res.error || "Erro ao recusar.", true);
      }
    } catch (e: any) {
      exibirFeedback(e.message || "Falha ao processar recusa.", true);
    } finally {
      setProcessandoAcao(null);
    }
  };

  const handleConfirmarRenovacao = async () => {
    if (!modalRenovar.usuarioId) return;

    try {
      setProcessandoAcao(modalRenovar.usuarioId);
      const res = await renovarAssinaturaManualAction({
        usuarioId: modalRenovar.usuarioId,
        adminId: currentUser.id,
        plano: modalRenovar.planoAtual as any,
        diasAdicionais: modalRenovar.dias,
        observacoes: modalRenovar.observacao,
      });

      if (res.success) {
        exibirFeedback(res.message || "Assinatura renovada com sucesso!");
        setModalRenovar({
          aberto: false,
          usuarioId: null,
          usuarioNome: "",
          planoAtual: "PRO",
          dias: 30,
          observacao: "",
        });
        await carregarDados();
        onAssinaturaAlterada?.();
      } else {
        exibirFeedback(res.error || "Erro ao renovar.", true);
      }
    } catch (e: any) {
      exibirFeedback(e.message || "Falha ao renovar assinatura.", true);
    } finally {
      setProcessandoAcao(null);
    }
  };

  const handleCancelarAssinatura = async (usuarioId: string, usuarioNome: string) => {
    if (!confirm(`Tem certeza que deseja cancelar a assinatura de ${usuarioNome}? O plano retornará para Comum.`)) {
      return;
    }

    try {
      setProcessandoAcao(usuarioId);
      const res = await cancelarAssinaturaAction({
        usuarioId,
        adminId: currentUser.id,
        motivo: "Cancelamento solicitado ou inadimplência verificado pelo Super Admin.",
      });

      if (res.success) {
        exibirFeedback(res.message || "Assinatura cancelada com sucesso.");
        await carregarDados();
        onAssinaturaAlterada?.();
      } else {
        exibirFeedback(res.error || "Erro ao cancelar assinatura.", true);
      }
    } catch (e: any) {
      exibirFeedback(e.message || "Falha ao cancelar assinatura.", true);
    } finally {
      setProcessandoAcao(null);
    }
  };

  // Filtragem de assinantes
  const assinantesFiltrados = assinantes.filter((u) => {
    const matchesBusca =
      u.name.toLowerCase().includes(busca.toLowerCase()) ||
      u.email.toLowerCase().includes(busca.toLowerCase());
    const matchesPlano = filtroPlano === "TODOS" || u.role === filtroPlano;
    return matchesBusca && matchesPlano;
  });

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-6">
      {/* Cabeçalho do Módulo Administrativo */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 text-white flex items-center justify-center font-black shadow-md shadow-purple-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">
                Gestão de Assinaturas & Planos SaaS
              </h3>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Controle financeiro de mensalidades, aprovação de comprovantes Pix e vigências de planos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={carregarDados}
          disabled={carregando}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition cursor-pointer"
          title="Recarregar dados"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${carregando ? "animate-spin" : ""}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {/* Alertas de Notificação */}
      {mensagemSucesso && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{mensagemSucesso}</span>
        </div>
      )}
      {mensagemErro && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{mensagemErro}</span>
        </div>
      )}

      {/* Cards de Métricas SaaS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: MRR */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">MRR Estimado</span>
            <DollarSign className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            R$ {metricas.mrrEstimado.toFixed(2).replace(".", ",")}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Receita mensal das assinaturas ativas</span>
        </div>

        {/* Card 2: Assinantes Ativos */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-white border border-blue-200/80 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assinantes Ativos</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metricas.totalAssinantesAtivos}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Usuários com Pro ou Pro Master vigente</span>
        </div>

        {/* Card 3: Solicitações Pendentes */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-white border border-amber-200/80 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aguardando Pix</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metricas.totalPendentes}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Comprovantes para você conferir</span>
        </div>

        {/* Card 4: Prestes a Vencer */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200/80 shadow-xs">
          <div className="flex items-center justify-between text-purple-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">A Vencer (&le; 5 dias)</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">
            {metricas.prestesAVencer}
          </div>
          <span className="text-[10px] text-slate-500 font-medium">Assinantes que devem renovar em breve</span>
        </div>
      </div>

      {/* Navegação entre Abas do Módulo */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setAbaAtiva("pendentes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "pendentes"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Solicitações Pendentes</span>
          {metricas.totalPendentes > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                abaAtiva === "pendentes" ? "bg-white text-purple-700" : "bg-amber-100 text-amber-800"
              }`}
            >
              {metricas.totalPendentes}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("assinantes")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "assinantes"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Assinantes ({assinantes.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setAbaAtiva("historico")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
            abaAtiva === "historico"
              ? "bg-purple-600 text-white shadow-xs"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Histórico & Auditoria</span>
        </button>
      </div>

      {/* CONTEÚDO DA ABA 1: SOLICITAÇÕES PENDENTES */}
      {abaAtiva === "pendentes" && (
        <div className="space-y-3">
          {solicitacoesPendentes.length === 0 ? (
            <div className="text-center py-10 px-4 bg-slate-50/70 rounded-2xl border border-slate-200/80">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="font-bold text-slate-800 text-sm">Nenhuma solicitação pendente</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Todos os comprovantes de Pix enviados pelos usuários foram analisados e aprovados.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {solicitacoesPendentes.map((sol) => {
                const linkWhatsApp = sol.usuario.telefone
                  ? gerarLinkWhatsApp({
                      telefone: sol.usuario.telefone,
                      mensagem: `Olá ${sol.usuario.name}! Aqui é o Marcos Batista do Clube da Cota sobre o seu comprovante do Plano ${sol.plano}.`,
                    })
                  : null;

                const isProcessando = processandoAcao === sol.id;

                return (
                  <div
                    key={sol.id}
                    className="p-4 sm:p-5 rounded-2xl bg-amber-50/40 border-2 border-amber-200/90 flex flex-col md:flex-row md:items-center justify-between gap-4 transition shadow-xs"
                  >
                    {/* Dados do Usuário e Solicitação */}
                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-sm sm:text-base">
                          {sol.usuario.name}
                        </span>
                        <span
                          className={`text-xs font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            sol.plano === "PRO_MASTER"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {sol.plano === "PRO_MASTER" ? (
                            <>
                              <Crown className="w-3 h-3 text-purple-700" /> Pro Master
                            </>
                          ) : (
                            <>
                              <Zap className="w-3 h-3 text-blue-700" /> Pro
                            </>
                          )}
                        </span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          R$ {sol.valor.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>{sol.usuario.email}</span>
                        {sol.usuario.telefone && (
                          <span className="text-slate-700 font-medium">{sol.usuario.telefone}</span>
                        )}
                        <span>
                          Solicitado em:{" "}
                          <strong className="text-slate-700">
                            {new Date(sol.solicitadoEm).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "2-digit",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </strong>
                        </span>
                      </div>

                      {sol.observacoes && (
                        <p className="text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-amber-100 font-medium">
                          Nota do usuário: &ldquo;{sol.observacoes}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Ações de Comprovante e Aprovação */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap flex-shrink-0">
                      {/* Botão Ver Comprovante */}
                      <button
                        type="button"
                        onClick={() =>
                          setModalComprovante({
                            aberto: true,
                            nome: sol.comprovanteNome || "Comprovante Pix",
                            url: sol.comprovanteUrl,
                            usuarioNome: sol.usuario.name,
                            plano: sol.plano,
                            valor: sol.valor,
                          })
                        }
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 shadow-xs transition cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ver Comprovante</span>
                      </button>

                      {/* Link WhatsApp com o Usuário */}
                      {linkWhatsApp && (
                        <a
                          href={linkWhatsApp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-xs font-bold text-emerald-800 transition"
                          title="Falar no WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>
                      )}

                      {/* Botão Recusar */}
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() =>
                          setModalRecusa({
                            aberto: true,
                            assinaturaId: sol.id,
                            usuarioNome: sol.usuario.name,
                            motivo: "",
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-bold text-rose-700 transition cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Recusar</span>
                      </button>

                      {/* Botão Aprovar +30 dias */}
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleAprovar(sol.id, 30)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        {isProcessando ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        <span>Aprovar (+30 dias)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 2: ASSINANTES ATIVOS */}
      {abaAtiva === "assinantes" && (
        <div className="space-y-4">
          {/* Barra de Filtros e Busca */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Buscar assinante por nome ou e-mail..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-600"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold">Plano:</span>
              <select
                value={filtroPlano}
                onChange={(e) => setFiltroPlano(e.target.value as any)}
                className="text-xs font-bold p-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:border-purple-600"
              >
                <option value="TODOS">Todos os Planos</option>
                <option value="PRO">Apenas Pro</option>
                <option value="PRO_MASTER">Apenas Pro Master</option>
              </select>
            </div>
          </div>

          {assinantesFiltrados.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50/70 rounded-2xl border border-slate-200/80 text-xs text-slate-500">
              Nenhum assinante encontrado para o filtro aplicado.
            </div>
          ) : (
            <div className="space-y-2.5">
              {assinantesFiltrados.map((u) => {
                const vig = u.vigencia;
                const isProcessando = processandoAcao === u.id;

                return (
                  <div
                    key={u.id}
                    className="p-4 rounded-2xl bg-slate-50/80 hover:bg-slate-50 border border-slate-200/90 flex flex-col md:flex-row md:items-center justify-between gap-3 transition"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            u.role === "PRO_MASTER"
                              ? "bg-purple-100 text-purple-800 border border-purple-200"
                              : "bg-blue-100 text-blue-800 border border-blue-200"
                          }`}
                        >
                          {u.role === "PRO_MASTER" ? "Pro Master" : "Pro"}
                        </span>
                        <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${vig.badgeClasse}`}>
                          {vig.badgeTexto}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span>{u.email}</span>
                        {u.telefone && <span>{u.telefone}</span>}
                        <span className="text-slate-700 font-medium">
                          {vig.dataExpiracaoFormatada
                            ? `Vencimento: ${vig.dataExpiracaoFormatada}`
                            : "Vigência ativa"}
                        </span>
                      </div>
                    </div>

                    {/* Ações de Gestão */}
                    <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() =>
                          setModalRenovar({
                            aberto: true,
                            usuarioId: u.id,
                            usuarioNome: u.name,
                            planoAtual: u.role,
                            dias: 30,
                            observacao: "",
                          })
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-bold transition cursor-pointer"
                        title="Renovar por +30 dias"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Renovar +30d</span>
                      </button>

                      <button
                        type="button"
                        disabled={isProcessando}
                        onClick={() => handleCancelarAssinatura(u.id, u.name)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-500 hover:text-rose-700 text-xs font-bold transition cursor-pointer"
                        title="Reverter para Plano Comum"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* CONTEÚDO DA ABA 3: HISTÓRICO & AUDITORIA */}
      {abaAtiva === "historico" && (
        <div className="space-y-3">
          {historico.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500 bg-slate-50 rounded-2xl border border-slate-200">
              Nenhum histórico registrado até o momento.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 border border-slate-200/90 rounded-2xl overflow-hidden bg-white">
              {historico.map((h) => (
                <div key={h.id} className="p-3.5 text-xs flex items-center justify-between gap-3 hover:bg-slate-50/70">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900">{h.usuario.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          h.status === "APROVADO"
                            ? "bg-emerald-100 text-emerald-800"
                            : h.status === "RECUSADO"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {h.status}
                      </span>
                      <span className="font-semibold text-slate-700">Plano {h.plano}</span>
                      <span className="text-slate-500 font-mono">
                        R$ {h.valor?.toFixed(2).replace(".", ",")}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {h.aprovadoPor ? `Analisado por ${h.aprovadoPor.name} em ` : "Registrado em "}
                      {new Date(h.updatedAt).toLocaleString("pt-BR")}
                      {h.motivoRecusa && (
                        <span className="text-rose-600 block mt-0.5 font-medium">
                          Motivo da recusa: {h.motivoRecusa}
                        </span>
                      )}
                      {h.observacoes && (
                        <span className="text-slate-600 block mt-0.5">Obs: {h.observacoes}</span>
                      )}
                    </p>
                  </div>

                  {h.dataFim && (
                    <div className="text-right text-[11px] flex-shrink-0">
                      <span className="text-slate-400 block">Vigência até</span>
                      <span className="font-bold text-slate-800">
                        {new Date(h.dataFim).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: VISUALIZAR COMPROVANTE PIX */}
      {modalComprovante.aberto && (
        <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in zoom-in-95">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm sm:text-base">Comprovante de Transferência Pix</h4>
                <p className="text-xs text-white/70">
                  {modalComprovante.usuarioNome} &bull; Plano {modalComprovante.plano} (R${" "}
                  {modalComprovante.valor.toFixed(2).replace(".", ",")})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalComprovante((prev) => ({ ...prev, aberto: false }))}
                className="text-white/70 hover:text-white bg-white/10 rounded-full p-1.5 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-center">
                {modalComprovante.url ? (
                  modalComprovante.url.startsWith("data:image/") ||
                  modalComprovante.url.match(/\.(png|jpe?g|webp)$/i) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={modalComprovante.url}
                      alt="Comprovante Pix"
                      className="max-h-96 mx-auto rounded-xl object-contain shadow-xs border border-slate-200"
                    />
                  ) : (
                    <div className="py-8 space-y-2">
                      <FileText className="w-12 h-12 text-blue-600 mx-auto" />
                      <p className="font-bold text-xs text-slate-800">{modalComprovante.nome}</p>
                      <a
                        href={modalComprovante.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
                      >
                        Abrir Documento Completo
                      </a>
                    </div>
                  )
                ) : (
                  <div className="py-8 space-y-2 text-slate-500 text-xs">
                    <FileText className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-slate-700">{modalComprovante.nome}</p>
                    <p>O comprovante foi enviado diretamente para o seu WhatsApp oficial.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setModalComprovante((prev) => ({ ...prev, aberto: false }))}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECUSAR COMPROVANTE */}
      {modalRecusa.aberto && (
        <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-sm">
              <XCircle className="w-5 h-5 flex-shrink-0" />
              <h4>Recusar Solicitação de Assinatura</h4>
            </div>

            <p className="text-xs text-slate-600">
              Informe o motivo da recusa para <strong>{modalRecusa.usuarioNome}</strong>. Ele poderá enviar um novo comprovante corrigido.
            </p>

            <textarea
              rows={3}
              placeholder="Ex: Valor transferido divergente do plano, comprovante ilegível ou corte de data ausente..."
              value={modalRecusa.motivo}
              onChange={(e) => setModalRecusa((prev) => ({ ...prev, motivo: e.target.value }))}
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setModalRecusa({ aberto: false, assinaturaId: null, usuarioNome: "", motivo: "" })
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRecusa}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Recusa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: RENOVAÇÃO MANUAL / ESTENDER VIGÊNCIA */}
      {modalRenovar.aberto && (
        <div className="fixed inset-0 z-[150] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-2.5 text-purple-700 font-bold text-sm">
              <Calendar className="w-5 h-5 flex-shrink-0" />
              <h4>Renovar ou Estender Assinatura</h4>
            </div>

            <p className="text-xs text-slate-600">
              Conceda mais dias de acesso ao plano para <strong>{modalRenovar.usuarioNome}</strong>:
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Plano Alvo:</label>
                <select
                  value={modalRenovar.planoAtual}
                  onChange={(e) =>
                    setModalRenovar((prev) => ({ ...prev, planoAtual: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="PRO">Plano Pro (R$ 19,90/mês)</option>
                  <option value="PRO_MASTER">Plano Pro Master (R$ 29,90/mês)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Dias Adicionais de Acesso:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[30, 60, 90].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setModalRenovar((prev) => ({ ...prev, dias: d }))}
                      className={`p-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        modalRenovar.dias === d
                          ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                          : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      +{d} dias
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Observação / Justificativa (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Pagamento Pix recebido no banco / Cortesia"
                  value={modalRenovar.observacao}
                  onChange={(e) =>
                    setModalRenovar((prev) => ({ ...prev, observacao: e.target.value }))
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-purple-600"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() =>
                  setModalRenovar({
                    aberto: false,
                    usuarioId: null,
                    usuarioNome: "",
                    planoAtual: "PRO",
                    dias: 30,
                    observacao: "",
                  })
                }
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmarRenovacao}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold cursor-pointer"
              >
                Confirmar Renovação
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
