"use client";

import React from "react";
import { Home, BarChart3, Plus, User, ShieldCheck } from "lucide-react";

export type TabType = "participante" | "criador" | "assistente" | "perfil" | "admin";

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  canCreateOrManage?: boolean;
  canManage?: boolean;
  canCreate?: boolean;
  isSuperAdmin?: boolean;
}

export function BottomNav({
  activeTab,
  onChangeTab,
  canCreateOrManage = true,
  canManage,
  canCreate,
  isSuperAdmin = false,
}: BottomNavProps) {
  const canManageResolved = canManage !== undefined ? canManage : canCreateOrManage;
  const canCreateResolved = canCreate !== undefined ? canCreate : canCreateOrManage;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-slate-200 px-4 py-2 flex justify-between items-center z-40 shadow-lg">
      <button
        onClick={() => onChangeTab("participante")}
        className={`flex flex-col items-center gap-1 transition touch-target ${
          activeTab === "participante" ? "text-theme-text font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[11px]">Início</span>
      </button>

      {canManageResolved && (
        <button
          onClick={() => onChangeTab("criador")}
          className={`flex flex-col items-center gap-1 transition touch-target ${
            activeTab === "criador" ? "text-theme-text font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[11px]">Gestão</span>
        </button>
      )}

      {canCreateResolved && (
        <button
          onClick={() => onChangeTab("assistente")}
          className="flex flex-col items-center gap-1 text-slate-500 hover:text-slate-700 focus:outline-none"
        >
          <div className="w-9 h-9 -mt-4 bg-theme-main text-white rounded-full flex items-center justify-center shadow-md border-2 border-white transition-colors duration-300">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium">Novo</span>
        </button>
      )}

      {isSuperAdmin && (
        <button
          onClick={() => onChangeTab("admin")}
          className={`flex flex-col items-center gap-1 transition touch-target ${
            activeTab === "admin" ? "text-purple-600 font-bold" : "text-slate-400 hover:text-slate-600"
          }`}
        >
          <ShieldCheck className="w-5 h-5" />
          <span className="text-[11px]">Admin</span>
        </button>
      )}

      <button
        onClick={() => onChangeTab("perfil")}
        className={`flex flex-col items-center gap-1 transition touch-target ${
          activeTab === "perfil" ? "text-theme-text font-bold" : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[11px]">Perfil</span>
      </button>
    </nav>
  );
}
