"use client";

import React, { useState, useEffect } from "react";
import { useTheme, ThemeName } from "./ThemeProvider";
import { updateUserThemeAction, updateUserRoleAction, updateUserPixSettingsAction } from "@/app/actions";
import { TipoChavePix, TIPOS_CHAVE_PIX, getTipoChavePixLabel } from "@/lib/finance";
import { ToastModal, ToastData } from "@/components/ToastModal";
import { Palette, Shield, User, Check, RefreshCw, LogOut, ShieldCheck, CheckCircle2, Zap, CreditCard, AlertCircle, PlusCircle } from "lucide-react";

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

  // Estado das preferências de recebimento Pix
  const [receberPixDireto, setReceberPixDireto] = useState<boolean>(
    Boolean(currentUser?.receberPixDireto)
  );
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>(
    (currentUser?.tipoChavePix as TipoChavePix) || "CELULAR"
  );
  const [chavePix, setChavePix] = useState<string>(currentUser?.chavePix || "");
  const [salvandoPix, setSalvandoPix] = useState(false);
  const [pixMsgErro, setPixMsgErro] = useState("");

  useEffect(() => {
    setReceberPixDireto(Boolean(currentUser?.receberPixDireto));
    setTipoChavePix((currentUser?.tipoChavePix as TipoChavePix) || "CELULAR");
    setChavePix(currentUser?.chavePix || "");
    setPixMsgErro("");
  }, [currentUser]);

  const handleSalvarPix = async (e: React.FormEvent) => {
    e.preventDefault();
    setPixMsgErro("");

    if (receberPixDireto && !chavePix.trim()) {
      setPixMsgErro("Por favor, informe sua chave Pix para receber diretamente.");
      setToast({
        titulo: "Chave Pix Obrigatória",
        mensagem: "Informe a sua chave Pix para poder receber os valores diretamente.",
        tipo: "warning",
      });
      return;
    }

    setSalvandoPix(true);
    const res = await updateUserPixSettingsAction({
      usuarioId: currentUser.id,
      receberPixDireto,
      tipoChavePix,
      chavePix: chavePix.trim(),
    });
    setSalvandoPix(false);

    if (res.success) {
      setToast({
        titulo: "Preferências Pix Salvas!",
        mensagem: res.message || "Suas configurações de recebimento da bolada foram atualizadas.",
        tipo: "success",
      });
      if (onRoleAtualizado) onRoleAtualizado();
    } else {
      setPixMsgErro(res.error || "Erro ao salvar preferências Pix.");
      setToast({
        titulo: "Erro ao Salvar",
        mensagem: res.error || "Erro ao salvar preferências Pix.",
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
          {onCriarNovoConsorcio && (
            <button
              type="button"
              onClick={onCriarNovoConsorcio}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-theme-main hover:bg-theme-main/90 active:scale-95 text-white font-bold text-xs shadow-xs transition self-start sm:self-auto cursor-pointer flex-shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Criar Consórcio</span>
            </button>
          )}
        </div>
      </div>

      {/* Configuração de Recebimento da Bolada (Pix Direto vs Centralizado) */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                Recebimento da Bolada (Pix)
              </h4>
              <p className="text-xs text-slate-500">
                Escolha como deseja receber o valor da bolada quando for contemplado em um consórcio
              </p>
            </div>
          </div>

          <span
            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border ${
              receberPixDireto
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-slate-100 text-slate-600 border-slate-200"
            }`}
          >
            {receberPixDireto ? "Pix Direto Ativo" : "Pix Centralizado"}
          </span>
        </div>

        {pixMsgErro && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{pixMsgErro}</span>
          </div>
        )}

        <form onSubmit={handleSalvarPix} className="space-y-4 pt-1">
          {/* Opção / Switch de Recebimento Direto */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={receberPixDireto}
                onChange={(e) => setReceberPixDireto(e.target.checked)}
                className="mt-1 w-4 h-4 text-theme-main rounded border-slate-300 focus:ring-theme-main cursor-pointer"
              />
              <div className="space-y-1">
                <span className="text-xs sm:text-sm font-bold text-slate-900 block">
                  Desejo receber o Pix diretamente na minha conta bancária
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Quando marcado, no mês da sua contemplação os demais participantes enviarão as contribuições diretamente para a sua chave Pix pessoal, e a sua própria cota fica retida com você (bolada líquida). Se desmarcado, a bolada seguirá o valor cheio arrecadado centralizadamente pelo consórcio.
                </p>
              </div>
            </label>
          </div>

          {/* Campos de Chave Pix (Ativados quando receberPixDireto = true) */}
          {receberPixDireto && (
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-emerald-900 text-xs font-bold">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Dados da Sua Chave Pix Pessoal</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Tipo de Chave
                  </label>
                  <select
                    value={tipoChavePix}
                    onChange={(e) => setTipoChavePix(e.target.value as TipoChavePix)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:border-theme-main focus:outline-none cursor-pointer"
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
                    Chave Pix para Recebimento *
                  </label>
                  <input
                    type="text"
                    required={receberPixDireto}
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
            </div>
          )}

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={salvandoPix}
              className="py-2.5 px-5 bg-theme-main hover:opacity-90 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {salvandoPix ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Salvar Preferências Pix</span>
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
    </div>
  );
}
