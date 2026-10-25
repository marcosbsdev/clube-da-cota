"use client";

import React, { useState } from "react";
import { Share2, X, MessageCircle, Copy, Download, Check } from "lucide-react";
import {
  copiarImagemParaClipboard,
  baixarBlobComoArquivo,
  ResultadoCompartilhamento,
} from "@/lib/exportCronogramaImage";

interface ModalCronogramaPreviewProps {
  aberto: boolean;
  onClose: () => void;
  imagemUrl: string | null;
  imagemBlob: Blob | null;
  resultado?: ResultadoCompartilhamento | null;
  nomeConsorcio?: string;
  totalContemplados?: number;
  totalCotas?: number;
}

export function ModalCronogramaPreview({
  aberto,
  onClose,
  imagemUrl,
  imagemBlob,
  resultado,
  nomeConsorcio = "Consórcio",
  totalContemplados = 0,
  totalCotas = 0,
}: ModalCronogramaPreviewProps) {
  const [copiadoFeedback, setCopiadoFeedback] = useState(false);

  if (!aberto || !imagemUrl) return null;

  const nomeArquivo = resultado?.nomeArquivo || "cronograma-oficial.png";
  const urlWhatsApp =
    resultado?.urlWhatsApp ||
    `https://api.whatsapp.com/send?text=${encodeURIComponent(
      `🎲 *Cronograma Oficial de Contemplação*\nConsórcio: *${nomeConsorcio}*\nConfira a ordem oficial de recebimento atualizada pelo Clube da Cota!`
    )}`;

  const handleCopiarClipboard = async () => {
    if (!imagemBlob) return;
    const copiou = await copiarImagemParaClipboard(imagemBlob);
    if (copiou) {
      setCopiadoFeedback(true);
      setTimeout(() => setCopiadoFeedback(false), 3000);
    } else {
      baixarBlobComoArquivo(imagemBlob, nomeArquivo);
    }
  };

  const handleBaixar = () => {
    if (!imagemBlob) return;
    baixarBlobComoArquivo(imagemBlob, nomeArquivo);
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95 duration-200">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-theme-main text-white flex items-center justify-center shadow-xs">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Cronograma Oficial Gerado
              </h3>
              <span className="text-[10px] text-slate-400">
                {totalContemplados > 0 && totalCotas > 0
                  ? `${totalContemplados} de ${totalCotas} cotas contempladas`
                  : "Pronto para download e compartilhamento no WhatsApp"}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Caixa de Orientação WhatsApp */}
        <div className="p-3.5 bg-emerald-50/80 border border-emerald-200/90 rounded-2xl space-y-1.5 text-xs">
          <div className="flex items-center gap-2 text-emerald-950 font-bold">
            <MessageCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Imagem em alta resolução gerada com sucesso!</span>
          </div>
          <p className="text-[11px] text-emerald-900/90 leading-relaxed">
            A imagem inclui todos os ciclos, datas de vencimento, valores de bolada e a sinalização de quem já foi contemplado.
          </p>
          <div className="pt-1 text-[11px] text-emerald-950 font-semibold flex items-center gap-1.5 flex-wrap">
            <span>👉 Como enviar:</span>
            <span className="bg-white px-2 py-0.5 rounded-md border border-emerald-200 shadow-2xs font-bold text-emerald-800">
              Clique em &ldquo;Abrir WhatsApp&rdquo; ou baixe o arquivo e anexe 📎 na conversa!
            </span>
          </div>
        </div>

        {/* Pré-visualização da Imagem */}
        <div className="max-h-72 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imagemUrl}
            alt="Pré-visualização do Cronograma Oficial"
            className="w-full rounded-xl shadow-xs"
          />
        </div>

        {/* Ações Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          <a
            href={urlWhatsApp}
            target="_blank"
            rel="noopener noreferrer"
            className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition active:scale-95"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Abrir Conversa no WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handleCopiarClipboard}
            className="py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
          >
            {copiadoFeedback ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span className="text-emerald-700 font-extrabold">✓ Imagem Copiada!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-500" />
                <span>Copiar Imagem (Ctrl+V)</span>
              </>
            )}
          </button>
        </div>

        {/* Rodapé com Download Direto */}
        <div className="flex justify-between items-center text-[10px] text-slate-400 px-1 pt-1 border-t border-slate-100">
          <span>Em produção com HTTPS, o WhatsApp permite compartilhamento direto nativo.</span>
          <button
            type="button"
            onClick={handleBaixar}
            className="text-theme-main font-bold hover:underline flex items-center gap-1 cursor-pointer py-1"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Baixar Imagem PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}
