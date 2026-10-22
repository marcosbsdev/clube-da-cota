"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bell, Users, Home, BarChart3, PlusCircle, UserCircle, ChevronDown, Check, RefreshCw, LogOut } from "lucide-react";
import { TabType } from "./BottomNav";

interface HeaderProps {
  userName: string;
  userRole: string;
  unreadCount?: number;
  activeTab?: TabType;
  onChangeTab?: (tab: TabType) => void;
  canCreateOrManage?: boolean;
  currentUserId?: string;
  todosUsuarios?: any[];
  onTrocarUsuario?: (id: string) => void;
  onLogout?: () => void;
  consorcioAtual?: any;
  todosConsorcios?: any[];
  onSelecionarConsorcio?: (id: string) => void;
}

export function Header({
  userName,
  userRole,
  unreadCount = 1,
  activeTab = "participante",
  onChangeTab,
  canCreateOrManage = true,
  currentUserId,
  todosUsuarios = [],
  onTrocarUsuario,
  onLogout,
  consorcioAtual,
  todosConsorcios = [],
  onSelecionarConsorcio,
}: HeaderProps) {
  const [dropdownAberto, setDropdownAberto] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownAberto(false);
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
            <div className="w-9 h-9 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center font-black text-white shadow-sm flex-shrink-0">
              <Users className="w-5 h-5 text-white" />
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === "participante"
                    ? "bg-white text-theme-main shadow-sm"
                    : "text-white/90 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Home className="w-4 h-4" />
                <span>Meu Consórcio</span>
              </button>

              {canCreateOrManage && (
                <button
                  onClick={() => onChangeTab("criador")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    activeTab === "criador"
                      ? "bg-white text-theme-main shadow-sm"
                      : "text-white/90 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Gestão do Grupo</span>
                </button>
              )}

              {canCreateOrManage && (
                <button
                  onClick={() => onChangeTab("assistente")}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition ${
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
        <div className="flex items-center gap-3">
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
                      className="w-full p-2.5 rounded-2xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-2 transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sair da Conta (Logout)</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="relative p-2 rounded-xl bg-white/10 hover:bg-white/20 transition cursor-pointer" title="Notificações">
            <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-theme-main"></span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
