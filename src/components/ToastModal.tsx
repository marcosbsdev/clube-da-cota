"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react";

export interface ToastData {
  titulo: string;
  mensagem: string;
  tipo?: "success" | "error" | "warning" | "info";
}

interface ToastModalProps {
  toast: ToastData | null;
  onClose: () => void;
  duracaoMs?: number;
}

export function ToastModal({ toast, onClose, duracaoMs = 4000 }: ToastModalProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, duracaoMs);
    return () => clearTimeout(timer);
  }, [toast, duracaoMs, onClose]);

  if (!toast) return null;

  const tipo = toast.tipo || "success";

  const getEstilo = () => {
    switch (tipo) {
      case "error":
        return {
          border: "border-rose-200 border-l-rose-500",
          iconBg: "bg-rose-100 text-rose-700",
          icon: <AlertCircle className="w-5 h-5 text-rose-600" />,
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          badgeText: "Erro",
        };
      case "warning":
        return {
          border: "border-amber-200 border-l-amber-500",
          iconBg: "bg-amber-100 text-amber-800",
          icon: <AlertTriangle className="w-5 h-5 text-amber-700" />,
          badge: "bg-amber-50 text-amber-800 border-amber-200",
          badgeText: "Atenção",
        };
      case "info":
        return {
          border: "border-blue-200 border-l-blue-500",
          iconBg: "bg-blue-100 text-blue-700",
          icon: <Info className="w-5 h-5 text-blue-600" />,
          badge: "bg-blue-50 text-blue-800 border-blue-200",
          badgeText: "Informação",
        };
      default:
        return {
          border: "border-emerald-200 border-l-emerald-500",
          iconBg: "bg-emerald-100 text-emerald-800",
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          badge: "bg-emerald-50 text-emerald-800 border-emerald-200",
          badgeText: "Sucesso",
        };
    }
  };

  const estilo = getEstilo();

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed top-20 left-4 right-4 sm:left-auto sm:right-8 z-[110] max-w-sm sm:max-w-md w-auto sm:w-full animate-in slide-in-from-top-3 fade-in duration-200"
    >
      <div
        className={`bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl shadow-2xl border ${estilo.border} border-l-4 sm:border-l-[6px] p-4 sm:p-4.5 flex items-start gap-3.5 text-slate-800`}
      >
        <div
          className={`w-10 h-10 rounded-2xl ${estilo.iconBg} flex items-center justify-center flex-shrink-0 shadow-2xs`}
        >
          {estilo.icon}
        </div>

        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className={`text-[10px] font-bold px-2 py-0.2 rounded-full border uppercase tracking-wider ${estilo.badge}`}
            >
              {estilo.badgeText}
            </span>
          </div>
          <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-tight">
            {toast.titulo}
          </h4>
          <p className="text-[11px] sm:text-xs text-slate-600 mt-1 leading-relaxed">
            {toast.mensagem}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 p-1 rounded-xl transition cursor-pointer text-xs font-bold shrink-0 hover:bg-slate-100"
          title="Fechar notificação"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
