"use client";

import React, { useState, useMemo } from "react";
import { FolderKanban, ChevronDown, Check, Plus, Search, X, Users, ShieldCheck } from "lucide-react";

interface ConsorcioComboSelectorProps {
  consorcioAtual: any;
  todosConsorcios: any[];
  onSelecionarConsorcio: (consorcioId: string) => void;
  onCriarNovoConsorcio?: () => void;
}

export function ConsorcioComboSelector({
  consorcioAtual,
  todosConsorcios = [],
  onSelecionarConsorcio,
  onCriarNovoConsorcio,
}: ConsorcioComboSelectorProps) {
  const [modalAberto, setModalAberto] = useState(false);
  const [termoBusca, setTermoBusca] = useState("");

  const consorciosFiltrados = useMemo(() => {
    if (!termoBusca.trim()) return todosConsorcios;
    const q = termoBusca.toLowerCase().trim();
    return todosConsorcios.filter(
      (c) =>
        c.nome?.toLowerCase().includes(q) ||
        c.finalidade?.toLowerCase().includes(q) ||
        c.papel?.toLowerCase().includes(q)
    );
  }, [todosConsorcios, termoBusca]);

  if (!consorcioAtual && todosConsorcios.length === 0) {
    return null;
  }

  const papelAtual =
    consorcioAtual?.papel ||
    (todosConsorcios.find((c) => c.id === consorcioAtual?.id)?.papel) ||
    "Participante";

  return (
    <>
      {/* Card do Seletor Combo em Destaque */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/90 shadow-sm space-y-2.5 mb-6">
        <div className="flex justify-between items-center px-1">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="text-sm">📁</span> Consórcio Selecionado:
          </span>
          <span className="text-xs font-bold text-theme-text bg-theme-light border border-theme-light px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <span>
              {todosConsorcios.length} {todosConsorcios.length === 1 ? "consórcio" : "consórcios"}
            </span>
          </span>
        </div>

        {/* O Campo Combo Clicável */}
        <button
          type="button"
          onClick={() => {
            setTermoBusca("");
            setModalAberto(true);
          }}
          className="w-full p-3 sm:p-4 bg-slate-50 hover:bg-slate-100/90 active:bg-theme-light/30 border-2 border-slate-200 hover:border-theme-main/60 rounded-2xl flex items-center justify-between gap-3 text-left transition duration-150 group cursor-pointer"
          title="Toque para alternar entre seus consórcios"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-theme-main text-white flex items-center justify-center text-base flex-shrink-0 shadow-xs">
              <FolderKanban className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="truncate">
              <span className="font-black text-slate-900 text-sm sm:text-base block truncate group-hover:text-theme-text transition">
                {consorcioAtual?.nome || "Selecione um Consórcio"}
              </span>
              <span className="text-xs text-slate-500 font-semibold block truncate mt-0.5">
                {consorcioAtual?.totalCotas || 0} cotas • {consorcioAtual?.frequencia?.toLowerCase() || "mensal"} • {papelAtual}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-slate-500 group-hover:text-theme-text flex-shrink-0 font-bold text-xs bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs transition">
            <span className="hidden sm:inline">Alternar</span>
            <span className="sm:hidden">Trocar</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-theme-text transition-transform duration-200" />
          </div>
        </button>
      </div>

      {/* Gaveta Inferior (Bottom Sheet no Mobile / Modal Centralizado no Desktop) */}
      {modalAberto && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end sm:justify-center sm:items-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-5 sm:p-6 w-full sm:max-w-lg max-h-[88vh] sm:max-h-[80vh] flex flex-col shadow-2xl border-t sm:border border-slate-100">
            {/* Puxador da gaveta visível apenas no mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-3 sm:hidden"></div>

            {/* Cabeçalho da Gaveta */}
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-black text-slate-900 text-base sm:text-lg">
                  Seus Consórcios ({todosConsorcios.length})
                </h3>
                <p className="text-xs text-slate-500">
                  Toque no consórcio que deseja visualizar e gerenciar agora:
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campo de Busca (se houver 2 ou mais consórcios) */}
            {todosConsorcios.length >= 2 && (
              <div className="relative mb-3">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={termoBusca}
                  onChange={(e) => setTermoBusca(e.target.value)}
                  placeholder="Buscar consórcio por nome..."
                  className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-theme-main bg-slate-50"
                  autoFocus={false}
                />
                {termoBusca && (
                  <button
                    type="button"
                    onClick={() => setTermoBusca("")}
                    className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                  >
                    Limpar
                  </button>
                )}
              </div>
            )}

            {/* Lista dos Consórcios */}
            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 py-1 max-h-[45vh] sm:max-h-[50vh]">
              {consorciosFiltrados.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-2xl">
                  Nenhum consórcio encontrado para &quot;{termoBusca}&quot;.
                </div>
              ) : (
                consorciosFiltrados.map((c: any) => {
                  const isSelected = c.id === consorcioAtual?.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelecionarConsorcio(c.id);
                        setModalAberto(false);
                      }}
                      className={`w-full p-3.5 rounded-2xl border text-left cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-theme-light border-theme-main shadow-xs ring-1 ring-theme-main/30"
                          : "bg-slate-50/80 hover:bg-slate-100 border-slate-200"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm flex-shrink-0 ${
                            isSelected
                              ? "bg-theme-main text-white"
                              : "bg-white border border-slate-200 text-slate-600"
                          }`}
                        >
                          <FolderKanban className="w-4 h-4" />
                        </div>
                        <div className="truncate min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                              {c.nome}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
                                c.papel === "Administrador"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {c.papel}
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-400 block truncate mt-0.5">
                            {c.totalCotas} cotas • R$ {c.valorCota.toFixed(2)}/cota • {c.frequencia?.toLowerCase()}
                          </span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {isSelected ? (
                          <span className="text-xs font-bold text-theme-text bg-white border border-theme-main/30 px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5" />
                            <span>Ativo</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-semibold hover:text-slate-700">
                            Selecionar →
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Rodapé da Gaveta com Botão de Criar Novo */}
            {onCriarNovoConsorcio && (
              <div className="pt-3 mt-2 border-t border-slate-100 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalAberto(false);
                    onCriarNovoConsorcio();
                  }}
                  className="w-full py-3 px-4 bg-slate-900 hover:bg-black text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Novo Consórcio</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
