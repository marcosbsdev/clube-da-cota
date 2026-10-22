"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Upload, FileText, Check, ChevronRight } from "lucide-react";
import { submitReceiptAction } from "@/app/actions";

interface ParticipanteViewProps {
  consorcio: any;
  currentUser: any;
}

export function ParticipanteView({ consorcio, currentUser }: ParticipanteViewProps) {
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [contribuicaoSelecionada, setContribuicaoSelecionada] = useState<any>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [sucessoMsg, setSucessoMsg] = useState("");

  if (!consorcio) {
    return (
      <div className="bg-white rounded-2xl p-6 text-center border border-slate-200">
        <p className="text-slate-600 font-medium">Você ainda não está participando de nenhum consórcio ativo.</p>
      </div>
    );
  }

  // Contribuições deste usuário
  const minhasContribuicoes = consorcio.contribuicoes.filter(
    (c: any) => c.usuarioId === currentUser.id
  );

  // Calcula valores pessoais do participante
  const totalDevidoPessoal = minhasContribuicoes.reduce((acc: number, c: any) => acc + c.valorPrevisto, 0);
  const totalPagoPessoal = minhasContribuicoes
    .filter((c: any) => c.status === "PAGO")
    .reduce((acc: number, c: any) => acc + c.valorPrevisto, 0);
  const totalFaltaPagarPessoal = totalDevidoPessoal - totalPagoPessoal;

  // Próxima contribuição a vencer (não paga)
  const proximaContribuicao = minhasContribuicoes.find(
    (c: any) => c.status === "PENDENTE" || c.status === "EM_ATRASO"
  );

  // Lista coletiva consolidada por cota (página 77 do PDF)
  // Para cota compartilhada, exibe os nomes dos participantes vinculados e 1 única situação
  const statusPorCota = consorcio.cotas.map((cota: any) => {
    const nomes = cota.participantes.map((p: any) => p.usuario.name).join(" & ");
    // Verifica contribuições do ciclo atual (ciclo 1) para esta cota
    const contribsCota = consorcio.contribuicoes.filter((c: any) => c.cotaId === cota.id && c.numeroCiclo === 1);
    
    // Se todas pagas -> PAGO. Se alguma em atraso -> EM_ATRASO. Senão PENDENTE.
    let statusGeral = "PAGO";
    if (contribsCota.some((c: any) => c.status === "EM_ATRASO")) {
      statusGeral = "EM_ATRASO";
    } else if (contribsCota.some((c: any) => c.status === "PENDENTE")) {
      statusGeral = "PENDENTE";
    }

    return {
      cotaNumero: cota.numero,
      nomes,
      isCompartilhada: cota.isCompartilhada,
      status: statusGeral,
    };
  });

  const handleEnviarComprovante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribuicaoSelecionada || !nomeArquivo) return;

    await submitReceiptAction(contribuicaoSelecionada.id, currentUser.id, nomeArquivo);
    setSucessoMsg("Comprovante enviado com sucesso para conferência do criador!");
    setTimeout(() => {
      setSucessoMsg("");
      setModalUploadAberto(false);
    }, 2000);
  };

  const formatarData = (d: string) => {
    return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  return (
    <div className="space-y-6">
      {/* Alerta de confirmação */}
      {sucessoMsg && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{sucessoMsg}</span>
        </div>
      )}

      {/* Grid Responsivo: Esquerda (Meu Status & Pagamentos) e Direita (Parcelas & Acompanhamento) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Visão Geral, Próximo Vencimento & Chave Pix */}
        <div className="lg:col-span-5 space-y-6">
          {/* Resumo Financeiro Pessoal */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Resumo da Sua Participação
              </span>
              <span className="text-xs text-theme-text font-bold bg-theme-light px-2.5 py-0.5 rounded-full">
                {consorcio.totalCotas} cotas no grupo
              </span>
            </div>

            {consorcio.finalidade && (
              <p className="text-xs text-slate-500 italic pb-1 border-b border-slate-100">
                &ldquo;{consorcio.finalidade}&rdquo;
              </p>
            )}

            <div className="grid grid-cols-3 gap-2.5 text-center pt-1">
              <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold block">Total Previsto</span>
                <p className="text-sm sm:text-base font-black text-slate-900 mt-0.5">
                  R$ {totalDevidoPessoal.toFixed(2)}
                </p>
              </div>
              <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100">
                <span className="text-[11px] text-emerald-700 font-semibold block">Já Pago</span>
                <p className="text-sm sm:text-base font-black text-emerald-800 mt-0.5">
                  R$ {totalPagoPessoal.toFixed(2)}
                </p>
              </div>
              <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100">
                <span className="text-[11px] text-amber-800 font-semibold block">Falta Pagar</span>
                <p className="text-sm sm:text-base font-black text-amber-900 mt-0.5">
                  R$ {totalFaltaPagarPessoal.toFixed(2)}
                </p>
              </div>
            </div>
          </div>

          {/* Próximo Vencimento & Envio de Comprovante */}
          {proximaContribuicao && (
            <div className="bg-amber-50/90 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                  📅
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">
                      Próxima Parcela
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      proximaContribuicao.status === "EM_ATRASO"
                        ? "bg-rose-200 text-rose-900"
                        : "bg-amber-200 text-amber-900"
                    }`}>
                      {proximaContribuicao.status === "EM_ATRASO" ? "Vencida" : "Em aberto"}
                    </span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 mt-0.5">
                    R$ {proximaContribuicao.valorPrevisto.toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 font-medium">
                    Vence em {formatarData(proximaContribuicao.dataVencimento)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setContribuicaoSelecionada(proximaContribuicao);
                  setModalUploadAberto(true);
                }}
                className="w-full mt-4 py-3.5 px-4 bg-theme-main hover:opacity-95 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target"
              >
                <Upload className="w-5 h-5" />
                <span>Enviar Comprovante PIX</span>
              </button>
            </div>
          )}

          {/* Dados para Pagamento do Consórcio (conforme página 21 do PDF) */}
          {(consorcio.dadosBancarios || consorcio.chavePix) && (
            <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wide mb-2.5 flex items-center gap-2">
                <span>💳</span> Dados para Realizar o Pagamento
              </h4>
              <div className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200/70 text-xs">
                <p className="font-semibold text-slate-800 whitespace-pre-line leading-relaxed">
                  {consorcio.dadosBancarios || consorcio.chavePix}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Minhas Parcelas & Acompanhamento Coletivo */}
        <div className="lg:col-span-7 space-y-6">
          {/* Minhas Contribuições Detalhadas */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Minhas Parcelas</h4>
                <p className="text-xs text-slate-500">Histórico de todas as suas contribuições por ciclo</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
                {minhasContribuicoes.length} parcelas
              </span>
            </div>

            <div className="space-y-2.5">
              {minhasContribuicoes.map((c: any) => (
                <div key={c.id} className="p-3.5 bg-slate-50/80 hover:bg-slate-50 rounded-2xl border border-slate-200/70 flex items-center justify-between transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-800">
                        Ciclo #{c.numeroCiclo} • Cota #{c.cota?.numero}
                      </span>
                      {c.comprovante && (
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                          {c.comprovante.status === "PENDENTE" ? "Comprovante em análise" : "Comprovante aprovado"}
                        </span>
                      )}
                    </div>
                    <p className="text-base font-black text-slate-900 mt-1">
                      R$ {c.valorPrevisto.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Vencimento: {formatarData(c.dataVencimento)}
                    </p>
                  </div>

                  <div>
                    {c.status === "PAGO" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pago
                      </span>
                    ) : c.status === "EM_ATRASO" ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Em atraso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3.5 h-3.5" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Acompanhamento Coletivo Seguro (Páginas 76 e 77 do PDF: apenas nome e status, SEM valores de terceiros) */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>👥</span> Acompanhamento do Mês
                </h4>
                <p className="text-xs text-slate-500">Visão do grupo com preservação de sigilo financeiro individual</p>
              </div>
              <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">Ciclo 1</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {statusPorCota.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/80 rounded-2xl border border-slate-100">
                  <div>
                    <p className="text-xs sm:text-sm font-bold text-slate-800">{item.nomes}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Cota #{item.cotaNumero} {item.isCompartilhada ? "(Compartilhada)" : ""}
                    </p>
                  </div>

                  <div>
                    {item.status === "PAGO" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        Pago
                      </span>
                    ) : item.status === "EM_ATRASO" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                        <AlertCircle className="w-3 h-3" />
                        Atraso
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                        <Clock className="w-3 h-3" />
                        Pendente
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Upload de Comprovante */}
      {modalUploadAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-5 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-slate-900">Anexar Comprovante PIX</h3>
              <button
                onClick={() => setModalUploadAberto(false)}
                className="text-slate-400 hover:text-slate-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Formatos aceitos: JPG, PNG ou PDF (até 5MB). O envio não confirma o pagamento automaticamente: o criador irá conferir.
            </p>

            <form onSubmit={handleEnviarComprovante} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Arquivo / Identificador</label>
                <input
                  type="text"
                  placeholder="Ex: comprovante_pix_250.pdf"
                  value={nomeArquivo}
                  onChange={(e) => setNomeArquivo(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
                />
              </div>

              <div className="p-4 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50">
                <FileText className="w-8 h-8 text-slate-400 mx-auto mb-1" />
                <span className="text-xs text-slate-600 font-medium block">Toque para selecionar imagem ou PDF</span>
                <span className="text-[10px] text-slate-400">Simulação de upload instantâneo</span>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalUploadAberto(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-theme-main text-white font-bold text-xs rounded-xl shadow-md hover:opacity-90 transition"
                >
                  Enviar Arquivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
