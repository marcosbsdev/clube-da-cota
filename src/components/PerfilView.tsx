"use client";

import React, { useState, useEffect } from "react";
import { useTheme, ThemeName } from "./ThemeProvider";
import {
  updateUserThemeAction,
  updateUserRoleAction,
  updateUserProfileDadosAction,
} from "@/app/actions";
import { TipoChavePix, TIPOS_CHAVE_PIX, getTipoChavePixLabel, formatarTelefone } from "@/lib/finance";
import { getVigenciaPlano } from "@/lib/plans";
import { ToastModal, ToastData } from "@/components/ToastModal";
import { ModalUpgradePlanos } from "./ModalUpgradePlanos";
import { GestaoAssinaturasAdmin } from "./GestaoAssinaturasAdmin";
import {
  Palette,
  Shield,
  User,
  Check,
  RefreshCw,
  LogOut,
  ShieldCheck,
  CheckCircle2,
  CreditCard,
  AlertCircle,
  PlusCircle,
  Crown,
  AlertTriangle,
  Phone,
  Mail,
  KeyRound,
  Lock,
} from "lucide-react";

interface PerfilViewProps {
  currentUser: any;
  todosUsuarios: any[];
  onTrocarUsuario: (id: string) => void;
  onLogout?: () => void;
  onRoleAtualizado?: () => void;
  onCriarNovoConsorcio?: () => void;
}

