"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Bell,
  Home,
  BarChart3,
  PlusCircle,
  UserCircle,
  ChevronDown,
  Check,
  RefreshCw,
  LogOut,
  CheckCircle2,
  RotateCcw,
  Edit3,
  ArrowLeftRight,
  Sparkles,
  FolderKanban,
  FileText,
  CheckCheck,
  X,
  ExternalLink,
  ShieldCheck,
  UserCheck,
  Lock,
} from "lucide-react";
import { TabType } from "./BottomNav";
import { AppLogo } from "./AppLogo";
import { marcarNotificacoesLidasAction, dispensarNotificacaoAction } from "@/app/actions";

interface HeaderProps {
  userName: string;
  userRole: string;
  unreadCount?: number;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
  canCreateOrManage?: boolean;
  canManage?: boolean;
  canCreate?: boolean;
  currentUserId?: string;
  todosUsuarios?: any[];
  onTrocarUsuario?: (id: string) => void;
  onLogout?: () => void;
  consorcioAtual?: any;
  todosConsorcios?: any[];
  onSelecionarConsorcio?: (id: string) => void;
}

function formatarTempoRelativo(dateStr: string | Date): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Agora mesmo";
  if (diffMin < 60) return `Há ${diffMin} min`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Há ${diffHours} h`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Ontem";
  if (diffDays < 7) return `Há ${diffDays} dias`;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getNotificacaoMeta(tipoAcao: string) {
  switch (tipoAcao) {
    case "CONFIRMACAO_PAGAMENTO":
      return {
        label: "Pagamento Confirmado",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
      };
    case "ESTORNO_PAGAMENTO":
      return {
        label: "Estorno de Pagamento",
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        icon: RotateCcw,
      };
    case "ENVIO_COMPROVANTE":
      return {
        label: "Comprovante Enviado",
        bg: "bg-blue-100 text-blue-800 border-blue-200",
        icon: FileText,
      };
    case "RECUSA_COMPROVANTE":
      return {
        label: "Comprovante Recusado",
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        icon: X,
      };
    case "TROCA_POSICAO_COTA":
    case "TROCA_POSICOES":
      return {
        label: tipoAcao === "TROCA_POSICOES" ? "Consolidação de Sorteio" : "Permuta de Sorteio",
        bg: "bg-amber-100 text-amber-800 border-amber-200",
        icon: ArrowLeftRight,
      };
    case "CONTEMPLACAO_COTA":
    case "CONTEMPLACAO_MARCADA":
      return {
        label: tipoAcao === "CONTEMPLACAO_MARCADA" ? "Contemplações em Lote" : "Cota Contemplada",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: Sparkles,
      };
    case "REVERSAO_CONTEMPLACAO_COTA":
      return {
        label: "Contemplação Revertida",
        bg: "bg-orange-100 text-orange-800 border-orange-200",
        icon: RotateCcw,
      };
    case "EDICAO_DADOS_CONSORCIO":
      return {
        label: "Dados Atualizados",
        bg: "bg-blue-100 text-blue-800 border-blue-200",
        icon: Edit3,
      };
    case "EDICAO_DADOS_PARTICIPANTE":
      return {
        label: "Participante Editado",
        bg: "bg-sky-100 text-sky-800 border-sky-200",
        icon: Edit3,
      };
    case "SUBSTITUICAO_PARTICIPANTE_COTA":
      return {
        label: "Repasse de Cota",
        bg: "bg-purple-100 text-purple-800 border-purple-200",
        icon: UserCheck,
      };
    case "ATIVACAO_CONTA_PARTICIPANTE":
      return {
        label: "Cadastro Ativado",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: UserCheck,
      };
    case "CRIACAO_CONSORCIO":
      return {
        label: "Consórcio Criado",
        bg: "bg-violet-100 text-violet-800 border-violet-200",
        icon: FolderKanban,
      };
    case "ENCERRAMENTO_CONSORCIO":
      return {
        label: "Consórcio Encerrado",
        bg: "bg-rose-100 text-rose-800 border-rose-200",
        icon: Lock,
      };
    case "REATIVACAO_CONSORCIO":
      return {
        label: "Consórcio Reativado",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-200",
        icon: CheckCircle2,
      };
    default:
      return {
        label: "Alteração no Consórcio",
        bg: "bg-slate-100 text-slate-800 border-slate-200",
        icon: Bell,
      };
  }
}

function formatarTextoNotificacao(tipoAcao: string, detalhes: string): string {
  let parsed: any = null;
  if (typeof detalhes === "string" && (detalhes.startsWith("{") || detalhes.startsWith("["))) {
    try {
      parsed = JSON.parse(detalhes);
    } catch {
      parsed = null;
    }
  }

  switch (tipoAcao) {
    case "CONFIRMACAO_PAGAMENTO":
      if (parsed?.ciclosQuitados) {
        const parcelas = parsed.totalParcelas ? `${parsed.totalParcelas} parcelas` : "";
        const valorFormatado = parsed.valorArrecadado != null
          ? ` • Total: R$ ${Number(parsed.valorArrecadado).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
          : "";
        return `Quitação em lote: Ciclos ${parsed.ciclosQuitados}${parcelas ? ` • ${parcelas}` : ""}${valorFormatado}.`;
      }
      if (parsed && typeof detalhes === "string" && detalhes.startsWith("{")) {
        return "Pagamentos de mensalidade confirmados e quitados.";
      }
      return detalhes || "Pagamento de mensalidade confirmado e quitado.";

    case "CONTEMPLACAO_MARCADA":
      if (parsed?.contemplados && Array.isArray(parsed.contemplados)) {
        const total = parsed.contemplados.length;
        const nomes = parsed.contemplados.slice(0, 3).map((item: string) => {
          const p = item.split(":");
          return p.length > 1 ? `${p[0]?.trim()} (${p[1]?.trim()})` : item;
        }).join(", ");
        const resto = total > 3 ? ` e mais ${total - 3} contemplados` : "";
        return `Contemplação de ${total} cotas registrada: ${nomes}${resto}.`;
      }
      return "Contemplações do consórcio registradas com sucesso.";

    case "ESTORNO_PAGAMENTO":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Confirmação de pagamento estornada com justificativa.";

    case "ENVIO_COMPROVANTE":
      if (parsed) {
        if (parsed.participante && parsed.ciclo) {
          return `Novo comprovante PIX anexado por ${parsed.participante} (Ciclo #${parsed.ciclo}).`;
        }
        return `Novo comprovante PIX anexado para Cota #${parsed.cotaNumero || "?"} (Ciclo #${parsed.numeroCiclo || "?"}).`;
      }
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Novo comprovante PIX anexado pelo participante.";

    case "RECUSA_COMPROVANTE":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Comprovante de pagamento recusado pelo administrador.";

    case "TROCA_POSICAO_COTA":
      if (parsed?.cota1 && parsed?.cota2) {
        const p1 = parsed.cota1.participantes ? ` (${parsed.cota1.participantes})` : "";
        const p2 = parsed.cota2.participantes ? ` (${parsed.cota2.participantes})` : "";
        return `Permuta de ordem: Cota #${parsed.cota1.numero}${p1} trocou com Cota #${parsed.cota2.numero}${p2}.`;
      }
      return "Troca de posições na ordem de sorteio realizada.";

    case "TROCA_POSICOES":
      if (parsed?.descricao) {
        return parsed.descricao;
      }
      if (parsed?.totalTrocas) {
        return `Consolidação de ${parsed.totalTrocas} trocas acordadas na ordem de sorteio.`;
      }
      return "Consolidação das trocas na ordem de sorteio realizada.";

    case "CONTEMPLACAO_COTA":
      if (parsed?.numero) {
        const p = parsed.participantes ? ` (${parsed.participantes})` : "";
        return `A Cota #${parsed.numero}${p} foi contemplada com a bolada!`;
      }
      return "Cota contemplada no sorteio do consórcio.";

    case "REVERSAO_CONTEMPLACAO_COTA":
      if (parsed?.numero) {
        return `Contemplação da Cota #${parsed.numero} foi revertida.`;
      }
      return "Reversão de cota contemplada registrada.";

    case "EDICAO_DADOS_CONSORCIO":
      if (parsed?.depois?.nome) {
        return `Dados do consórcio atualizados (Nome: "${parsed.depois.nome}").`;
      }
      return "Dados cadastrais ou regras de pagamento atualizados.";

    case "EDICAO_DADOS_PARTICIPANTE":
      if (parsed?.novoNome) {
        return `Dados cadastrais de ${parsed.novoNome} foram atualizados.`;
      }
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Dados cadastrais de participante atualizados.";

    case "SUBSTITUICAO_PARTICIPANTE_COTA":
      if (parsed?.cotaNumero && parsed?.novoParticipante?.name) {
        return `Cota #${parsed.cotaNumero} repassada para ${parsed.novoParticipante.name} a partir do ciclo ${parsed.aPartirDoCiclo || 1}.`;
      }
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Cota repassada para novo titular com justificativa.";

    case "ATIVACAO_CONTA_PARTICIPANTE":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Participante concluiu cadastro oficial com senha.";

    case "CRIACAO_CONSORCIO":
      if (parsed?.nome) {
        const cotas = parsed.totalCotas ? ` com ${parsed.totalCotas} cotas` : "";
        return `Consórcio "${parsed.nome}" criado com sucesso${cotas}.`;
      }
      if (parsed && typeof detalhes === "string" && detalhes.startsWith("{")) {
        return "Grupo de consórcio criado com sucesso.";
      }
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Grupo de consórcio criado com sucesso.";

    case "ENCERRAMENTO_CONSORCIO":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Consórcio foi encerrado (modo somente leitura).";

    case "REATIVACAO_CONSORCIO":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Consórcio foi reativado com sucesso.";

    case "EXCLUSAO_CONSORCIO_TESTE":
      return detalhes && !detalhes.startsWith("{") ? detalhes : "Consórcio de teste excluído definitivamente.";

    default:
      if (parsed) {
        if (parsed.descricao) return parsed.descricao;
        if (parsed.mensagem) return parsed.mensagem;
        if (parsed.nome) return `Alteração registrada em "${parsed.nome}".`;
        return "Alteração de dados registrada no consórcio.";
      }
      if (typeof detalhes === "string" && (detalhes.startsWith("{") || detalhes.startsWith("["))) {
        return "Alteração registrada no consórcio.";
      }
      return detalhes || "Alteração registrada no consórcio.";
  }
}

