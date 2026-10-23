"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Upload, FileText, Check, ChevronRight, Calendar, Sparkles } from "lucide-react";
import { submitReceiptAction } from "@/app/actions";
import { formatarDataSegura, formatarMoedaBRL, calcularValorCiclo, formatarMesAnoCiclo } from "@/lib/finance";

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

  // Cotas que este usuário participa
  const minhasCotas = consorcio.cotas.filter((c: any) =>
    c.participantes.some((p: any) => p.usuarioId === currentUser.id || p.usuario?.id === currentUser.id)
  );

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

  // Ordenação de cotas para a Ordem de Contemplação & Sorteio
  const cotasOrdenadas = [...consorcio.cotas].sort(
    (a: any, b: any) => (a.ordemSorteio || a.numero) - (b.ordemSorteio || b.numero)
  );

  // Filtros de visualização para evitar telas excessivamente longas
  const parcelasPendentes = minhasContribuicoes.filter(
    (c: any) => c.status === "PENDENTE" || c.status === "EM_ATRASO"
  );
  const parcelasPagas = minhasContribuicoes.filter((c: any) => c.status === "PAGO");

  const [filtroParcelas, setFiltroParcelas] = useState<"PENDENTES" | "PAGAS" | "TODAS">(
    parcelasPendentes.length > 0 ? "PENDENTES" : "TODAS"
  );

  const parcelasFiltradas = minhasContribuicoes.filter((c: any) => {
    if (filtroParcelas === "PENDENTES") {
      return c.status === "PENDENTE" || c.status === "EM_ATRASO";
    }
    if (filtroParcelas === "PAGAS") {
      return c.status === "PAGO";
    }
    return true;
  });

  const [filtroContemplacao, setFiltroContemplacao] = useState<
    "TODAS" | "AGUARDANDO" | "CONTEMPLADAS" | "MINHA_COTA"
  >("TODAS");

  const cotasAguardando = cotasOrdenadas.filter((c: any) => c.status !== "CONTEMPLADA");
  const cotasContempladas = cotasOrdenadas.filter((c: any) => c.status === "CONTEMPLADA");
  const minhasCotasSorteio = cotasOrdenadas.filter((c: any) =>
    c.participantes.some((p: any) => p.usuarioId === currentUser.id || p.usuario?.id === currentUser.id)
  );

  const cotasExibidas = cotasOrdenadas.filter((c: any) => {
    if (filtroContemplacao === "AGUARDANDO") {
      return c.status !== "CONTEMPLADA";
    }
    if (filtroContemplacao === "CONTEMPLADAS") {
      return c.status === "CONTEMPLADA";
    }
    if (filtroContemplacao === "MINHA_COTA") {
      return c.participantes.some(
        (p: any) => p.usuarioId === currentUser.id || p.usuario?.id === currentUser.id
      );
    }
    return true;
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
    return formatarDataSegura(d);
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
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-3.5">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">
                Sua Participação
              </span>
              <span className="text-xs text-theme-text font-bold bg-theme-light px-2.5 py-0.5 rounded-full whitespace-nowrap">
                {minhasCotas.length} {minhasCotas.length === 1 ? "cota" : "cotas"} ({consorcio.totalCotas} no grupo)
              </span>
            </div>

            {consorcio.finalidade && (
              <p className="text-xs text-slate-500 italic pb-1 border-b border-slate-100">
                &ldquo;{consorcio.finalidade}&rdquo;
              </p>
            )}

            {/* Destaque Principal: Total Previsto da Cota */}
            <div className="bg-slate-50/90 rounded-2xl p-3.5 sm:p-4 border border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-slate-500 block uppercase tracking-wide">
                  Total Previsto
                </span>
                <p className="text-lg sm:text-2xl font-black text-slate-900 mt-0.5 whitespace-nowrap">
                  R$ {totalDevidoPessoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="text-[11px] font-bold text-theme-text bg-white px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs whitespace-nowrap">
                  {totalDevidoPessoal > 0 ? Math.round((totalPagoPessoal / totalDevidoPessoal) * 100) : 0}% quitado
                </span>
              </div>
            </div>

            {/* 2 Colunas Espaçosas: Já Pago e Falta Pagar (Sem quebras de linha!) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              <div className="bg-emerald-50/80 p-3 sm:p-3.5 rounded-2xl border border-emerald-100">
                <span className="text-[11px] sm:text-xs text-emerald-700 font-bold block whitespace-nowrap">
                  ✓ Já Pago
                </span>
                <p className="text-sm sm:text-lg font-black text-emerald-800 mt-1 whitespace-nowrap">
                  R$ {totalPagoPessoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-amber-50/80 p-3 sm:p-3.5 rounded-2xl border border-amber-100">
                <span className="text-[11px] sm:text-xs text-amber-800 font-bold block whitespace-nowrap">
                  ⏳ Falta Pagar
                </span>
                <p className="text-sm sm:text-lg font-black text-amber-900 mt-1 whitespace-nowrap">
                  R$ {totalFaltaPagarPessoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-900 uppercase tracking-wide whitespace-nowrap">
                      Próxima Parcela
                    </span>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap ${
                      proximaContribuicao.status === "EM_ATRASO"
                        ? "bg-rose-200 text-rose-900"
                        : "bg-amber-200 text-amber-900"
                    }`}>
                      {proximaContribuicao.status === "EM_ATRASO" ? "Vencida" : "Em aberto"}
                    </span>
                  </div>
                  <p className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5 whitespace-nowrap">
                    R$ {proximaContribuicao.valorPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-slate-600 font-medium whitespace-nowrap">
                    Vence em {formatarData(proximaContribuicao.dataVencimento)}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setContribuicaoSelecionada(proximaContribuicao);
                  setModalUploadAberto(true);
                }}
                className="w-full mt-4 py-3.5 px-4 bg-theme-main hover:opacity-95 active:scale-[0.99] text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target cursor-pointer"
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
          {/* Minhas Contribuições Detalhadas com Filtros Rápidos e Scroll Interno */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base">Minhas Parcelas</h4>
                <p className="text-xs text-slate-500">Histórico de todas as suas contribuições por ciclo</p>
              </div>

              {/* Filtros Rápidos de Status */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroParcelas("PENDENTES")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroParcelas === "PENDENTES"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Pendentes</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroParcelas === "PENDENTES"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {parcelasPendentes.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroParcelas("PAGAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroParcelas === "PAGAS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Pagas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroParcelas === "PAGAS"
                        ? "bg-emerald-100 text-emerald-900"
                        : "bg-slate-200 text-slate-600"
                    }`}
                  >
                    {parcelasPagas.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroParcelas("TODAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroParcelas === "TODAS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Todas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroParcelas === "TODAS"
                        ? "bg-slate-200 text-slate-800"
                        : "bg-slate-200/60 text-slate-500"
                    }`}
                  >
                    {minhasContribuicoes.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Container com Scroll Interno Elegante */}
            <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
              {parcelasFiltradas.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">
                    {filtroParcelas === "PENDENTES"
                      ? "🎉 Nenhuma parcela pendente ou em atraso!"
                      : filtroParcelas === "PAGAS"
                      ? "Nenhuma parcela paga até o momento."
                      : "Nenhuma parcela encontrada."}
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {filtroParcelas === "PENDENTES"
                      ? "Todas as suas contribuições estão em dia."
                      : "Alterne os filtros acima para ver outras parcelas."}
                  </p>
                </div>
              ) : (
                parcelasFiltradas.map((c: any) => (
                  <div
                    key={c.id}
                    className={`p-3.5 rounded-2xl border flex items-center justify-between transition shadow-2xs ${
                      c.status === "PAGO"
                        ? "bg-theme-light/40 border-theme-main/30"
                        : "bg-slate-50/80 hover:bg-slate-50 border-slate-200/70"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800">
                          Ciclo #{c.numeroCiclo} • Cota #{c.cota?.numero}
                        </span>
                        {c.comprovante && (
                          <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-semibold">
                            {c.comprovante.status === "PENDENTE"
                              ? "Comprovante em análise"
                              : "Comprovante aprovado"}
                          </span>
                        )}
                      </div>
                      <p className={`text-base font-black mt-1 ${c.status === "PAGO" ? "text-theme-text" : "text-slate-900"}`}>
                        {formatarMoedaBRL(c.valorPrevisto)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Vencimento: {formatarData(c.dataVencimento)}
                      </p>
                    </div>

                    <div>
                      {c.status === "PAGO" ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-theme-light text-theme-text border border-theme-main/30 shadow-2xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-theme-main" />
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
                ))
              )}
            </div>
          </div>

          {/* Ordem de Contemplação & Sorteio com Filtros e Scroll Interno */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>🎲</span> Ordem de Contemplação & Sorteio
                </h4>
                <p className="text-xs text-slate-500">
                  Sequência e calendário oficial de recebimento da bolada definido pelo grupo
                </p>
              </div>

              {/* Filtros Rápidos de Contemplação */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("TODAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "TODAS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Todas</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 font-extrabold">
                    {cotasOrdenadas.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("AGUARDANDO")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "AGUARDANDO"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Aguardando</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-900 font-extrabold">
                    {cotasAguardando.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("CONTEMPLADAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "CONTEMPLADAS"
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Contempladas</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-900 font-extrabold">
                    {cotasContempladas.length}
                  </span>
                </button>

                {minhasCotasSorteio.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setFiltroContemplacao("MINHA_COTA")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                      filtroContemplacao === "MINHA_COTA"
                        ? "bg-theme-main text-white shadow-2xs"
                        : "text-theme-text hover:bg-theme-light/40"
                    }`}
                  >
                    <span>Sua Cota</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                        filtroContemplacao === "MINHA_COTA"
                          ? "bg-white/30 text-white"
                          : "bg-theme-light text-theme-text"
                      }`}
                    >
                      {minhasCotasSorteio.length}
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Container com Scroll Interno Elegante */}
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {cotasExibidas.length === 0 ? (
                <div className="py-10 px-4 text-center rounded-2xl bg-slate-50 border border-slate-100 text-slate-400 space-y-1.5">
                  <p className="text-xs font-bold text-slate-700">Nenhuma cota encontrada neste filtro.</p>
                  <p className="text-[11px] text-slate-500">
                    Selecione &ldquo;Todas&rdquo; para visualizar todo o cronograma.
                  </p>
                </div>
              ) : (
                cotasExibidas.map((cota: any) => {
                  const cicloNum = cota.ordemSorteio || cota.numero;
                  const isMinha = cota.participantes.some((p: any) => p.usuarioId === currentUser.id);
                  const nomes = cota.participantes.map((p: any) => p.usuario.name).join(" & ");
                  const isContemplada = cota.status === "CONTEMPLADA";
                  const boladaDesteCiclo =
                    calcularValorCiclo(
                      cicloNum,
                      consorcio.valorCota,
                      consorcio.modeloContribuicao,
                      consorcio.valorAcrescimo
                    ) * consorcio.totalCotas;
                  const mesAnoCiclo = formatarMesAnoCiclo(consorcio, cicloNum);

                  return (
                    <div
                      key={cota.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isMinha
                          ? "bg-theme-light/40 border-theme-main/40 ring-1 ring-theme-main/20"
                          : "bg-slate-50/80 hover:bg-slate-50 border-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-2xs flex-shrink-0 ${
                            isContemplada || isMinha
                              ? "bg-theme-main text-white ring-2 ring-theme-main/20"
                              : "bg-white text-slate-700 border border-slate-200"
                          }`}
                        >
                          #{cicloNum}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p
                              className={`text-xs sm:text-sm font-bold truncate ${
                                isMinha ? "text-theme-text" : "text-slate-800"
                              }`}
                            >
                              {nomes}
                            </p>
                            {isMinha && (
                              <span className="text-[10px] bg-theme-main text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                                Sua Cota
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-0.5 font-medium">
                            <span>
                              Cota #{cota.numero}
                              {cota.isCompartilhada ? " (Compartilhada)" : ""}
                            </span>
                            <span>•</span>
                            <span>
                              Bolada:{" "}
                              <strong
                                className={
                                  isContemplada || isMinha ? "text-theme-text font-bold" : "text-slate-900 font-bold"
                                }
                              >
                                {formatarMoedaBRL(boladaDesteCiclo)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                        <div>
                          {isContemplada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-theme-main text-white shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                              <span>Contemplada</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-xl border border-slate-200 shadow-2xs inline-block">
                              Ciclo #{cicloNum}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          <Calendar className={`w-3.5 h-3.5 flex-shrink-0 ${isContemplada || isMinha ? "text-theme-main" : "text-slate-400"}`} />
                          <span>
                            {isContemplada ? "Contemplado em " : "Recebe em: "}
                            <strong className={isMinha ? "text-theme-text font-black" : "text-slate-900 font-bold"}>
                              {mesAnoCiclo}
                            </strong>
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Acompanhamento Coletivo Seguro com Altura Otimizada */}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[320px] overflow-y-auto pr-1">
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

      {/* Modal Informativo: Funcionalidade em Desenvolvimento */}
      {modalUploadAberto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-white rounded-t-[32px] sm:rounded-3xl p-6 pb-8 sm:pb-6 w-full sm:max-w-md shadow-2xl space-y-4 border-t sm:border border-slate-100 relative">
            {/* Puxador visual da gaveta no mobile */}
            <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto sm:hidden mb-2"></div>

            {/* Botão de Fechar no canto superior direito */}
            <button
              onClick={() => setModalUploadAberto(false)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition"
              title="Fechar"
            >
              ✕
            </button>

            {/* Cabeçalho Centralizado e Equilibrado */}
            <div className="text-center pt-1">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-3xl mx-auto shadow-xs mb-3">
                🚧
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug px-4">
                Funcionalidade em Desenvolvimento
              </h3>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block mt-1.5">
                Em breve disponível
              </span>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-2 text-xs text-slate-600 leading-relaxed text-left">
              <p>
                O envio e anexo direto de comprovantes via arquivo (JPG, PNG e PDF) está em fase de implementação final e estará disponível nas próximas versões.
              </p>
              <p className="font-semibold text-slate-800 pt-2 border-t border-slate-200/60">
                💡 Por enquanto, você pode realizar o pagamento utilizando a chave PIX do consórcio informada nesta tela e encaminhar o comprovante diretamente ao organizador do grupo.
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalUploadAberto(false)}
                className="w-full py-4 bg-slate-900 hover:bg-black text-white font-bold text-sm rounded-2xl shadow-md transition active:scale-[0.99] cursor-pointer"
              >
                Entendi, obrigado!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