export function PerfilView({
  currentUser,
  todosUsuarios,
  onTrocarUsuario,
  onLogout,
  onRoleAtualizado,
  onCriarNovoConsorcio,
}: PerfilViewProps) {
  const { theme, setTheme } = useTheme();
  const [salvando, setSalvando] = useState(false);
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastData | null>(null);
  const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);

  // Estado dos Dados Cadastrais e Contato
  const [nome, setNome] = useState(currentUser?.name || "");
  const [telefone, setTelefone] = useState(
    currentUser?.telefone ? formatarTelefone(currentUser.telefone) : ""
  );
  const [alterarSenhaAberto, setAlterarSenhaAberto] = useState(false);
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaNovaSenha, setConfirmaNovaSenha] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilMsgErro, setPerfilMsgErro] = useState("");
  const [perfilMsgSucesso, setPerfilMsgSucesso] = useState("");
  const [salvoComSucesso, setSalvoComSucesso] = useState(false);

  // Estado das preferências de recebimento Pix
  const [receberPixDireto, setReceberPixDireto] = useState<boolean>(
    Boolean(currentUser?.receberPixDireto)
  );
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>(
    (currentUser?.tipoChavePix as TipoChavePix) || "CELULAR"
  );
  const [chavePix, setChavePix] = useState<string>(currentUser?.chavePix || "");

  useEffect(() => {
    setNome(currentUser?.name || "");
    setTelefone(currentUser?.telefone ? formatarTelefone(currentUser.telefone) : "");
    setSenhaAtual("");
    setNovaSenha("");
    setConfirmaNovaSenha("");
    setAlterarSenhaAberto(false);
    setPerfilMsgErro("");

    setReceberPixDireto(Boolean(currentUser?.receberPixDireto));
    setTipoChavePix((currentUser?.tipoChavePix as TipoChavePix) || "CELULAR");
    setChavePix(currentUser?.chavePix || "");
  }, [currentUser]);

  const handleSalvarDadosCadastrais = async (e: React.FormEvent) => {
    e.preventDefault();
    setPerfilMsgErro("");

    const trimmedNome = nome.trim();
    if (!trimmedNome || trimmedNome.length < 2) {
      setPerfilMsgErro("O nome completo deve ter no mínimo 2 caracteres.");
      setToast({
        titulo: "Nome Inválido",
        mensagem: "O nome completo deve ter no mínimo 2 caracteres.",
        tipo: "warning",
      });
      return;
    }

    if (receberPixDireto && !chavePix.trim()) {
      setPerfilMsgErro("Por favor, informe sua chave Pix para poder receber os valores diretamente.");
      setToast({
        titulo: "Chave Pix Obrigatória",
        mensagem: "Informe a sua chave Pix para poder receber os pagamentos diretamente.",
        tipo: "warning",
      });
      return;
    }

    if (alterarSenhaAberto) {
      if (!novaSenha || novaSenha.trim().length < 6) {
        setPerfilMsgErro("A nova senha deve ter no mínimo 6 dígitos.");
        setToast({
          titulo: "Senha Muito Curta",
          mensagem: "A nova senha deve ter no mínimo 6 dígitos.",
          tipo: "warning",
        });
        return;
      }
      if (novaSenha !== confirmaNovaSenha) {
        setPerfilMsgErro("A confirmação da nova senha não confere.");
        setToast({
          titulo: "Senhas Divergentes",
          mensagem: "A confirmação da nova senha não confere com a nova senha digitada.",
          tipo: "warning",
        });
        return;
      }
    }

    setSalvandoPerfil(true);
    const res = await updateUserProfileDadosAction({
      usuarioId: currentUser.id,
      name: trimmedNome,
      telefone: telefone.trim() || null,
      tipoChavePix,
      chavePix: chavePix.trim() || null,
      receberPixDireto,
      senhaAtual: alterarSenhaAberto ? senhaAtual : undefined,
      novaSenha: alterarSenhaAberto ? novaSenha.trim() : undefined,
    });
    setSalvandoPerfil(false);

    if (res.success) {
      setToast({
        titulo: "Perfil Atualizado!",
        mensagem: res.message || "Seus dados cadastrais foram atualizados com sucesso.",
        tipo: "success",
      });
      setPerfilMsgSucesso("✓ Dados cadastrais salvos com sucesso!");
      setSalvoComSucesso(true);
      setTimeout(() => {
        setSalvoComSucesso(false);
        setPerfilMsgSucesso("");
      }, 4000);
      setAlterarSenhaAberto(false);
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmaNovaSenha("");
      if (onRoleAtualizado) onRoleAtualizado();
    } else {
      setPerfilMsgErro(res.error || "Erro ao atualizar dados do perfil.");
      setToast({
        titulo: "Erro ao Atualizar",
        mensagem: res.error || "Erro ao atualizar dados do perfil.",
        tipo: "error",
      });
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { text: "Super Admin", color: "bg-purple-100 text-purple-800 border-purple-200" };
      case "PRO_MASTER":
        return { text: "Pro-Master", color: "bg-amber-100 text-amber-800 border-amber-200" };
      case "PRO":
        return { text: "Pro", color: "bg-blue-100 text-blue-800 border-blue-200" };
      default:
        return { text: "Comum", color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  const handleAlterarRole = async (targetUserId: string, newRole: any) => {
    setLoadingRole(targetUserId);
    const res = await updateUserRoleAction({
      adminUserId: currentUser.id,
      targetUserId,
      newRole,
    });
    setLoadingRole(null);
    if (res.success) {
      setToast({
        titulo: "Permissão Atualizada!",
        mensagem: res.message || "Nível de acesso do usuário atualizado com sucesso.",
        tipo: "success",
      });
      if (onRoleAtualizado) onRoleAtualizado();
    } else {
      setToast({
        titulo: "Erro de Permissão",
        mensagem: res.error || "Erro ao atualizar nível de acesso.",
        tipo: "error",
      });
    }
  };

  const paletas = [
    { id: "blue", nome: "Azul (Padrão)", cor: "bg-blue-600" },
    { id: "dark", nome: "Escuro", cor: "bg-slate-900" },
    { id: "purple", nome: "Roxo", cor: "bg-purple-600" },
    { id: "ocean", nome: "Azul Claro", cor: "bg-sky-600" },
    { id: "coral", nome: "Laranja", cor: "bg-orange-600" },
  ];

  const handleSelecionarTema = async (novoTema: ThemeName) => {
    setTheme(novoTema);
    setSalvando(true);
    await updateUserThemeAction(currentUser.id, novoTema);
    setSalvando(false);
    setToast({
      titulo: "Tema Atualizado!",
      mensagem: `Paleta ${novoTema.toUpperCase()} salva na sua conta.`,
      tipo: "success",
    });
  };

  const getRoleDesc = (role: string) => {
    switch (role) {
      case "SUPER_ADMIN":
        return {
          nome: "Super Admin",
          desc: "Gestão global de usuários, consórcios e auditoria completa.",
          badge: "bg-purple-100 text-purple-800",
        };
      case "PRO_MASTER":
        return {
          nome: "Pro Master",
          desc: "Criação e gestão ilimitada de consórcios e participantes.",
          badge: "bg-indigo-100 text-indigo-800",
        };
      case "PRO":
        return {
          nome: "Pro",
          desc: "Até 3 consórcios ativos e 20 participantes por grupo.",
          badge: "bg-blue-100 text-blue-800",
        };
      default:
        return {
          nome: "Comum",
          desc: "Participa de consórcios e pode criar até 1 consórcio ativo com 10 participantes.",
          badge: "bg-slate-100 text-slate-700",
        };
    }
  };

  const roleInfo = getRoleDesc(currentUser.role);
  const vigencia = getVigenciaPlano(currentUser);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Modal Flutuante com auto-dismiss */}
      <ToastModal toast={toast} onClose={() => setToast(null)} />

      {/* Cartão de Perfil */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-theme-main text-white font-black flex items-center justify-center text-xl shadow-md">
              {currentUser.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-lg sm:text-xl">{currentUser.name}</h3>
              <p className="text-xs sm:text-sm text-slate-500">{currentUser.email}</p>
              <span className={`inline-block text-[11px] font-bold px-3 py-0.5 rounded-full mt-1.5 ${roleInfo.badge}`}>
                {roleInfo.nome}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-bold text-slate-800">
              <Shield className="w-4 h-4 text-theme-text flex-shrink-0" />
              <span>Permissões e Capacidades da Conta:</span>
            </p>
            <p className="text-slate-500 mt-1 text-xs sm:text-sm leading-relaxed">{roleInfo.desc}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap flex-shrink-0 self-start sm:self-auto">
            {onCriarNovoConsorcio && (
              <button
                type="button"
                onClick={onCriarNovoConsorcio}
                className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-theme-main hover:bg-theme-main/90 active:scale-95 text-white font-bold text-xs shadow-xs transition cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Criar Consórcio</span>
              </button>
            )}
            {currentUser.role !== "SUPER_ADMIN" && (
              <button
                type="button"
                onClick={() => setModalUpgradeAberto(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 font-bold text-xs transition cursor-pointer shadow-2xs"
              >
                <Crown className="w-4 h-4 text-purple-600" />
                <span>Migrar de Plano</span>
              </button>
            )}
          </div>
        </div>

        {/* Banner de Vigência da Assinatura para Usuários PRO / PRO_MASTER */}
        {vigencia.status === "EXPIRADO" && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{vigencia.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setModalUpgradeAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto shadow-xs"
            >
              Renovar Assinatura
            </button>
          </div>
        )}

        {vigencia.status === "A_VENCER" && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>{vigencia.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setModalUpgradeAberto(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition cursor-pointer self-start sm:self-auto shadow-xs"
            >
              Renovar Agora
            </button>
          </div>
        )}

        {vigencia.status === "VIGENTE" && vigencia.dataExpiracaoFormatada && (
          <div className="mt-4 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{vigencia.label}</span>
            </div>
            <button
              type="button"
              onClick={() => setModalUpgradeAberto(true)}
              className="text-[11px] font-bold text-emerald-700 hover:underline cursor-pointer"
            >
              Estender Vigência
            </button>
          </div>
        )}
      </div>

      {/* Dados Cadastrais & Contato */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Dados Pessoais & Contato
              </h4>
              <p className="text-xs text-slate-500">
                Mantenha suas informações de contato e WhatsApp atualizadas
              </p>
            </div>
          </div>
        </div>

        {perfilMsgErro && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{perfilMsgErro}</span>
          </div>
        )}

        {perfilMsgSucesso && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2.5 animate-in fade-in duration-200 shadow-2xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{perfilMsgSucesso}</span>
          </div>
        )}

        <form onSubmit={handleSalvarDadosCadastrais} className="space-y-4 pt-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Nome Completo *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Seu nome completo"
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:border-theme-main focus:outline-none shadow-2xs"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                WhatsApp / Celular
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={telefone}
                  onChange={(e) => setTelefone(formatarTelefone(e.target.value))}
                  placeholder="(11) 98765-4321"
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-white focus:border-theme-main focus:outline-none shadow-2xs"
                />
                <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Utilizado para o botão de WhatsApp direto nos links dos seus consórcios.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-semibold text-slate-600">
                E-mail de Acesso
              </label>
              <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Identificador exclusivo da conta
              </span>
            </div>
            <div className="relative">
              <input
                type="email"
                disabled
                value={currentUser.email || ""}
                className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold bg-slate-100 text-slate-500 cursor-not-allowed shadow-2xs"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* Chave Pix e Tipo de Chave Pix (Dados Cadastrais da Conta) */}
          <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Chave Pix da Conta (Recebimento)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                {receberPixDireto ? "Pix Direto Ativo" : "Pix Centralizado"}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Tipo da Chave
                </label>
                <select
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value as TipoChavePix)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-theme-main focus:outline-none"
                >
                  {TIPOS_CHAVE_PIX.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Chave Pix
                </label>
                <input
                  type="text"
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  placeholder={
                    TIPOS_CHAVE_PIX.find((t) => t.value === tipoChavePix)?.placeholder ||
                    "Informe sua chave Pix"
                  }
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold bg-white focus:border-theme-main focus:outline-none shadow-2xs"
                />
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer text-xs text-emerald-950 pt-1">
              <input
                type="checkbox"
                checked={receberPixDireto}
                onChange={(e) => setReceberPixDireto(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
              />
              <div className="space-y-0.5">
                <span className="font-bold text-slate-900 block">
                  Desejo receber o Pix diretamente na minha conta bancária
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Quando marcado, no mês da sua contemplação os demais participantes enviarão as contribuições diretamente para a sua chave Pix pessoal (sua própria cota fica retida com você). Se desmarcado, a bolada segue a arrecadação centralizada do consórcio.
                </p>
              </div>
            </label>
          </div>

          {/* Seção Opcional: Alterar Senha */}
          <div className="pt-2 border-t border-slate-100">
            {!alterarSenhaAberto ? (
              <button
                type="button"
                onClick={() => setAlterarSenhaAberto(true)}
                className="text-xs font-bold text-theme-text hover:underline flex items-center gap-1.5 cursor-pointer py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Desejo alterar minha senha de acesso</span>
              </button>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <KeyRound className="w-4 h-4 text-theme-text" />
                    <span>Alteração de Senha</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAlterarSenhaAberto(false);
                      setSenhaAtual("");
                      setNovaSenha("");
                      setConfirmaNovaSenha("");
                    }}
                    className="text-[11px] text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                  >
                    Cancelar troca de senha
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Senha Atual *
                    </label>
                    <input
                      type="password"
                      value={senhaAtual}
                      onChange={(e) => setSenhaAtual(e.target.value)}
                      placeholder="Sua senha atual"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-theme-main focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Nova Senha *
                    </label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-theme-main focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      value={confirmaNovaSenha}
                      onChange={(e) => setConfirmaNovaSenha(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-theme-main focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={salvandoPerfil}
              className={`py-2.5 px-5 font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50 ${
                salvoComSucesso
                  ? "bg-emerald-600 text-white shadow-emerald-200"
                  : "bg-theme-main hover:opacity-90 text-white"
              }`}
            >
              {salvandoPerfil ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando Dados...</span>
                </>
              ) : salvoComSucesso ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Salvo com Sucesso!</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Dados Cadastrais</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Seletor Permanente de Paleta de Cores (Requisito Solicitado) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <Palette className="w-5 h-5 text-theme-text flex-shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Personalizar Tema do Aplicativo</h4>
            <p className="text-xs text-slate-500">
              Escolha a sua paleta de cores favorita para salvar permanentemente na sua conta.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-1">
          {paletas.map((p) => {
            const isAtiva = theme === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelecionarTema(p.id as ThemeName)}
                className={`p-3.5 rounded-2xl border flex items-center justify-between text-left transition touch-target ${
                  isAtiva
                    ? "border-theme-main bg-theme-light shadow-sm ring-2 ring-theme-main/20"
                    : "border-slate-200 bg-slate-50/70 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-full ${p.cor} shadow-sm border-2 border-white flex-shrink-0`}></span>
                  <p className={`text-xs sm:text-sm font-bold ${isAtiva ? "text-theme-text" : "text-slate-800"}`}>
                    {p.nome}
                  </p>
                </div>

                {isAtiva && (
                  <span className="w-5 h-5 rounded-full bg-theme-main text-white flex items-center justify-center text-xs flex-shrink-0">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Gestão de Assinaturas & Planos SaaS (Exclusivo Super Admin) */}
      {currentUser.role === "SUPER_ADMIN" && (
        <GestaoAssinaturasAdmin
          currentUser={currentUser}
          onAssinaturaAlterada={onRoleAtualizado}
        />
      )}

      {/* Gestão de Níveis de Acesso (Exclusivo Super Admin) */}
      {currentUser.role === "SUPER_ADMIN" && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                  Gestão de Níveis de Acesso (Super Admin)
                </h4>
                <p className="text-xs text-slate-500">
                  Promova ou ajuste as permissões de acesso dos usuários do Clube da Cota:
                </p>
              </div>
            </div>

            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full uppercase">
              Área Administrativa
            </span>
          </div>

          <div className="space-y-2.5 pt-2">
            {todosUsuarios.map((u) => {
              const badge = getRoleBadge(u.role);
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
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded-md">
                          Você
                        </span>
                      )}
                      <span className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.text}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 block truncate mt-0.5">{u.email}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <label className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Alterar Papel:</label>
                    <select
                      value={u.role}
                      disabled={loadingRole === u.id}
                      onChange={(e) => handleAlterarRole(u.id, e.target.value)}
                      className="text-xs font-bold p-2.5 rounded-xl border border-slate-200 bg-white hover:border-purple-400 focus:outline-none focus:border-purple-600 cursor-pointer shadow-xs"
                    >
                      <option value="COMUM">Comum (1 consórcio, até 10 membros)</option>
                      <option value="PRO">Pro (até 3 consórcios, até 20 membros)</option>
                      <option value="PRO_MASTER">Pro-Master (Multiconsórcios avançados)</option>
                      <option value="SUPER_ADMIN">Super Admin (Acesso total)</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Alternador de Usuários para Teste do MVP */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center gap-2.5">
          <RefreshCw className="w-4 h-4 text-slate-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold text-slate-900 text-sm sm:text-base">Alternar Usuário (Simulação de Perfis)</h4>
            <p className="text-xs text-slate-500">
              Troque de conta para testar como o criador e participantes com cotas individuais ou compartilhadas visualizam o app:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2">
          {todosUsuarios.map((u) => {
            const badge = getRoleBadge(u.role);
            return (
              <button
                key={u.id}
                onClick={() => onTrocarUsuario(u.id)}
                className={`p-3 rounded-2xl border text-left text-xs flex justify-between items-center transition ${
                  u.id === currentUser.id
                    ? "bg-slate-800 text-white font-bold border-slate-800 shadow-sm"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="truncate pr-2">
                  <span className="font-bold block truncate">{u.name}</span>
                  <span className={`text-[10px] block truncate ${u.id === currentUser.id ? "text-slate-300" : "text-slate-400"}`}>
                    {u.email}
                  </span>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 border ${
                  u.id === currentUser.id ? "bg-white/20 text-white border-white/30" : badge.color
                }`}>
                  {badge.text}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Botão de Logout / Sair da Conta */}
      {onLogout && (
        <div className="pt-2">
          <button
            onClick={onLogout}
            className="w-full py-4 px-6 bg-white hover:bg-rose-50 text-rose-600 font-bold text-sm rounded-3xl border border-rose-200/80 shadow-sm flex items-center justify-center gap-2 transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair da Minha Conta (Logout)</span>
          </button>
        </div>
      )}

      {/* Modal de Upgrade de Planos com Pix para Marcos Batista */}
      <ModalUpgradePlanos
        aberto={modalUpgradeAberto}
        onFechar={() => setModalUpgradeAberto(false)}
        planoRecomendado={currentUser.role === "COMUM" ? "PRO" : "PRO_MASTER"}
        userId={currentUser.id}
        onUpgradeSolicitado={() => {
          if (onRoleAtualizado) onRoleAtualizado();
        }}
      />
    </div>
  );
}
