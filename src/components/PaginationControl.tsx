"use client";

import React from "react";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

export interface PaginationControlProps {
  paginaAtual: number;
  totalItens: number;
  itensPorPagina: number;
  onMudarPagina: (novaPagina: number) => void;
  onMudarItensPorPagina?: (novoTamanho: number) => void;
  opcoesItensPorPagina?: number[];
  nomeItem?: string;
  className?: string;
}

export function PaginationControl({
  paginaAtual,
  totalItens,
  itensPorPagina,
  onMudarPagina,
  onMudarItensPorPagina,
  opcoesItensPorPagina = [10, 25, 50],
  nomeItem = "itens",
  className = "",
}: PaginationControlProps) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const paginaValida = Math.min(Math.max(1, paginaAtual), totalPaginas);

  const inicio = totalItens === 0 ? 0 : (paginaValida - 1) * itensPorPagina + 1;
  const fim = Math.min(paginaValida * itensPorPagina, totalItens);

  if (totalItens === 0) {
    return null;
  }

  // Gera a lista de botões de páginas com janela deslizante
  const getNumerosPagina = () => {
    const delta = 1; // páginas visíveis em volta da atual
    const range: number[] = [];
    const rangeWithDots: (number | string)[] = [];
    let l: number | undefined;

    for (let i = 1; i <= totalPaginas; i++) {
      if (i === 1 || i === totalPaginas || (i >= paginaValida - delta && i <= paginaValida + delta)) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l !== undefined) {
        if (i - l === 2) {
          rangeWithDots.push(l + 1);
        } else if (i - l !== 1) {
          rangeWithDots.push("...");
        }
      }
      rangeWithDots.push(i);
      l = i;
    }

    return rangeWithDots;
  };

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 bg-slate-50/80 border-t border-slate-100 text-xs text-slate-600 ${className}`}
    >
      {/* Resumo e Seletor de Itens por Página */}
      <div className="flex items-center gap-3 flex-wrap justify-center sm:justify-start">
        <span className="text-slate-500 font-medium">
          Exibindo <strong className="text-slate-900 font-bold">{inicio}–{fim}</strong> de{" "}
          <strong className="text-slate-900 font-bold">{totalItens}</strong> {nomeItem}
        </span>

        {onMudarItensPorPagina && opcoesItensPorPagina.length > 1 && (
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <span className="text-[11px] text-slate-400 font-semibold">Exibir:</span>
            <select
              value={itensPorPagina}
              onChange={(e) => {
                onMudarItensPorPagina(Number(e.target.value));
                onMudarPagina(1);
              }}
              className="text-xs font-bold py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-800 focus:outline-none focus:border-theme-main cursor-pointer shadow-2xs"
            >
              {opcoesItensPorPagina.map((tam) => (
                <option key={tam} value={tam}>
                  {tam} por pág.
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Controles de Navegação de Página */}
      {totalPaginas > 1 && (
        <div className="flex items-center gap-1 flex-wrap justify-center">
          {/* Primeira Página */}
          <button
            type="button"
            onClick={() => onMudarPagina(1)}
            disabled={paginaValida === 1}
            title="Primeira página"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>

          {/* Página Anterior */}
          <button
            type="button"
            onClick={() => onMudarPagina(paginaValida - 1)}
            disabled={paginaValida === 1}
            title="Página anterior"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {/* Números das Páginas */}
          <div className="flex items-center gap-1 mx-1">
            {getNumerosPagina().map((num, idx) => {
              if (num === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-1.5 text-slate-400 font-bold text-xs select-none">
                    ...
                  </span>
                );
              }
              const isAtiva = num === paginaValida;
              return (
                <button
                  key={`page-${num}`}
                  type="button"
                  onClick={() => onMudarPagina(Number(num))}
                  className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition cursor-pointer shadow-2xs ${
                    isAtiva
                      ? "bg-theme-main text-white shadow-theme-main/20"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>

          {/* Próxima Página */}
          <button
            type="button"
            onClick={() => onMudarPagina(paginaValida + 1)}
            disabled={paginaValida === totalPaginas}
            title="Próxima página"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          {/* Última Página */}
          <button
            type="button"
            onClick={() => onMudarPagina(totalPaginas)}
            disabled={paginaValida === totalPaginas}
            title="Última página"
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer shadow-2xs"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
