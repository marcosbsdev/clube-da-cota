"use client";

import React, { useEffect, useState } from "react";
import { getConsorcioData, logoutAction } from "./actions";
import { Header } from "@/components/Header";
import { BottomNav, TabType } from "@/components/BottomNav";
import { ParticipanteView } from "@/components/ParticipanteView";
import { CriadorView } from "@/components/CriadorView";
import { CriarConsorcioWizard } from "@/components/CriarConsorcioWizard";
import { PerfilView } from "@/components/PerfilView";
import { AuthView } from "@/components/AuthView";
import { useTheme, ThemeName } from "@/components/ThemeProvider";
import { ConsorcioComboSelector } from "@/components/ConsorcioComboSelector";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("participante");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{
    currentUser: any;
    todosUsuarios: any[];
    consorcio: any;
    todosConsorcios: any[];
  } | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedConsorcioId, setSelectedConsorcioId] = useState<string | undefined>(undefined);
  const { setTheme } = useTheme();

  const carregarDados = async (userId?: string, consorcioId?: string, silent = false) => {
    if (!silent) setLoading(true);
    const res = await getConsorcioData(userId, consorcioId);
    setData(res);
    if (res.currentUser?.preferredTheme) {
      setTheme(res.currentUser.preferredTheme as ThemeName);
    }
    if (res.consorcio?.id) {
      setSelectedConsorcioId(res.consorcio.id);
    }
    if (!silent) setLoading(false);
  };

  useEffect(() => {
    carregarDados(selectedUserId, selectedConsorcioId);
  }, [selectedUserId]);

  const handleSelecionarConsorcio = (novoConsorcioId: string) => {
    setSelectedConsorcioId(novoConsorcioId);
    carregarDados(selectedUserId, novoConsorcioId);
  };

  const handleLogout = async () => {
    setLoading(true);
    await logoutAction();
    setSelectedUserId(undefined);
    setSelectedConsorcioId(undefined);
    const res = await getConsorcioData(undefined);
    setData(res);
    setLoading(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Carregando Clube da Cota...</p>
        </div>
      </main>
    );
  }

  // Se não houver sessão ativa, exibe o Módulo de Autenticação Real
  if (!data || !data.currentUser) {
    return (
      <AuthView
        todosUsuarios={data?.todosUsuarios || []}
        onAuthSuccess={(user) => {
          setSelectedUserId(user.id);
          carregarDados(user.id);
        }}
      />
    );
  }

  const { currentUser, todosUsuarios, consorcio, todosConsorcios = [] } = data;
  const isCriadorOuAdmin =
    currentUser.role === "SUPER_ADMIN" ||
    currentUser.role === "PRO_MASTER" ||
    currentUser.role === "PRO" ||
    todosConsorcios.some((c: any) => c.criadorId === currentUser.id) ||
    (consorcio && consorcio.criadorId === currentUser.id);

  return (
    <main className="min-h-screen bg-slate-100/70 flex flex-col relative pb-20 md:pb-10">
      {/* Top Header Responsivo com Navegação no Desktop */}
      <Header
        userName={currentUser.name}
        userRole={currentUser.role}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canCreateOrManage={isCriadorOuAdmin}
        currentUserId={currentUser.id}
        todosUsuarios={todosUsuarios}
        onTrocarUsuario={(novoId) => {
          setSelectedUserId(novoId);
          setActiveTab("participante");
        }}
        onLogout={handleLogout}
        consorcioAtual={consorcio}
        todosConsorcios={todosConsorcios}
        onSelecionarConsorcio={handleSelecionarConsorcio}
      />

      {/* Conteúdo Principal Responsivo */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Seletor Combo em Destaque (Início e Gestão) */}
        {(activeTab === "participante" || activeTab === "criador") && consorcio && (
          <ConsorcioComboSelector
            consorcioAtual={consorcio}
            todosConsorcios={todosConsorcios}
            onSelecionarConsorcio={handleSelecionarConsorcio}
            onCriarNovoConsorcio={isCriadorOuAdmin ? () => setActiveTab("assistente") : undefined}
          />
        )}

        {activeTab === "participante" && (
          <ParticipanteView consorcio={consorcio} currentUser={currentUser} />
        )}

        {activeTab === "criador" && isCriadorOuAdmin && (
          <CriadorView
            consorcio={consorcio}
            currentUser={currentUser}
            todosConsorcios={todosConsorcios}
            onSelecionarConsorcio={handleSelecionarConsorcio}
            onCriarNovoConsorcio={() => setActiveTab("assistente")}
            onAtualizarConsorcio={() => carregarDados(currentUser.id, consorcio.id, true)}
          />
        )}

        {activeTab === "assistente" && isCriadorOuAdmin && (
          <CriarConsorcioWizard
            currentUser={currentUser}
            onConcluido={() => {
              carregarDados(currentUser.id);
              setActiveTab("criador");
            }}
          />
        )}

        {activeTab === "perfil" && (
          <PerfilView
            currentUser={currentUser}
            todosUsuarios={todosUsuarios}
            onTrocarUsuario={(novoId) => {
              setSelectedUserId(novoId);
              setActiveTab("participante");
            }}
            onLogout={handleLogout}
            onRoleAtualizado={() => carregarDados(selectedUserId, selectedConsorcioId)}
          />
        )}
      </div>

      {/* Barra de Navegação Inferior (Mobile PWA apenas) */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        canCreateOrManage={isCriadorOuAdmin}
      />
    </main>
  );
}
