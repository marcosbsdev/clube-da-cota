"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  ShieldCheck,
  Users,
  CreditCard,
  History,
  Search,
  Filter,
  RefreshCw,
  Edit3,
  Key,
  Trash2,
  GitMerge,
  ArrowRight,
  Phone,
  Mail,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  X,
  ExternalLink,
  Copy,
  Check,
  Lock,
  Layers,
  Sparkles,
  UserCheck,
  Send,
  Building2,
} from "lucide-react";
import {
  getPainelAdminUsuariosAction,
  atualizarDadosUsuarioAdminAction,
  redefinirSenhaAdminAction,
  gerarLinkResetWhatsAppAdminAction,
  mesclarUsuariosAdminAction,
  transferirCotaAdminAction,
  excluirUsuarioAdminAction,
  updateUserRoleAction,
} from "@/app/actions";
import { GestaoAssinaturasAdmin } from "./GestaoAssinaturasAdmin";
import { formatarTelefone } from "@/lib/finance";
import { ToastModal, ToastData } from "@/components/ToastModal";

interface AdminViewProps {
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  onUsuarioAtualizado?: () => void;
}

type AdminTab = "usuarios" | "assinaturas" | "auditoria";

export function AdminView({ currentUser, onUsuarioAtualizado }: AdminViewProps) {
  const [activeTab, setActiveTab] = useState<AdminTab>("usuarios");
  const [carregando, setCarregando] = useState(true);
  const [processandoAcao, setProcessandoAcao] = useState<string | null>(null);

  // Notificação flutuante padronizada com auto-dismiss (ToastModal)
  const [toast, setToast] = useState<ToastData | null>(null);

  // Dados carregados do backend
  const [stats, setStats] = useState({
    totalUsuarios: 0,
    totalSuperAdmin: 0,
    totalPro: 0,
    totalComum: 0,
    totalAtivos: 0,
    totalSemSenha: 0,
    totalConsorcios: 0,
  });
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [ultimosLogs, setUltimosLogs] = useState<any[]>([]);

  // Filtros de busca
  const [termoBusca, setTermoBusca] = useState("");
  const [filtroRole, setFiltroRole] = useState("TODOS");
  const [termoBuscaRole, setTermoBuscaRole] = useState("");

  // Estado dos Modais
  const [modalEdicaoUsuario, setModalEdicaoUsuario] = useState<any | null>(null);
  const [modalSenhaUsuario, setModalSenhaUsuario] = useState<any | null>(null);
  const [modalMesclarAberto, setModalMesclarAberto] = useState(false);
  const [modalRaioXUsuario, setModalRaioXUsuario] = useState<any | null>(null);
  const [modalExclusaoUsuario, setModalExclusaoUsuario] = useState<any | null>(null);

  // Estados dos formulários internos dos modais
  const [formEdicao, setFormEdicao] = useState({
    name: "",
    email: "",
    telefone: "",
    chavePix: "",
    tipoChavePix: "CHAVE_ALEATORIA",
    role: "COMUM",
    planoExpiraEm: "",
  });

  const [formSenha, setFormSenha] = useState({
    modo: "ALEATORIA" as "ALEATORIA" | "MANUAL",
    novaSenha: "",
    senhaGerada: "",
    linkWhatsApp: "",
  });

  const [formMesclar, setFormMesclar] = useState({
    contaPrincipalId: "",
    contaDuplicadaId: "",
    motivo: "",
  });

  const [formTransferirCota, setFormTransferirCota] = useState({
    cotaParticipanteId: "",
    novoUsuarioId: "",
    motivo: "",
  });

  const [copiadoTexto, setCopiadoTexto] = useState<string | null>(null);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);

  const handleAlterarRole = async (targetUserId: string, newRole: any) => {
    setLoadingRole(targetUserId);
    try {
      const res = await updateUserRoleAction({
        adminUserId: currentUser.id,
        targetUserId,
        newRole,
      });
      if (res.success) {
        setToast({
          titulo: "Permissão Atualizada!",
          mensagem: res.message || "Nível de acesso do usuário atualizado com sucesso.",
          tipo: "success",
        });
        await carregarDados();
        if (onUsuarioAtualizado) onUsuarioAtualizado();
      } else {
        setToast({
          titulo: "Erro de Permissão",
          mensagem: res.error || "Erro ao atualizar nível de acesso.",
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Falha na comunicação.",
        tipo: "error",
      });
    } finally {
      setLoadingRole(null);
    }
  };

  const carregarDados = async () => {
    setCarregando(true);
    try {
      const res = await getPainelAdminUsuariosAction(currentUser.id, {
        termoBusca,
        filtroRole,
      });

      if (res.success) {
        setStats(res.stats || stats);
        setUsuarios(res.usuarios || []);
        setUltimosLogs(res.ultimosLogs || []);
      } else {
        setToast({
          titulo: "Erro ao Carregar Dados",
          mensagem: res.error || "Não foi possível carregar as informações do painel.",
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro de Comunicação",
        mensagem: err.message || "Falha na comunicação com o servidor.",
        tipo: "error",
      });
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [currentUser.id]);

  const copiarParaClipboard = (texto: string, rotulo: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoTexto(rotulo);
    setTimeout(() => setCopiadoTexto(null), 2500);
  };

  // ----------------------------------------------------
  // Handlers dos Modais
  // ----------------------------------------------------
  const abrirEdicao = (u: any) => {
    setModalEdicaoUsuario(u);
    setFormEdicao({
      name: u.name,
      email: u.email,
      telefone: u.telefone || "",
      chavePix: u.chavePix || "",
      tipoChavePix: u.tipoChavePix || "CHAVE_ALEATORIA",
      role: u.role,
      planoExpiraEm: u.planoExpiraEm ? new Date(u.planoExpiraEm).toISOString().split("T")[0] : "",
    });
  };

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalEdicaoUsuario) return;
    setProcessandoAcao("salvarEdicao");
    try {
      const res = await atualizarDadosUsuarioAdminAction({
        adminId: currentUser.id,
        targetUserId: modalEdicaoUsuario.id,
        name: formEdicao.name,
        email: formEdicao.email,
        telefone: formEdicao.telefone,
        chavePix: formEdicao.chavePix,
        tipoChavePix: formEdicao.tipoChavePix,
        role: formEdicao.role,
        planoExpiraEm: formEdicao.planoExpiraEm ? new Date(formEdicao.planoExpiraEm).toISOString() : null,
      });

      if (res.success) {
        const msg = res.message || `Cadastro de ${formEdicao.name} atualizado com sucesso!`;
        setToast({
          titulo: "Cadastro Atualizado com Sucesso!",
          mensagem: msg,
          tipo: "success",
        });
        setModalEdicaoUsuario(null);
        await carregarDados();
        if (onUsuarioAtualizado) onUsuarioAtualizado();
      } else {
        const erroMsg = res.error || "Erro ao atualizar dados.";
        setToast({
          titulo: "Erro ao Atualizar Cadastro",
          mensagem: erroMsg,
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Erro inesperado.",
        tipo: "error",
      });
    } finally {
      setProcessandoAcao(null);
    }
  };

  const abrirGestaoSenha = (u: any) => {
    setModalSenhaUsuario(u);
    setFormSenha({
      modo: "ALEATORIA",
      novaSenha: "",
      senhaGerada: "",
      linkWhatsApp: "",
    });
  };

  const executarRedefinicaoSenha = async () => {
    if (!modalSenhaUsuario) return;
    setProcessandoAcao("redefinirSenha");
    try {
      const res = await redefinirSenhaAdminAction({
        adminId: currentUser.id,
        targetUserId: modalSenhaUsuario.id,
        modo: formSenha.modo,
        novaSenha: formSenha.novaSenha,
      });

      if (res.success) {
        const senhaDefinida = res.senhaGerada || formSenha.novaSenha;
        setFormSenha((prev) => ({
          ...prev,
          senhaGerada: senhaDefinida,
        }));
        const msg = res.message || `Senha de ${modalSenhaUsuario.name} redefinida com sucesso!`;
        setToast({
          titulo: "Senha Redefinida com Sucesso!",
          mensagem: msg,
          tipo: "success",
        });

        // Se o usuário tiver telefone, já prepara o link do WhatsApp
        if (modalSenhaUsuario.telefone) {
          const resZap = await gerarLinkResetWhatsAppAdminAction({
            adminId: currentUser.id,
            targetUserId: modalSenhaUsuario.id,
            senhaProvisoria: senhaDefinida,
          });
          if (resZap.success && resZap.linkWhatsApp) {
            setFormSenha((prev) => ({ ...prev, linkWhatsApp: resZap.linkWhatsApp! }));
          }
        }

        await carregarDados();
      } else {
        const erroMsg = res.error || "Erro ao redefinir senha.";
        setToast({
          titulo: "Erro ao Redefinir Senha",
          mensagem: erroMsg,
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Falha na comunicação.",
        tipo: "error",
      });
    } finally {
      setProcessandoAcao(null);
    }
  };

  const executarMesclagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formMesclar.contaPrincipalId || !formMesclar.contaDuplicadaId) {
      const msg = "Selecione a conta principal (destino) e a conta duplicada.";
      setToast({
        titulo: "Atenção",
        mensagem: msg,
        tipo: "warning",
      });
      return;
    }
    setProcessandoAcao("mesclarContas");
    try {
      const res = await mesclarUsuariosAdminAction({
        adminId: currentUser.id,
        contaPrincipalId: formMesclar.contaPrincipalId,
        contaDuplicadaId: formMesclar.contaDuplicadaId,
        motivo: formMesclar.motivo,
      });

      if (res.success) {
        const msg = res.message || "Contas unificadas com sucesso!";
        setToast({
          titulo: "Contas Unificadas com Sucesso!",
          mensagem: msg,
          tipo: "success",
        });
        setModalMesclarAberto(false);
        setFormMesclar({ contaPrincipalId: "", contaDuplicadaId: "", motivo: "" });
        await carregarDados();
        if (onUsuarioAtualizado) onUsuarioAtualizado();
      } else {
        const erroMsg = res.error || "Erro ao mesclar contas.";
        setToast({
          titulo: "Erro na Mesclagem",
          mensagem: erroMsg,
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Falha na comunicação.",
        tipo: "error",
      });
    } finally {
      setProcessandoAcao(null);
    }
  };

  const executarTransferenciaCota = async (cotaPartId: string) => {
    if (!formTransferirCota.novoUsuarioId) {
      const msg = "Selecione o novo usuário participante para receber esta cota.";
      setToast({
        titulo: "Atenção",
        mensagem: msg,
        tipo: "warning",
      });
      return;
    }
    setProcessandoAcao(`transferir_${cotaPartId}`);
    try {
      const res = await transferirCotaAdminAction({
        adminId: currentUser.id,
        cotaParticipanteId: cotaPartId,
        novoUsuarioId: formTransferirCota.novoUsuarioId,
        motivo: formTransferirCota.motivo,
      });

      if (res.success) {
        const msg = res.message || "Cota transferida com sucesso!";
        setToast({
          titulo: "Cota Transferida com Sucesso!",
          mensagem: msg,
          tipo: "success",
        });
        setFormTransferirCota({ cotaParticipanteId: "", novoUsuarioId: "", motivo: "" });
        setModalRaioXUsuario(null);
        await carregarDados();
        if (onUsuarioAtualizado) onUsuarioAtualizado();
      } else {
        const erroMsg = res.error || "Erro ao transferir cota.";
        setToast({
          titulo: "Erro na Transferência",
          mensagem: erroMsg,
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Falha na comunicação.",
        tipo: "error",
      });
    } finally {
      setProcessandoAcao(null);
    }
  };

  const confirmarExclusaoUsuario = async () => {
    if (!modalExclusaoUsuario) return;
    setProcessandoAcao("excluirUsuario");
    try {
      const res = await excluirUsuarioAdminAction({
        adminId: currentUser.id,
        targetUserId: modalExclusaoUsuario.id,
      });

      if (res.success) {
        const msg = res.message || "Conta excluída com sucesso!";
        setToast({
          titulo: "Conta Excluída com Sucesso!",
          mensagem: msg,
          tipo: "success",
        });
        setModalExclusaoUsuario(null);
        await carregarDados();
        if (onUsuarioAtualizado) onUsuarioAtualizado();
      } else {
        const erroMsg = res.error || "Erro ao excluir conta.";
        setToast({
          titulo: "Erro ao Excluir Conta",
          mensagem: erroMsg,
          tipo: "error",
        });
      }
    } catch (err: any) {
      setToast({
        titulo: "Erro Inesperado",
        mensagem: err.message || "Falha na comunicação.",
        tipo: "error",
      });
    } finally {
      setProcessandoAcao(null);
    }
  };

  // Usuários filtrados para a listagem (Participantes Cadastrados)
  const usuariosFiltrados = useMemo(() => {
    return usuarios.filter((u) => {
      if (filtroRole !== "TODOS" && u.role !== filtroRole) return false;
      if (!termoBusca.trim()) return true;
      const t = termoBusca.toLowerCase().trim();
      const tDigits = t.replace(/\D/g, "");
      const telClean = (u.telefone || "").replace(/\D/g, "");
      const pixClean = (u.chavePix || "").replace(/\D/g, "");

      return (
        u.name.toLowerCase().includes(t) ||
        u.email.toLowerCase().includes(t) ||
        (u.telefone || "").toLowerCase().includes(t) ||
        (tDigits.length >= 3 && telClean.includes(tDigits)) ||
        (u.chavePix || "").toLowerCase().includes(t) ||
        (tDigits.length >= 3 && pixClean.includes(tDigits))
      );
    });
  }, [usuarios, filtroRole, termoBusca]);

  // Usuários filtrados para a Gestão Rápida de Níveis de Acesso
  const usuariosFiltradosRole = useMemo(() => {
    if (!termoBuscaRole.trim()) return usuarios;
    const t = termoBuscaRole.toLowerCase().trim();
    const tDigits = t.replace(/\D/g, "");
    return usuarios.filter((u) => {
      const nomeMatch = u.name.toLowerCase().includes(t);
      const emailMatch = u.email.toLowerCase().includes(t);
      const tel = (u.telefone || "").toLowerCase();
      const telDigits = tel.replace(/\D/g, "");
      const telMatch = tel.includes(t) || (tDigits.length >= 3 && telDigits.includes(tDigits));
      const roleMatch = u.role.toLowerCase().includes(t);
      return nomeMatch || emailMatch || telMatch || roleMatch;
    });
  }, [usuarios, termoBuscaRole]);

  // Outros usuários para dropdowns (excluindo o usuário do modal)
  const outrosUsuariosParaMerge = useMemo(() => {
    return usuarios.filter((u) => u.id !== formMesclar.contaDuplicadaId);
  }, [usuarios, formMesclar.contaDuplicadaId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200 relative">
      {/* Toast Modal Flutuante com auto-dismiss no topo da tela */}
      <ToastModal toast={toast} onClose={() => setToast(null)} />

      {/* ====================================================================== */}
      {/* CABEÇALHO DO PAINEL SUPER ADMIN                                        */}
      {/* ====================================================================== */}
      <div className="bg-white rounded-3xl p-5 sm:p-7 shadow-sm border border-slate-200/90 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-theme-light/60 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-theme-light border border-theme-main/20 text-theme-text text-xs font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 text-theme-text" />
              <span>Painel de Governança Master</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 flex items-center gap-2.5 flex-wrap">
              <span>Super Admin</span>
              <span className="text-slate-300 font-light">|</span>
              <span className="text-theme-text font-bold">Gestão de Contas</span>
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Central administrativa para correção de erros de cadastro, suporte a senhas para usuários leigos,
              unificação de contas duplicadas e auditoria de cotas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={carregarDados}
              disabled={carregando}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200/90 text-slate-700 font-bold text-xs transition border border-slate-200/80 shadow-xs cursor-pointer disabled:opacity-50"
              title="Recarregar dados do painel"
            >
              <RefreshCw className={`w-4 h-4 ${carregando ? "animate-spin" : ""}`} />
              <span>Atualizar</span>
            </button>

            <button
              onClick={() => {
                setModalMesclarAberto(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-theme-main hover:opacity-90 text-white font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <GitMerge className="w-4 h-4" />
              <span>Mesclar Contas Duplicadas</span>
            </button>
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS DO SUPER ADMIN (ESTILO PILLS EM HARMONIA COM O SISTEMA) */}
        <div className="bg-slate-100/90 p-1.5 rounded-2xl flex items-center gap-1.5 overflow-x-auto border border-slate-200/70 scrollbar-none">
          <button
            onClick={() => setActiveTab("usuarios")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "usuarios"
                ? "bg-white text-theme-text shadow-xs border border-slate-200/60 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Usuários & Contas</span>
            <span className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "usuarios" ? "bg-theme-light text-theme-text" : "bg-slate-200 text-slate-600"
            }`}>
              {stats.totalUsuarios}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("assinaturas")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "assinaturas"
                ? "bg-white text-theme-text shadow-xs border border-slate-200/60 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Assinaturas & Planos SaaS</span>
            <span className="ml-1 px-2 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              PRO / Master
            </span>
          </button>

          <button
            onClick={() => setActiveTab("auditoria")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === "auditoria"
                ? "bg-white text-theme-text shadow-xs border border-slate-200/60 font-black"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trilha de Auditoria</span>
            <span className={`ml-1 px-2 py-0.2 rounded-full text-[10px] font-bold ${
              activeTab === "auditoria" ? "bg-theme-light text-theme-text" : "bg-slate-200 text-slate-600"
            }`}>
              {ultimosLogs.length}
            </span>
          </button>
        </div>
      </div>

      {/* ====================================================================== */}
      {/* ABA 1: USUÁRIOS & GESTÃO DE CONTAS                                      */}
      {/* ====================================================================== */}
      {activeTab === "usuarios" && (
        <div className="space-y-6">
          {/* CARDS DE MÉTRICAS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Total Contas
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-800 mt-1">
                {stats.totalUsuarios}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">
                Super Admins
              </span>
              <p className="text-xl sm:text-2xl font-black text-purple-700 mt-1">
                {stats.totalSuperAdmin}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
                Planos PRO / SaaS
              </span>
              <p className="text-xl sm:text-2xl font-black text-amber-700 mt-1">
                {stats.totalPro}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Plano Comum
              </span>
              <p className="text-xl sm:text-2xl font-black text-slate-700 mt-1">
                {stats.totalComum}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">
                Contas Ativas
              </span>
              <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">
                {stats.totalAtivos}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                Sem Senha / Prov.
              </span>
              <p className="text-xl sm:text-2xl font-black text-rose-600 mt-1">
                {stats.totalSemSenha}
              </p>
            </div>
          </div>

          {/* LISTA / TABELA DE USUÁRIOS (PARTICIPANTES CADASTRADOS) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-theme-text" />
                  <span>Participantes Cadastrados</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Exibindo <span className="font-bold text-slate-700">{usuariosFiltrados.length}</span> de {stats.totalUsuarios} contas cadastradas
                </p>
              </div>

              {/* Busca por Nome, E-mail e Telefone + Filtro de Role */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, e-mail ou telefone..."
                    value={termoBusca}
                    onChange={(e) => setTermoBusca(e.target.value)}
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-theme-main shadow-2xs"
                  />
                  {termoBusca && (
                    <button
                      onClick={() => setTermoBusca("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
                  {(["TODOS", "COMUM", "PRO", "PRO_MASTER", "SUPER_ADMIN"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setFiltroRole(r)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold transition whitespace-nowrap cursor-pointer ${
                        filtroRole === r
                          ? "bg-slate-900 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      {r === "TODOS" ? "Todos" : r.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {usuariosFiltrados.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Users className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-sm font-medium">Nenhum usuário encontrado com os filtros atuais.</p>
                {(termoBusca || filtroRole !== "TODOS") && (
                  <button
                    onClick={() => {
                      setTermoBusca("");
                      setFiltroRole("TODOS");
                    }}
                    className="text-xs font-bold text-theme-text hover:underline cursor-pointer"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 z-10 shadow-2xs">
                    <tr className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4 bg-slate-50">Usuário</th>
                      <th className="py-3 px-4 bg-slate-50">Contato & Pix</th>
                      <th className="py-3 px-4 bg-slate-50">Nível / Role</th>
                      <th className="py-3 px-4 bg-slate-50">Vínculos</th>
                      <th className="py-3 px-4 bg-slate-50 text-right">Ações de Suporte</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuariosFiltrados.map((u) => {
                      const isMe = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition">
                          {/* Coluna 1: Nome e E-mail */}
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                                {u.name ? u.name.slice(0, 2).toUpperCase() : "??"}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-slate-900 truncate">
                                    {u.name}
                                  </span>
                                  {isMe && (
                                    <span className="text-[9px] bg-theme-light text-theme-text font-bold px-1.5 py-0.2 rounded-md">
                                      Você
                                    </span>
                                  )}
                                </div>
                                <span className="text-slate-400 block truncate text-[11px]">
                                  {u.email}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {u.isActivated && u.hasPassword ? (
                                    <span className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                                      <CheckCircle2 className="w-3 h-3" /> Ativado
                                    </span>
                                  ) : (
                                    <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5">
                                      <AlertTriangle className="w-3 h-3" /> Senha Pendente
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Coluna 2: Contato & Pix */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              {u.telefone ? (
                                <a
                                  href={`https://wa.me/55${u.telefone.replace(/\D/g, "")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                                >
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span>{formatarTelefone(u.telefone)}</span>
                                </a>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Sem telefone
                                </span>
                              )}

                              {u.chavePix ? (
                                <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                  <QrCode className="w-3 h-3 text-slate-400" />
                                  <span className="font-mono truncate max-w-[130px]" title={u.chavePix}>
                                    {u.chavePix}
                                  </span>
                                  <button
                                    onClick={() => copiarParaClipboard(u.chavePix, `pix_${u.id}`)}
                                    className="p-0.5 text-slate-400 hover:text-slate-600"
                                    title="Copiar Pix"
                                  >
                                    {copiadoTexto === `pix_${u.id}` ? (
                                      <Check className="w-3 h-3 text-emerald-500" />
                                    ) : (
                                      <Copy className="w-3 h-3" />
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[11px] text-slate-400 italic">
                                  Sem Pix
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 3: Role / Plano */}
                          <td className="py-3 px-4">
                            <div className="space-y-1">
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                  u.role === "SUPER_ADMIN"
                                    ? "bg-purple-100 text-purple-800"
                                    : u.role === "PRO_MASTER"
                                    ? "bg-amber-100 text-amber-800"
                                    : u.role === "PRO"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-slate-100 text-slate-700"
                                }`}
                              >
                                {u.role}
                              </span>

                              {u.planoExpiraEm && (
                                <span className="text-[10px] text-slate-400 block">
                                  Expira: {new Date(u.planoExpiraEm).toLocaleDateString("pt-BR")}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Coluna 4: Vínculos */}
                          <td className="py-3 px-4">
                            <div className="space-y-0.5 text-[11px] text-slate-600">
                              <div>
                                <span className="font-bold text-slate-800">
                                  {u.consorciosCriados.length}
                                </span>{" "}
                                consórcio(s) criado(s)
                              </div>
                              <div>
                                <span className="font-bold text-slate-800">
                                  {u.participacoes.length}
                                </span>{" "}
                                cota(s) vinculada(s)
                              </div>
                              <button
                                onClick={() => setModalRaioXUsuario(u)}
                                className="text-theme-text hover:underline font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                              >
                                <span>Ver detalhes & Cotas</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>

                          {/* Coluna 5: Ações de Suporte */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => abrirEdicao(u)}
                                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                                title="Editar dados cadastrais (Nome, E-mail, Pix, Role)"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => abrirGestaoSenha(u)}
                                className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                                title="Gerenciar Senha (Provisória / Manual / WhatsApp)"
                              >
                                <Key className="w-3.5 h-3.5" />
                              </button>

                              {!isMe && (
                                <button
                                  onClick={() => setModalExclusaoUsuario(u)}
                                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                                  title="Excluir conta (apenas se vazia/duplicada)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* GESTÃO DE NÍVEIS DE ACESSO (SUPER ADMIN) */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-theme-light text-theme-text flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    Gestão Rápida de Níveis de Acesso
                  </h4>
                  <p className="text-xs text-slate-500">
                    Ajuste instantaneamente as permissões e planos de acesso dos usuários do Clube da Cota:
                  </p>
                </div>
              </div>

              {/* Busca por Nome, Email e Telefone */}
              <div className="relative w-full sm:w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar por nome, e-mail ou telefone..."
                  value={termoBuscaRole}
                  onChange={(e) => setTermoBuscaRole(e.target.value)}
                  className="w-full pl-8 pr-7 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-theme-main shadow-2xs"
                />
                {termoBuscaRole && (
                  <button
                    onClick={() => setTermoBuscaRole("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="text-xs text-slate-400 flex items-center justify-between pt-1">
              <span>
                Exibindo <span className="font-bold text-slate-700">{usuariosFiltradosRole.length}</span> de {usuarios.length} usuários
              </span>
              {termoBuscaRole && (
                <span className="text-theme-text font-semibold">
                  Filtro: "{termoBuscaRole}"
                </span>
              )}
            </div>

            <div className="space-y-2.5 pt-1 max-h-[380px] overflow-y-auto pr-1">
              {usuariosFiltradosRole.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-7 h-7 mx-auto text-slate-300" />
                  <p className="text-xs font-semibold text-slate-500">
                    Nenhum usuário encontrado para "{termoBuscaRole}".
                  </p>
                  <button
                    onClick={() => setTermoBuscaRole("")}
                    className="text-xs text-theme-text font-bold hover:underline cursor-pointer"
                  >
                    Limpar busca
                  </button>
                </div>
              ) : (
                usuariosFiltradosRole.map((u) => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <div
                      key={u.id}
                      className="p-3.5 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 text-sm">{u.name}</span>
                          {isSelf && (
                            <span className="text-[10px] font-bold bg-theme-light text-theme-text px-1.5 py-0.2 rounded-md">
                              Você
                            </span>
                          )}
                          <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${
                            u.role === "SUPER_ADMIN"
                              ? "bg-purple-100 text-purple-800 border-purple-200"
                              : u.role === "PRO_MASTER"
                              ? "bg-amber-100 text-amber-800 border-amber-200"
                              : u.role === "PRO"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}>
                            {u.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 flex-wrap">
                          <span className="truncate">{u.email}</span>
                          {u.telefone && (
                            <span className="flex items-center gap-1 text-slate-500 font-mono text-[11px]">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {u.telefone}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <label className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Alterar Papel:</label>
                        <select
                          value={u.role}
                          disabled={loadingRole === u.id}
                          onChange={(e) => handleAlterarRole(u.id, e.target.value)}
                          className="text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white hover:border-theme-main focus:outline-none focus:border-theme-main cursor-pointer shadow-xs"
                        >
                          <option value="COMUM">Comum (1 consórcio, até 10 membros)</option>
                          <option value="PRO">Pro (até 3 consórcios, até 20 membros)</option>
                          <option value="PRO_MASTER">Pro-Master (Multiconsórcios avançados)</option>
                          <option value="SUPER_ADMIN">Super Admin (Acesso total)</option>
                        </select>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* ABA 2: ASSINATURAS & PLANOS SAAS                                       */}
      {/* ====================================================================== */}
      {activeTab === "assinaturas" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <GestaoAssinaturasAdmin
            currentUser={currentUser}
            onAssinaturaAlterada={() => {
              carregarDados();
              if (onUsuarioAtualizado) onUsuarioAtualizado();
            }}
          />
        </div>
      )}

      {/* ====================================================================== */}
      {/* ABA 3: TRILHA DE AUDITORIA                                             */}
      {/* ====================================================================== */}
      {activeTab === "auditoria" && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Histórico Geral de Governança
              </h2>
              <p className="text-xs text-slate-400">
                Últimas 30 ações registradas com data, responsável e detalhes completos.
              </p>
            </div>
          </div>

          {ultimosLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-xs">Nenhum registro de auditoria encontrado.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {ultimosLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
                        {log.tipoAcao}
                      </span>
                      {log.consorcioNome && (
                        <span className="text-slate-500 text-[11px] font-medium">
                          Grupo: {log.consorcioNome}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const detalhes = log.detalhes;
                      if (!detalhes) return null;

                      if (detalhes.includes("➔")) {
                        const regex = /([^:,]+):\s*"([^"]*)"\s*➔\s*"([^"]*)"/g;
                        const itens: { campo: string; de: string; para: string }[] = [];
                        let match;
                        while ((match = regex.exec(detalhes)) !== null) {
                          itens.push({ campo: match[1].trim(), de: match[2].trim(), para: match[3].trim() });
                        }

                        if (itens.length > 0) {
                          const matchTitulo = detalhes.match(/^([^:]+):/);
                          const titulo = matchTitulo ? matchTitulo[1] : "Alterações realizadas";

                          return (
                            <div className="space-y-1.5 mt-1">
                              <p className="font-bold text-slate-800 text-xs">{titulo}:</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200/70">
                                {itens.map((it, i) => (
                                  <div key={i} className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                                    <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wide">
                                      {it.campo}
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono text-[10px]">
                                      <span className="line-through text-slate-400 truncate max-w-[120px]" title={it.de}>
                                        {it.de || "(vazio)"}
                                      </span>
                                      <span className="text-slate-400">➔</span>
                                      <span className="text-emerald-700 font-bold truncate max-w-[120px]" title={it.para}>
                                        {it.para}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      }

                      return <p className="text-slate-700 font-medium">{detalhes}</p>;
                    })()}
                    {log.justificativa && (
                      <p className="text-[11px] text-slate-500 italic">
                        Motivo: {log.justificativa}
                      </p>
                    )}
                  </div>

                  <div className="text-right text-[11px] text-slate-400 flex-shrink-0">
                    <div>Por: <span className="font-bold text-slate-600">{log.responsavelNome}</span></div>
                    <div>{new Date(log.createdAt).toLocaleString("pt-BR")}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 1: EDIÇÃO DE DADOS CADASTRAIS                                    */}
      {/* ====================================================================== */}
      {modalEdicaoUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-theme-main" />
                <h3 className="text-base font-bold text-slate-900">
                  Editar Cadastro do Usuário
                </h3>
              </div>
              <button
                onClick={() => setModalEdicaoUsuario(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={salvarEdicao} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={formEdicao.name}
                  onChange={(e) => setFormEdicao({ ...formEdicao, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail de Acesso (Login)
                </label>
                <input
                  type="email"
                  required
                  value={formEdicao.email}
                  onChange={(e) => setFormEdicao({ ...formEdicao, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="(11) 99999-9999"
                  value={formEdicao.telefone}
                  onChange={(e) => setFormEdicao({ ...formEdicao, telefone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tipo de Chave Pix
                  </label>
                  <select
                    value={formEdicao.tipoChavePix}
                    onChange={(e) => setFormEdicao({ ...formEdicao, tipoChavePix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                  >
                    <option value="CPF_CNPJ">CPF / CNPJ</option>
                    <option value="CELULAR">Celular</option>
                    <option value="EMAIL">E-mail</option>
                    <option value="CHAVE_ALEATORIA">Chave Aleatória</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Chave Pix
                  </label>
                  <input
                    type="text"
                    value={formEdicao.chavePix}
                    onChange={(e) => setFormEdicao({ ...formEdicao, chavePix: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nível de Acesso (Role)
                  </label>
                  <select
                    value={formEdicao.role}
                    onChange={(e) => setFormEdicao({ ...formEdicao, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                  >
                    <option value="COMUM">COMUM (Cotista)</option>
                    <option value="PRO">PRO (Organizador 3 grupos)</option>
                    <option value="PRO_MASTER">PRO MASTER (Ilimitado)</option>
                    <option value="SUPER_ADMIN">SUPER ADMIN (Governança)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Validade do Plano SaaS
                  </label>
                  <input
                    type="date"
                    value={formEdicao.planoExpiraEm}
                    onChange={(e) => setFormEdicao({ ...formEdicao, planoExpiraEm: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-theme-main/30"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalEdicaoUsuario(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoAcao === "salvarEdicao"}
                  className="px-4 py-2 rounded-xl bg-theme-main hover:bg-theme-main/90 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {processandoAcao === "salvarEdicao" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <span>Salvar Alterações</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 2: GESTÃO E REDEFINIÇÃO DE SENHA                                 */}
      {/* ====================================================================== */}
      {modalSenhaUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">
                  Gerenciamento de Senha
                </h3>
              </div>
              <button
                onClick={() => setModalSenhaUsuario(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-900 block">{modalSenhaUsuario.name}</span>
                <span className="text-slate-500 text-[11px] block">{modalSenhaUsuario.email}</span>
                {modalSenhaUsuario.telefone && (
                  <span className="text-emerald-700 text-[11px] font-semibold block mt-0.5">
                    WhatsApp: {formatarTelefone(modalSenhaUsuario.telefone)}
                  </span>
                )}
              </div>

              {!formSenha.senhaGerada ? (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-700">
                      Como deseja definir a nova senha?
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormSenha({ ...formSenha, modo: "ALEATORIA" })}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${
                          formSenha.modo === "ALEATORIA"
                            ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-amber-500 mb-1" />
                        <div>Senha Amigável</div>
                        <div className="text-[10px] font-normal text-slate-500">Ex: Cota#4829</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormSenha({ ...formSenha, modo: "MANUAL" })}
                        className={`p-2.5 rounded-xl text-xs font-bold border transition text-left cursor-pointer ${
                          formSenha.modo === "MANUAL"
                            ? "bg-amber-50 border-amber-300 text-amber-900 shadow-xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <Lock className="w-4 h-4 text-amber-500 mb-1" />
                        <div>Digitar Senha</div>
                        <div className="text-[10px] font-normal text-slate-500">Manual</div>
                      </button>
                    </div>
                  </div>

                  {formSenha.modo === "MANUAL" && (
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Nova Senha (mínimo 6 caracteres)
                      </label>
                      <input
                        type="text"
                        placeholder="Digite a nova senha..."
                        value={formSenha.novaSenha}
                        onChange={(e) => setFormSenha({ ...formSenha, novaSenha: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-300"
                      />
                    </div>
                  )}

                  <button
                    onClick={executarRedefinicaoSenha}
                    disabled={processandoAcao === "redefinirSenha"}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processandoAcao === "redefinirSenha" ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Gerando Nova Senha...</span>
                      </>
                    ) : (
                      <>
                        <Key className="w-4 h-4" />
                        <span>Aplicar Nova Senha</span>
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="space-y-4 animate-in fade-in">
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-2">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">
                      Nova Senha Gerada com Sucesso!
                    </span>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-xl font-black font-mono text-emerald-950 bg-white px-3 py-1 rounded-xl border border-emerald-200 shadow-2xs">
                        {formSenha.senhaGerada}
                      </span>
                      <button
                        onClick={() => copiarParaClipboard(formSenha.senhaGerada, "senha_gerada")}
                        className="p-2 rounded-xl bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        title="Copiar Senha"
                      >
                        {copiadoTexto === "senha_gerada" ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      A conta foi ativada. O usuário já pode efetuar login com este e-mail e nova senha.
                    </p>
                  </div>

                  {formSenha.linkWhatsApp && (
                    <a
                      href={formSenha.linkWhatsApp}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Enviar no WhatsApp do Participante</span>
                    </a>
                  )}

                  <button
                    onClick={() => setModalSenhaUsuario(null)}
                    className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    Concluído / Fechar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 3: MESCLAR CONTAS DUPLICADAS (SMART MERGE)                       */}
      {/* ====================================================================== */}
      {modalMesclarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <GitMerge className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Mesclagem de Contas Duplicadas
                </h3>
              </div>
              <button
                onClick={() => setModalMesclarAberto(false)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={executarMesclagem} className="space-y-4 mt-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Atenção: Ação Atômica e Irreversível
                </span>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Todos os consórcios criados, cotas, parcelas pagas e comprovantes da{" "}
                  <strong>Conta Duplicada</strong> serão transferidos para a{" "}
                  <strong>Conta Principal (Oficial)</strong>. A conta duplicada será excluída após a migração.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Conta Oficial / Principal (Destino - Permanecerá Ativa)
                </label>
                <select
                  required
                  value={formMesclar.contaPrincipalId}
                  onChange={(e) => setFormMesclar({ ...formMesclar, contaPrincipalId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">Selecione o cadastro correto e oficial...</option>
                  {usuarios.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.email} ({u.role}) [{u.participacoes.length} cota(s)]
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Conta Duplicada / Provisória (Origem - Será Excluída após absorção)
                </label>
                <select
                  required
                  value={formMesclar.contaDuplicadaId}
                  onChange={(e) => setFormMesclar({ ...formMesclar, contaDuplicadaId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="">Selecione a conta duplicada que será absorvida...</option>
                  {outrosUsuariosParaMerge
                    .filter((u) => u.id !== currentUser.id && u.id !== formMesclar.contaPrincipalId)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({u.role}) [{u.participacoes.length} cota(s)]
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motivo da Unificação (para Trilha de Auditoria)
                </label>
                <input
                  type="text"
                  placeholder="Ex: Usuário cadastrado duas vezes com e-mails diferentes"
                  value={formMesclar.motivo}
                  onChange={(e) => setFormMesclar({ ...formMesclar, motivo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalMesclarAberto(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={processandoAcao === "mesclarContas"}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {processandoAcao === "mesclarContas" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Unificando...</span>
                    </>
                  ) : (
                    <>
                      <GitMerge className="w-3.5 h-3.5" />
                      <span>Confirmar e Mesclar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 4: RAIO-X DO USUÁRIO & TRANSFERÊNCIA DE COTAS                    */}
      {/* ====================================================================== */}
      {modalRaioXUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-theme-main" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Raio-X: {modalRaioXUsuario.name}
                  </h3>
                  <span className="text-xs text-slate-400">{modalRaioXUsuario.email}</span>
                </div>
              </div>
              <button
                onClick={() => setModalRaioXUsuario(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 mt-4">
              {/* Cotas Vinculadas */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Cotas Vinculadas ({modalRaioXUsuario.participacoes.length})
                </h4>

                {modalRaioXUsuario.participacoes.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
                    Nenhuma cota vinculada a este usuário.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modalRaioXUsuario.participacoes.map((p: any) => (
                      <div
                        key={p.id}
                        className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-black px-2 py-0.5 rounded-lg bg-theme-main text-white text-[10px]">
                              Cota #{p.numeroCota}
                            </span>
                            <span className="font-bold text-slate-900">{p.consorcioNome}</span>
                            <span className="text-[10px] text-slate-400">({p.consorcioStatus})</span>
                          </div>
                          <div className="text-slate-500 text-[11px] mt-1">
                            Participação: {p.percentual}% | Parcela: R$ {p.valorParcela.toFixed(2)}
                            {p.ordemSorteio ? ` | Sorteado: ${p.ordemSorteio}º` : ""}
                          </div>
                        </div>

                        {/* Ação de Transferir Cota */}
                        <div className="flex-shrink-0">
                          {formTransferirCota.cotaParticipanteId === p.id ? (
                            <div className="p-3 bg-white rounded-xl border border-theme-main/40 space-y-2 w-full sm:w-64">
                              <span className="text-[10px] font-bold text-slate-700 block">
                                Novo Participante Titular:
                              </span>
                              <select
                                value={formTransferirCota.novoUsuarioId}
                                onChange={(e) =>
                                  setFormTransferirCota({
                                    ...formTransferirCota,
                                    novoUsuarioId: e.target.value,
                                  })
                                }
                                className="w-full p-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                              >
                                <option value="">Selecione o destinatário...</option>
                                {usuarios
                                  .filter((u) => u.id !== modalRaioXUsuario.id)
                                  .map((u) => (
                                    <option key={u.id} value={u.id}>
                                      {u.name} ({u.email})
                                    </option>
                                  ))}
                              </select>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => executarTransferenciaCota(p.id)}
                                  disabled={processandoAcao === `transferir_${p.id}`}
                                  className="flex-1 py-1 px-2 rounded-lg bg-theme-main text-white text-[11px] font-bold cursor-pointer"
                                >
                                  Confirmar
                                </button>
                                <button
                                  onClick={() =>
                                    setFormTransferirCota({
                                      cotaParticipanteId: "",
                                      novoUsuarioId: "",
                                      motivo: "",
                                    })
                                  }
                                  className="py-1 px-2 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold cursor-pointer"
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() =>
                                setFormTransferirCota({
                                  cotaParticipanteId: p.id,
                                  novoUsuarioId: "",
                                  motivo: "",
                                })
                              }
                              className="px-3 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-[11px] font-bold cursor-pointer transition flex items-center gap-1"
                            >
                              <span>Transferir Cota</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consórcios Criados */}
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Consórcios Criados ({modalRaioXUsuario.consorciosCriados.length})
                </h4>

                {modalRaioXUsuario.consorciosCriados.length === 0 ? (
                  <div className="p-4 rounded-2xl bg-slate-50 text-slate-400 text-center text-xs">
                    Nenhum consórcio criado por este usuário.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {modalRaioXUsuario.consorciosCriados.map((c: any) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900">{c.nome}</span>
                          <span className="text-[11px] text-slate-400 block">
                            Status: {c.status} | {c.totalCotas} cotas | R$ {c.valorCota.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.createdAt).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 mt-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setModalRaioXUsuario(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ====================================================================== */}
      {/* MODAL 5: EXCLUSÃO SEGURA DE USUÁRIO                                    */}
      {/* ====================================================================== */}
      {modalExclusaoUsuario && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Excluir Conta de Usuário
                </h3>
              </div>
              <button
                onClick={() => setModalExclusaoUsuario(null)}
                className="p-1 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 mt-4">
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                <span className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  Confirmação de Exclusão
                </span>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Tem certeza de que deseja excluir permanentemente o cadastro de{" "}
                  <strong>{modalExclusaoUsuario.name}</strong> ({modalExclusaoUsuario.email})?
                </p>
                <p className="text-[11px] text-rose-700 font-semibold pt-1">
                  * Contas com pagamentos confirmados ou consórcios ativos não podem ser excluídas fisicamente.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalExclusaoUsuario(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmarExclusaoUsuario}
                  disabled={processandoAcao === "excluirUsuario"}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  {processandoAcao === "excluirUsuario" ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sim, Excluir Conta</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
