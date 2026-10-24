"use client";

import React, { useState } from "react";
import {
  X,
  Sparkles,
  Check,
  Copy,
  CheckCircle2,
  Shield,
  Zap,
  MessageCircle,
  Crown,
} from "lucide-react";
import { DADOS_PAGAMENTO_UPGRADE, PLANOS_INFO } from "@/lib/plans";
import { gerarLinkWhatsApp } from "@/lib/finance";

interface ModalUpgradePlanosProps {
  aberto: boolean;
  onFechar: () => void;
  motivo?: string; // Ex: "Limite de consórcios atingido", "Limite de participantes atingido"
  planoRecomendado?: "PRO" | "PRO_MASTER";
}

export function ModalUpgradePlanos({
  aberto,
  onFechar,
  motivo,
  planoRecomendado = "PRO",
}: ModalUpgradePlanosProps) {
  const [copiado, setCopiado] = useState(false);
  const [planoSelecionado, setPlanoSelecionado] = useState<"PRO" | "PRO_MASTER">(planoRecomendado);

  if (!aberto) return null;

  const handleCopiarChavePix = () => {
    navigator.clipboard.writeText(DADOS_PAGAMENTO_UPGRADE.chavePix);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const linkWhatsAppComprovante = gerarLinkWhatsApp({
    telefone: DADOS_PAGAMENTO_UPGRADE.whatsapp,
    mensagem: `Olá Marcos Batista! Gostaria de migrar meu plano no Clube da Cota para o Plano ${
      planoSelecionado === "PRO" ? "Pro (R$ 19,90/mês)" : "Pro Master (R$ 29,90/mês)"
    }. Segue o meu comprovante da transferência Pix!`,
  });

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Cabeçalho do Modal */}
        <div className="bg-gradient-to-r from-theme-main via-theme-dark to-slate-900 text-white p-5 sm:p-6 relative">
          <button
            type="button"
            onClick={onFechar}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Planos & Migração de Conta</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black">Faça Upgrade do seu Clube da Cota</h2>
          <p className="text-white/80 text-xs sm:text-sm mt-1">
            {motivo || "Aumente sua capacidade de consórcios simultâneos, participantes e desbloqueie governança."}
          </p>
        </div>

        <div className="p-5 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Seletor Visual dos 2 Planos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cartão Plano PRO */}
            <div
              onClick={() => setPlanoSelecionado("PRO")}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                planoSelecionado === "PRO"
                  ? "border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Plano Pro
                  </span>
                  {planoSelecionado === "PRO" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Selecionado
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">R$ 19,90</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mês</span>
                </div>
                <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
                  Ideal para organizadores que gerenciam múltiplos grupos com até 20 pessoas.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {PLANOS_INFO.PRO.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cartão Plano PRO MASTER */}
            <div
              onClick={() => setPlanoSelecionado("PRO_MASTER")}
              className={`p-4 sm:p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                planoSelecionado === "PRO_MASTER"
                  ? "border-purple-600 bg-purple-50/50 shadow-md ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1">
                    <Crown className="w-3 h-3 text-purple-700" /> Pro Master
                  </span>
                  {planoSelecionado === "PRO_MASTER" && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" /> Selecionado
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-2xl sm:text-3xl font-black text-slate-900">R$ 29,90</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mês</span>
                </div>
                <p className="text-xs text-slate-600 mb-3 font-medium leading-relaxed">
                  Poder total sem limites de grupos, membros e trilha de governança avançada.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {PLANOS_INFO.PRO_MASTER.beneficios.map((b, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Seção Padronizada de Pagamento PIX para Marcos Batista */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/40 rounded-2xl p-4 sm:p-5 border-2 border-emerald-200/80 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
                  PIX
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">
                    Instruções de Pagamento para Ativação
                  </h4>
                  <p className="text-xs text-slate-600">
                    Realize o Pix no valor do plano escolhido ({planoSelecionado === "PRO" ? "R$ 19,90" : "R$ 29,90"}):
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-slate-200/90 space-y-2 text-xs">
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">Favorecido:</span>
                <span className="font-bold text-slate-900 text-sm">
                  {DADOS_PAGAMENTO_UPGRADE.favorecido}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">Tipo de Chave:</span>
                <span className="font-semibold text-slate-800">
                  {DADOS_PAGAMENTO_UPGRADE.tipoChavePix}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">WhatsApp para Contato:</span>
                <span className="font-bold text-emerald-700">
                  {DADOS_PAGAMENTO_UPGRADE.whatsapp}
                </span>
              </div>
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                <div className="min-w-0 flex-1">
                  <span className="block text-slate-500 font-semibold text-[11px]">Chave Pix:</span>
                  <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm select-all break-all">
                    {DADOS_PAGAMENTO_UPGRADE.chavePix}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopiarChavePix}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                    copiado
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 hover:bg-slate-800 text-white shadow-xs"
                  }`}
                >
                  {copiado ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Chave</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Aviso e Botão de Envio de Comprovante */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
              <span className="text-[11px] text-slate-500 leading-tight">
                Após realizar o Pix, envie o comprovante para liberação imediata da sua conta.
              </span>
              <a
                href={linkWhatsAppComprovante}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition shadow-xs flex-shrink-0"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Enviar Comprovante</span>
              </a>
            </div>
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 font-bold text-xs text-slate-700 transition cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
