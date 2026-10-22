"use client";

import React, { useState } from "react";
import { useTheme, ThemeName } from "./ThemeProvider";
import { updateUserThemeAction } from "@/app/actions";
import { Palette, Shield, User, Check, RefreshCw, LogOut } from "lucide-react";

interface PerfilViewProps {
  currentUser: any;
  todosUsuarios: any[];
  onTrocarUsuario: (id: string) => void;
  onLogout?: () => void;
}

export function PerfilView({ currentUser, todosUsuarios, onTrocarUsuario, onLogout }: PerfilViewProps) {
  const { theme, setTheme } = useTheme();
  const [salvando, setSalvando] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState("");

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
    setMsgSucesso(`Paleta ${novoTema.toUpperCase()} salva na sua conta!`);
    setTimeout(() => setMsgSucesso(""), 3000);
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
      {msgSucesso && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{msgSucesso}</span>
        </div>
      )}

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

        <div className="mt-5 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
          <p className="flex items-center gap-2 font-bold text-slate-800">
            <Shield className="w-4 h-4 text-theme-text flex-shrink-0" />
            <span>Permissões e Capacidades da Conta:</span>
          </p>
          <p className="text-slate-500 mt-1 text-xs sm:text-sm leading-relaxed">{roleInfo.desc}</p>
        </div>
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
          {todosUsuarios.map((u) => (
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
                <span className="text-[10px] opacity-70 block truncate">{u.email}</span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-white/20 flex-shrink-0">
                {u.role}
              </span>
            </button>
          ))}
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