export function Header({
  userName,
  userRole,
  unreadCount: unreadCountProp,
  activeTab = "participante",
  onChangeTab,
  canCreateOrManage = true,
  canManage,
  canCreate,
  currentUserId,
  todosUsuarios = [],
  onTrocarUsuario,
  onLogout,
  consorcioAtual,
  todosConsorcios = [],
  onSelecionarConsorcio,
}: HeaderProps) {
  const canManageResolved = canManage !== undefined ? canManage : canCreateOrManage;
  const canCreateResolved = canCreate !== undefined ? canCreate : canCreateOrManage;

  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [notificacoesAberto, setNotificacoesAberto] = useState(false);
  const notificacoesRef = useRef<HTMLDivElement>(null);

  // Estado sincronizado entre Server (Cookies/Consorcio) e Client (LocalStorage)
  const [lidasAte, setLidasAte] = useState<string | null>(consorcioAtual?.notificacoesLidasAte || null);
  const [dispensadasIds, setDispensadasIds] = useState<string[]>(consorcioAtual?.notificacoesDispensadasIds || []);

  const auditorias = consorcioAtual?.auditorias || [];

  // Sincroniza dados persistidos no consorcioAtual (Server)
  useEffect(() => {
    if (consorcioAtual?.notificacoesLidasAte) {
      setLidasAte((prev) => {
        if (!prev) return consorcioAtual.notificacoesLidasAte;
        return new Date(consorcioAtual.notificacoesLidasAte) > new Date(prev)
          ? consorcioAtual.notificacoesLidasAte
          : prev;
      });
    }
    if (consorcioAtual?.notificacoesDispensadasIds?.length) {
      setDispensadasIds((prev) =>
        Array.from(new Set([...prev, ...consorcioAtual.notificacoesDispensadasIds]))
      );
    }
  }, [consorcioAtual?.notificacoesLidasAte, consorcioAtual?.notificacoesDispensadasIds]);

  // Carrega imediatamente do localStorage e cookies como redundância instantânea
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const idKey = consorcioAtual?.id || "global";
        const savedLidasAte =
          localStorage.getItem(`clube_cota_lidas_${idKey}`) ||
          localStorage.getItem(`clube_cota_lidas_global`);
        if (savedLidasAte) {
          setLidasAte((prev) =>
            !prev || new Date(savedLidasAte) > new Date(prev) ? savedLidasAte : prev
          );
        }
        const savedDispensadas =
          localStorage.getItem(`clube_cota_dispensadas_${idKey}`) ||
          localStorage.getItem(`clube_cota_dispensadas_global`);
        if (savedDispensadas) {
          const parsed = JSON.parse(savedDispensadas);
          if (Array.isArray(parsed)) {
            setDispensadasIds((prev) => Array.from(new Set([...prev, ...parsed])));
          }
        }
      } catch {}
    }
  }, [consorcioAtual?.id]);

  // Filtra APENAS novas notificações (não lidas e não dispensadas)
  const unreadAuditorias = auditorias.filter((a: any) => {
    if (dispensadasIds.includes(a.id)) return false;
    if (lidasAte) {
      const dataCriacao = new Date(a.createdAt).getTime();
      const dataLeitura = new Date(lidasAte).getTime();
      if (dataCriacao <= dataLeitura) return false;
    }
    return true;
  });

  const unreadCount = unreadAuditorias.length;

  const marcarTodasComoLidas = async () => {
    const agora = new Date().toISOString();
    setLidasAte(agora);
    if (consorcioAtual) {
      consorcioAtual.notificacoesLidasAte = agora;
    }
    if (typeof window !== "undefined") {
      try {
        const idKey = consorcioAtual?.id || "global";
        localStorage.setItem(`clube_cota_lidas_${idKey}`, agora);
        localStorage.setItem(`clube_cota_lidas_global`, agora);
        // Persistência síncrona imediata em cookie no navegador para sobreviver ao F5
        document.cookie = `clube_cota_lidas_${idKey}=${agora}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `clube_cota_lidas_global=${agora}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    }
    if (consorcioAtual?.id) {
      await marcarNotificacoesLidasAction(consorcioAtual.id);
    }
  };

  const marcarComoLida = async (id: string) => {
    const novosIds = Array.from(new Set([...dispensadasIds, id]));
    setDispensadasIds(novosIds);
    if (consorcioAtual) {
      consorcioAtual.notificacoesDispensadasIds = novosIds;
    }
    if (typeof window !== "undefined") {
      try {
        const idKey = consorcioAtual?.id || "global";
        const serialized = JSON.stringify(novosIds);
        localStorage.setItem(`clube_cota_dispensadas_${idKey}`, serialized);
        localStorage.setItem(`clube_cota_dispensadas_global`, serialized);
        document.cookie = `clube_cota_dispensadas_${idKey}=${encodeURIComponent(serialized)}; path=/; max-age=31536000; SameSite=Lax`;
        document.cookie = `clube_cota_dispensadas_global=${encodeURIComponent(serialized)}; path=/; max-age=31536000; SameSite=Lax`;
      } catch {}
    }
    if (consorcioAtual?.id) {
      await dispensarNotificacaoAction(consorcioAtual.id, id);
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
      }
      if (notificacoesRef.current && !notificacoesRef.current.contains(event.target as Node)) {
        setNotificacoesAberto(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getInitials = (name: string) => {
    const parts = name.split(" ");
    return parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : name.slice(0, 2).toUpperCase();
  };

  const formatRole = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "Super Admin";
      case "PRO_MASTER":
        return "Pro Master";
      case "PRO":
        return "Pro";
      default:
        return "Comum";
    }
  };

  return (
    <header className="bg-theme-main text-white shadow-md transition-colors duration-300 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Marca / Identidade do Sistema */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl shadow-sm flex-shrink-0">
              <AppLogo size={40} />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-white/70 block leading-none">
                Consórcio entre Amigos
              </span>
              <h1 className="text-base sm:text-lg font-black tracking-tight leading-tight text-white">
                Clube da Cota
              </h1>
            </div>
          </div>

          {/* Navegação Desktop (Visível apenas em md: e superiores) */}
          {onChangeTab && (
            <nav className="hidden md:flex items-center gap-1.5 ml-6 border-l border-white/20 pl-6">
              <button
                onClick={() => onChangeTab("participante")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "participante"
                    ? "bg-white text-theme-main shadow-sm"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Meu Consórcio</span>
              </button>

              {canManageResolved && (
                <button
                  onClick={() => onChangeTab("criador")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === "criador"
                      ? "bg-white text-theme-main shadow-sm"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Gestão do Grupo</span>
                </button>
              )}

              {canCreateResolved && (
                <button
                  onClick={() => onChangeTab("assistente")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    activeTab === "assistente"
                      ? "bg-white text-theme-main shadow-sm"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Novo Consórcio</span>
                </button>
              )}

              <button
                onClick={() => onChangeTab("perfil")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === "perfil"
                    ? "bg-white text-theme-main shadow-sm"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <UserCircle className="w-4 h-4" />
                <span>Perfil & Tema</span>
              </button>
            </nav>
          )}
        </div>

        {/* Perfil do Usuário e Notificações */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* Seletor Rápido de Perfil */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownAberto(!dropdownAberto)}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white/10 hover:bg-white/20 transition border border-white/20 text-left cursor-pointer"
              title="Clique para alternar entre os perfis do consórcio"
            >
              <div className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                {getInitials(userName)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-white/80 font-medium leading-none">Perfil:</span>
                  <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                    {formatRole(userRole)}
                  </span>
                </div>
                <h2 className="text-xs font-bold leading-tight mt-0.5 text-white max-w-[130px] truncate">
                  {userName}
                </h2>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-white/80 transition-transform ${dropdownAberto ? "rotate-180" : ""}`} />
            </button>

            {/* Menu Dropdown com todos os perfis */}
            {dropdownAberto && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 px-3 z-50 text-slate-800">
                <div className="px-2 pb-2 mb-2 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Alternar Conta de Teste
                  </span>
                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-md">
                    {todosUsuarios.length} contas
                  </span>
                </div>

                <div className="space-y-1 max-h-72 overflow-y-auto">
                  {todosUsuarios.map((u) => {
                    const isCurrent = u.id === currentUserId;
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          if (onTrocarUsuario) onTrocarUsuario(u.id);
                          setDropdownAberto(false);
                        }}
                        className={`w-full p-2.5 rounded-2xl text-left text-xs flex items-center justify-between transition ${
                          isCurrent
                            ? "bg-theme-light border border-theme-main/30 text-theme-text font-bold"
                            : "hover:bg-slate-50 border border-transparent text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isCurrent ? "bg-theme-main text-white" : "bg-slate-200 text-slate-700"
                          }`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="truncate">
                            <span className="block truncate font-bold text-slate-900">{u.name}</span>
                            <span className="block text-[10px] text-slate-400 truncate">{u.email}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {formatRole(u.role)}
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-theme-text" />}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {onLogout && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDropdownAberto(false);
                        onLogout();
                      }}
                      className="w-full p-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sininho de Notificações com Trilha de Auditoria */}
          <div className="relative" ref={notificacoesRef}>
            <button
              onClick={() => setNotificacoesAberto(!notificacoesAberto)}
              className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer text-white flex items-center justify-center"
              title={unreadCount > 0 ? `${unreadCount} nova(s) notificação(ões)` : "Notificações do Consórcio"}
              aria-label="Notificações"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-900 text-[9px] font-black w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center border-2 border-theme-main shadow-sm animate-pulse">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Menu Dropdown de Notificações */}
            {notificacoesAberto && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 py-3 px-3 z-50 text-slate-800 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2 pb-2.5 mb-2 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-black text-slate-900">
                      Notificações
                    </span>
                    {unreadCount > 0 ? (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        {unreadCount} nova{unreadCount > 1 ? "s" : ""}
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        Em dia
                      </span>
                    )}
                  </div>

                  {unreadCount > 0 && (
                    <button
                      onClick={marcarTodasComoLidas}
                      className="text-[11px] font-semibold text-theme-text hover:opacity-80 flex items-center gap-1 transition cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Marcar lidas</span>
                    </button>
                  )}
                </div>

                {/* Lista de Notificações - Apenas Novas (Inbox Zero) */}
                <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
                  {unreadAuditorias.length === 0 ? (
                    <div className="py-7 px-4 text-center text-slate-400 space-y-2">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-2xs">
                        <CheckCheck className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-black text-slate-800">Tudo limpo por aqui!</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-[240px] mx-auto">
                        Você não tem nenhuma notificação nova pendente.
                      </p>
                    </div>
                  ) : (
                    unreadAuditorias.map((a: any) => {
                      const meta = getNotificacaoMeta(a.tipoAcao);
                      const IconComp = meta.icon;
                      const textoFormatado = formatarTextoNotificacao(a.tipoAcao, a.detalhes);
                      const tempoRelativo = formatarTempoRelativo(a.createdAt);

                      return (
                        <div
                          key={a.id}
                          className="p-2.5 rounded-2xl border text-xs transition bg-white hover:bg-slate-50 border-slate-200/80 shadow-2xs"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border uppercase tracking-wider ${meta.bg}`}>
                              <IconComp className="w-2.5 h-2.5 flex-shrink-0" />
                              <span>{meta.label}</span>
                            </span>

                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              <span className="text-[10px] text-slate-400 font-medium">
                                {tempoRelativo}
                              </span>
                              <button
                                type="button"
                                onClick={() => marcarComoLida(a.id)}
                                className="w-5 h-5 rounded-md hover:bg-emerald-50 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition cursor-pointer"
                                title="Marcar como lida e dispensar"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          <p className="font-semibold text-slate-800 text-[11px] mt-1.5 leading-snug">
                            {textoFormatado}
                          </p>

                          {a.justificativa && (
                            <p className="text-[10px] text-slate-500 italic mt-1 line-clamp-2">
                              &ldquo;{a.justificativa}&rdquo;
                            </p>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-200/40">
                            <span>👤 {a.usuarioResponsavel?.name || "Sistema"}</span>
                            <button
                              type="button"
                              onClick={() => marcarComoLida(a.id)}
                              className="text-[10px] font-semibold text-theme-text hover:underline cursor-pointer"
                            >
                              Dispensar
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Rodapé: Link para Gestão / Auditoria */}
                {onChangeTab && canManageResolved && (
                  <div className="pt-2 mt-2 border-t border-slate-100">
                    {(userRole === "PRO_MASTER" || userRole === "SUPER_ADMIN") ? (
                      <button
                        onClick={() => {
                          setNotificacoesAberto(false);
                          onChangeTab("criador");
                          setTimeout(() => {
                            window.dispatchEvent(new CustomEvent("abrir-auditoria"));
                            const elem = document.getElementById("historico-auditoria");
                            if (elem) elem.scrollIntoView({ behavior: "smooth" });
                          }, 150);
                        }}
                        className="w-full p-2 rounded-xl text-xs font-bold text-theme-text hover:bg-slate-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>Ver Trilha de Auditoria (Governança)</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setNotificacoesAberto(false);
                          onChangeTab("criador");
                        }}
                        className="w-full p-2 rounded-xl text-xs font-bold text-theme-text hover:bg-slate-50 flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <span>Ir para Gestão do Grupo</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
