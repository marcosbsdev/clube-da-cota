"use client";

import React, { useState } from "react";
import { Lock, Mail, User, Eye, EyeOff, ArrowRight, Check, AlertCircle, KeyRound, Sparkles, Phone, CreditCard } from "lucide-react";
import { AppLogo } from "./AppLogo";
import { loginAction, registerAction, forgotPasswordAction, resetPasswordAction, quickLoginAction } from "@/app/actions";
import { TipoChavePix, TIPOS_CHAVE_PIX, formatarTelefone } from "@/lib/finance";

interface AuthViewProps {
  onAuthSuccess: (user: any) => void;
  todosUsuarios: any[];
}

export function AuthView({ onAuthSuccess, todosUsuarios }: AuthViewProps) {
  const [modo, setModo] = useState<"login" | "cadastro" | "recuperar">("login");
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Campos Login
  const [emailLogin, setEmailLogin] = useState("");
  const [senhaLogin, setSenhaLogin] = useState("");

  // Campos Cadastro
  const [nomeCadastro, setNomeCadastro] = useState("");
  const [emailCadastro, setEmailCadastro] = useState("");
  const [telefoneCadastro, setTelefoneCadastro] = useState("");
  const [senhaCadastro, setSenhaCadastro] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [receberPixDireto, setReceberPixDireto] = useState(true);
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>("CELULAR");
  const [chavePix, setChavePix] = useState("");

  // Campos Recuperação
  const [emailRecuperar, setEmailRecuperar] = useState("");
  const [tokenRecuperado, setTokenRecuperado] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [etapaRecuperacao, setEtapaRecuperacao] = useState<1 | 2>(1);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setLoading(true);

    const res = await loginAction({ email: emailLogin, password: senhaLogin });
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErroMsg(res.error || "Falha ao entrar.");
    }
  };

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");

    if (senhaCadastro !== confirmaSenha) {
      setErroMsg("As senhas informadas não coincidem.");
      return;
    }

    if (receberPixDireto && !chavePix.trim()) {
      setErroMsg("Por favor, informe sua chave Pix para poder receber valores diretamente.");
      return;
    }

    setLoading(true);
    const res = await registerAction({
      name: nomeCadastro,
      email: emailCadastro,
      password: senhaCadastro,
      telefone: telefoneCadastro.trim() || undefined,
      tipoChavePix,
      chavePix: chavePix.trim() || undefined,
      receberPixDireto: Boolean(receberPixDireto && chavePix.trim()),
    });
    setLoading(false);

    if (res.success && res.user) {
      onAuthSuccess(res.user);
    } else {
      setErroMsg(res.error || "Falha ao criar conta.");
    }
  };

  const handleSolicitarRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setLoading(true);

    const res = await forgotPasswordAction(emailRecuperar);
    setLoading(false);

    if (res.success && res.resetToken) {
      setTokenRecuperado(res.resetToken);
      setEtapaRecuperacao(2);
      setSucessoMsg("Código de redefinição gerado! Crie sua nova senha abaixo.");
    } else {
      setErroMsg(res.error || "Erro ao solicitar recuperação.");
    }
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroMsg("");
    setLoading(true);

    const res = await resetPasswordAction(tokenRecuperado, novaSenha);
    setLoading(false);

    if (res.success) {
      setSucessoMsg("Senha redefinida com sucesso! Você já está logado.");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setErroMsg(res.error || "Falha ao redefinir senha.");
    }
  };

  const handleQuickLogin = async (userId: string) => {
    setLoading(true);
    const res = await quickLoginAction(userId);
    setLoading(false);
    if (res.success && res.user) {
      onAuthSuccess(res.user);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl space-y-6">
        {/* Cabeçalho / Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-20">
            <AppLogo size={80} className="logo-breathe drop-shadow-md" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-theme-text block">
              Consórcio entre Amigos
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Clube da Cota
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            {modo === "login" && "Acesse sua conta para acompanhar ou gerenciar seu consórcio."}
            {modo === "cadastro" && "Crie sua conta para participar ou organizar consórcios."}
            {modo === "recuperar" && "Recupere o acesso à sua conta de forma segura."}
          </p>
        </div>

        {/* Mensagens de Sucesso e Erro */}
        {erroMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{erroMsg}</span>
          </div>
        )}

        {sucessoMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{sucessoMsg}</span>
          </div>
        )}

        {/* ABA: ENTRAR (LOGIN) */}
        {modo === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={emailLogin}
                  onChange={(e) => setEmailLogin(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">Senha</label>
                <button
                  type="button"
                  onClick={() => {
                    setErroMsg("");
                    setSucessoMsg("");
                    setModo("recuperar");
                  }}
                  className="text-[11px] font-bold text-theme-text hover:underline"
                >
                  Esqueci minha senha
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  placeholder="Sua senha secreta"
                  value={senhaLogin}
                  onChange={(e) => setSenhaLogin(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-theme-main hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target"
            >
              <span>{loading ? "Entrando..." : "Entrar no Clube da Cota"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500">Ainda não tem conta? </span>
              <button
                type="button"
                onClick={() => {
                  setErroMsg("");
                  setSucessoMsg("");
                  setModo("cadastro");
                }}
                className="text-xs font-bold text-theme-text hover:underline"
              >
                Cadastre-se gratuitamente
              </button>
            </div>
          </form>
        )}

        {/* ABA: CADASTRO */}
        {modo === "cadastro" && (
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva"
                  value={nomeCadastro}
                  onChange={(e) => setNomeCadastro(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  placeholder="seu@email.com"
                  value={emailCadastro}
                  onChange={(e) => setEmailCadastro(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp / Celular</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  placeholder="(11) 98765-4321"
                  value={telefoneCadastro}
                  onChange={(e) => setTelefoneCadastro(formatarTelefone(e.target.value))}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            {/* Chave Pix e Tipo de Chave Pix (Campos Diretos e Oficiais) */}
            <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-200/80 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                <span>Dados de Chave Pix para Recebimento</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Tipo da Chave</label>
                  <select
                    value={tipoChavePix}
                    onChange={(e) => setTipoChavePix(e.target.value as TipoChavePix)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:outline-none"
                  >
                    {TIPOS_CHAVE_PIX.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Chave Pix</label>
                  <input
                    type="text"
                    value={chavePix}
                    onChange={(e) => setChavePix(e.target.value)}
                    placeholder={TIPOS_CHAVE_PIX.find((t) => t.value === tipoChavePix)?.placeholder || "Informe sua chave Pix"}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-white focus:outline-none"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-emerald-950 font-semibold pt-1">
                <input
                  type="checkbox"
                  checked={receberPixDireto}
                  onChange={(e) => setReceberPixDireto(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-emerald-300 focus:ring-emerald-500 cursor-pointer"
                />
                <span>Desejo receber o valor da bolada diretamente nesta chave Pix ao ser contemplado(a).</span>
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Criar Senha (mínimo 6 dígitos)</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={senhaCadastro}
                  onChange={(e) => setSenhaCadastro(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600"
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirmar Senha</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={confirmaSenha}
                  onChange={(e) => setConfirmaSenha(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-theme-main hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target"
            >
              <span>{loading ? "Criando Conta..." : "Criar Minha Conta"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-500">Já tem uma conta? </span>
              <button
                type="button"
                onClick={() => {
                  setErroMsg("");
                  setSucessoMsg("");
                  setModo("login");
                }}
                className="text-xs font-bold text-theme-text hover:underline"
              >
                Faça login
              </button>
            </div>
          </form>
        )}

        {/* ABA: RECUPERAÇÃO DE SENHA */}
        {modo === "recuperar" && (
          <div className="space-y-4">
            {etapaRecuperacao === 1 ? (
              <form onSubmit={handleSolicitarRecuperacao} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Digite seu E-mail Cadastrado
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={emailRecuperar}
                      onChange={(e) => setEmailRecuperar(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-theme-main hover:opacity-95 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{loading ? "Verificando..." : "Gerar Código de Recuperação"}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRedefinirSenha} className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  <span className="text-slate-500 font-semibold block">Código de Redefinição:</span>
                  <code className="text-xs font-mono font-bold text-theme-text mt-0.5 block break-all">
                    {tokenRecuperado}
                  </code>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Digite sua Nova Senha</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-slate-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>{loading ? "Salvando..." : "Salvar Nova Senha & Entrar"}</span>
                </button>
              </form>
            )}

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => {
                  setErroMsg("");
                  setSucessoMsg("");
                  setEtapaRecuperacao(1);
                  setModo("login");
                }}
                className="text-xs font-bold text-slate-600 hover:underline"
              >
                Voltar para o Login
              </button>
            </div>
          </div>
        )}

        {/* CONTAS DE DEMONSTRAÇÃO RÁPIDA (1-CLIQUE) */}
        <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Acesso Rápido de Teste (1-Clique)</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Clique em qualquer conta de teste para entrar instantaneamente:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {todosUsuarios.slice(0, 4).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => handleQuickLogin(u.id)}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 text-left transition flex items-center justify-between"
              >
                <div className="truncate pr-2">
                  <span className="text-xs font-bold text-slate-800 block truncate">{u.name}</span>
                  <span className="text-[10px] text-slate-400 block truncate">
                    {u.role === "SUPER_ADMIN" ? "👑 Criador/Admin" : "👤 Participante"}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-theme-text bg-theme-light px-2 py-0.5 rounded-lg flex-shrink-0">
                  Entrar
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
