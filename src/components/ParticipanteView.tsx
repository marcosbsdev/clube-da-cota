"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, AlertCircle, Check, ChevronRight, Calendar, Sparkles, Copy, Zap, Share2, Download } from "lucide-react";
import { formatarDataSegura, formatarMoedaBRL, calcularValorCiclo, formatarMesAnoCiclo, calcularBoladaCiclo, getTipoChavePixLabel, calcularDataCiclo, determinarDestinatarioPixParcela } from "@/lib/finance";
import { ToastModal, ToastData } from "@/components/ToastModal";
import { ModalCronogramaPreview } from "@/components/ModalCronogramaPreview";
import {
  gerarImagemCronogramaCanvas,
  baixarBlobComoArquivo,
  compartilharCronogramaWhatsApp,
  DadosCronogramaExport,
  CicloExportItem,
} from "@/lib/exportCronogramaImage";

interface ParticipanteViewProps {
  consorcio: any;
  currentUser: any;
}

export function ParticipanteView({ consorcio, currentUser }: ParticipanteViewProps) {
  const [toast, setToast] = useState<ToastData | null>(null);
  const [pixCopiado, setPixCopiado] = useState(false);
  const [filtroParcelas, setFiltroParcelas] = useState<"PENDENTES" | "PAGAS" | "TODAS">("PENDENTES");
  const [filtroContemplacao, setFiltroContemplacao] = useState<
    "TODAS" | "AGUARDANDO" | "CONTEMPLADAS" | "MINHA_COTA"
  >("TODAS");

  // Estados para exportação de imagem do Cronograma Oficial
  const [modalCronogramaAberto, setModalCronogramaAberto] = useState(false);
  const [exportandoCronograma, setExportandoCronograma] = useState(false);
  const [previewCronogramaBlob, setPreviewCronogramaBlob] = useState<Blob | null>(null);
  const [previewCronogramaUrl, setPreviewCronogramaUrl] = useState<string | null>(null);
  const [previewCronogramaResultado, setPreviewCronogramaResultado] = useState<any>(null);

  const handleCopiarPix = (chave: string, nomeFavorecido?: string) => {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2500);
    setToast({
      titulo: "Chave PIX Copiada!",
      mensagem: nomeFavorecido
        ? `A chave Pix de ${nomeFavorecido} foi copiada para sua área de transferência. Cole no app do seu banco para pagar.`
        : "A chave Pix foi copiada para a área de transferência. Cole no app do seu banco para pagar.",
      tipo: "success",
    });
  };

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

  const parcelasFiltradas = minhasContribuicoes.filter((c: any) => {
    if (filtroParcelas === "PENDENTES") {
      return c.status === "PENDENTE" || c.status === "EM_ATRASO";
    }
    if (filtroParcelas === "PAGAS") {
      return c.status === "PAGO";
    }
    return true;
  });

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

  const handleExportarCronograma = async (modo: "whatsapp" | "download" | "visualizar") => {
    try {
      setExportandoCronograma(true);

      const ciclosMapeados: CicloExportItem[] = cotasOrdenadas.map((cota: any) => {
        const cicloNum = cota.ordemSorteio || cota.numero;
        const isContemplada = cota.status === "CONTEMPLADA";
        const nomes = cota.participantes.map((p: any) => p.usuario?.name || p.name).join(" & ");
        const participantePrincipal = cota.participantes?.[0]?.usuario;
        const temPixDireto = Boolean(
          participantePrincipal?.isActivated &&
          participantePrincipal?.receberPixDireto &&
          participantePrincipal?.chavePix
        );
        const { boladaTotal, boladaLiquida, cotaPropriaRetida } = calcularBoladaCiclo({
          numeroCiclo: cicloNum,
          valorBase: consorcio.valorCota,
          modelo: consorcio.modeloContribuicao,
          acrescimo: consorcio.valorAcrescimo,
          totalCotas: consorcio.totalCotas,
          temPixDireto,
        });
        const dataCiclo = calcularDataCiclo(consorcio, cicloNum);
        const rotuloCota = `Cota #${cota.numero}${cota.isCompartilhada ? " (Compartilhada)" : ""}`;

        return {
          numCiclo: cicloNum,
          dataVencimento: formatarDataSegura(dataCiclo),
          participanteNome: `${nomes} (${rotuloCota})`,
          // Conforme diretriz, a última coluna "Bolada Entregue" exibe sempre o valor total da bolada
          boladaFormatada: formatarMoedaBRL(boladaTotal),
          isPrimeiro: cicloNum === 1,
          isUltimo: cicloNum === consorcio.totalCotas,
          isContemplado: isContemplada,
          statusTexto: isContemplada ? "CONTEMPLADO" : "AGUARDANDO",
          cotaNumero: cota.numero,
          isCompartilhada: cota.isCompartilhada,
        };
      });

      const frequenciaTexto =
        consorcio.frequencia === "SEMANAL"
          ? `${consorcio.totalCotas} semanas`
          : consorcio.frequencia === "QUINZENAL"
          ? `${consorcio.totalCotas} quinzenas`
          : `${consorcio.totalCotas} meses`;

      const dadosExport: DadosCronogramaExport = {
        nomeConsorcio: consorcio.nome || "Consórcio Entre Amigos",
        totalCotas: consorcio.totalCotas,
        valorCotaFormatado: formatarMoedaBRL(consorcio.valorCota),
        valorTotalFormatado: formatarMoedaBRL(
          consorcio.valorTotalBolada || consorcio.valorCota * consorcio.totalCotas
        ),
        frequencia: frequenciaTexto,
        chavePix: consorcio.chavePix || "A definir",
        tipoChavePix: getTipoChavePixLabel(consorcio.tipoChavePix),
        organizadorNome: consorcio.criador?.name || "Organizador",
        totalContemplados: cotasContempladas.length,
        ciclos: ciclosMapeados,
      };

      const blob = await gerarImagemCronogramaCanvas(dadosExport);
      const url = URL.createObjectURL(blob);
      setPreviewCronogramaBlob(blob);
      setPreviewCronogramaUrl(url);

      const slug = (consorcio.nome || "consorcio")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "-");
      const nomeArquivo = `cronograma-${slug}.png`;

      if (modo === "download") {
        baixarBlobComoArquivo(blob, nomeArquivo);
        setToast({
          titulo: "Imagem Baixada com Sucesso!",
          mensagem: `O cronograma oficial "${nomeArquivo}" foi salvo no seu dispositivo com o status de contemplações atualizado.`,
          tipo: "success",
        });
        return;
      }

      const res = await compartilharCronogramaWhatsApp(dadosExport, blob);
      setPreviewCronogramaResultado(res);

      if (res.compartilhadoDireto) {
        setToast({
          titulo: "Cronograma Compartilhado!",
          mensagem: "A imagem do cronograma atualizado foi compartilhada com sucesso.",
          tipo: "success",
        });
      } else {
        setModalCronogramaAberto(true);
      }
    } catch (err: any) {
      console.error("Erro ao gerar cronograma:", err);
      setToast({
        titulo: "Erro ao Gerar Imagem",
        mensagem: "Não foi possível gerar a imagem do cronograma. Tente novamente.",
        tipo: "error",
      });
    } finally {
      setExportandoCronograma(false);
    }
  };

  const formatarData = (d: string) => {
    return formatarDataSegura(d);
  };

  return (
    <div className="space-y-6">
      {/* Toast Modal Flutuante com auto-dismiss */}
      <ToastModal toast={toast} onClose={() => setToast(null)} />

      {/* Banner de Consórcio Encerrado para o Participante */}
      {consorcio?.status === "ENCERRADO" && (
        <div className="bg-slate-900 text-white rounded-3xl p-4 sm:p-5 border border-slate-800 shadow-md flex items-center gap-3.5 animate-in fade-in">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0 text-xl font-bold">
            🔒
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-xs sm:text-sm text-white">
                Consórcio Encerrado (Modo Consulta)
              </h4>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.2 rounded-full uppercase">
                Arquivado
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Este consórcio foi finalizado pelo organizador. Todo o histórico de cotas, contemplações e pagamentos permanece disponível para sua consulta.
            </p>
          </div>
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

          {/* ======================================================== */}
          {/* ÁREA DE PAGAMENTO DA PARCELA VIA PIX (REPAGINADA)        */}
          {/* ======================================================== */}
          {(() => {
            // Determina as regras de negócio de resolução da Chave Pix (Contemplado com Pix Direto vs Consórcio Centralizado)
            const infoPix = determinarDestinatarioPixParcela({
              consorcio,
              proximaContribuicao,
              currentUserId: currentUser?.id,
            });

            const cicloAlvoPagamento = infoPix.cicloAlvo;
            const contempladoDesejaPixDireto = infoPix.contempladoDesejaPixDireto;
            const souEuOContempladoDesteCiclo = infoPix.souEuOContemplado;
            const chaveDestino = infoPix.chavePix;
            const tipoChaveDestino = infoPix.tipoChavePixLabel;
            const nomeDestinatario = infoPix.nomeDestinatario;
            const chaveConsorcio = consorcio.chavePix || consorcio.dadosBancarios || "";

            // Todas as pendências deste usuário
            const parcelasPendentesUsuario = minhasContribuicoes.filter(
              (c: any) => c.status === "PENDENTE" || c.status === "EM_ATRASO"
            );
            const valorTotalPendentePessoal = parcelasPendentesUsuario.reduce(
              (acc: number, c: any) => acc + c.valorPrevisto, 0
            );

            // Caso 1: Usuário NÃO possui nenhuma parcela pendente
            if (!proximaContribuicao) {
              return (
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-emerald-200/90 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs">
                      🎉
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                          Tudo em Dia!
                        </h4>
                        <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full uppercase">
                          Quitado
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Você não possui parcelas pendentes para pagamento no momento.
                      </p>
                    </div>
                  </div>

                  {chaveConsorcio && (
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Chave Pix do Consórcio:</span>
                        <span className="font-bold text-slate-700">{tipoChaveDestino}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={chaveConsorcio}
                          className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-xs font-mono font-bold py-2.5 px-3 rounded-xl focus:outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopiarPix(chaveConsorcio, nomeDestinatario)}
                          className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
                        >
                          {pixCopiado ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{pixCopiado ? "Copiado!" : "Copiar"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }

            // Caso 2: O próprio usuário logado é o Contemplado do ciclo E ativou o Pix Direto
            if (souEuOContempladoDesteCiclo && contempladoDesejaPixDireto) {
              return (
                <div className="bg-gradient-to-br from-emerald-50 via-teal-50/50 to-white rounded-3xl p-5 sm:p-6 border-2 border-emerald-300 shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl flex-shrink-0 shadow-sm">
                      🎉
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-emerald-800">
                          Ciclo #{cicloAlvoPagamento}
                        </span>
                        <span className="text-[11px] font-black bg-emerald-200 text-emerald-950 px-2.5 py-0.5 rounded-full">
                          Sua Contemplação
                        </span>
                      </div>
                      <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                        Você é o Contemplado do Mês!
                      </h4>
                    </div>
                  </div>

                  <div className="p-4 bg-white/95 rounded-2xl border border-emerald-200/80 space-y-3">
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      Neste ciclo você <strong>não realiza pagamento Pix</strong>. O valor da sua cota (R$ {proximaContribuicao.valorPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}) fica retido com você, e os demais participantes transferem as parcelas diretamente para sua chave Pix:
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-emerald-800 font-bold uppercase tracking-wide text-[10px]">
                          Sua Chave Pix ({tipoChaveDestino})
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                          Ativa para Recebimento
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={chaveDestino}
                          className="flex-1 bg-emerald-50/50 border border-emerald-300 text-emerald-950 text-xs font-mono font-bold py-3 px-3 rounded-xl focus:outline-none truncate"
                        />
                        <button
                          type="button"
                          onClick={() => handleCopiarPix(chaveDestino, "Sua Chave")}
                          className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm cursor-pointer shrink-0"
                        >
                          {pixCopiado ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              <span>Copiar Minha Chave</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            }

            // Caso 3: Usuário precisa realizar o pagamento da parcela
            // (Verifica se paga direto ao Contemplado ou ao Consórcio)
            const isAtrasado = proximaContribuicao.status === "EM_ATRASO";
            const isEncerrado = consorcio?.status === "ENCERRADO";

            return (
              <div className={`rounded-3xl p-5 sm:p-6 border-2 shadow-sm space-y-4 transition-all ${
                isAtrasado
                  ? "bg-rose-50/70 border-rose-300"
                  : contempladoDesejaPixDireto
                  ? "bg-gradient-to-b from-emerald-50/60 via-white to-white border-emerald-300"
                  : "bg-gradient-to-b from-amber-50/60 via-white to-white border-amber-300"
              }`}>
                {/* Cabeçalho da Próxima Parcela */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0 shadow-2xs border ${
                      isAtrasado
                        ? "bg-rose-100 border-rose-300 text-rose-800"
                        : "bg-amber-100 border-amber-300 text-amber-900"
                    }`}>
                      📅
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Próxima Parcela • Ciclo #{proximaContribuicao.numeroCiclo}
                        </span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5 tracking-tight">
                        R$ {proximaContribuicao.valorPrevisto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className={`text-xs font-semibold mt-0.5 ${isAtrasado ? "text-rose-700" : "text-slate-600"}`}>
                        Vence em {formatarData(proximaContribuicao.dataVencimento)}
                      </p>
                    </div>
                  </div>

                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs ${
                    isAtrasado
                      ? "bg-rose-200 text-rose-900"
                      : "bg-amber-200 text-amber-950"
                  }`}>
                    {isAtrasado ? "⚠️ Vencida" : "⏳ Em aberto"}
                  </span>
                </div>

                {/* Se o usuário possuir mais de 1 cota com parcela em aberto */}
                {parcelasPendentesUsuario.length > 1 && (
                  <div className="p-2.5 rounded-xl bg-slate-100/80 border border-slate-200/80 text-[11px] text-slate-600 flex items-center justify-between">
                    <span>Você possui <strong>{parcelasPendentesUsuario.length} parcelas</strong> em aberto:</span>
                    <strong className="text-slate-900 font-bold">
                      Total: R$ {valorTotalPendentePessoal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </strong>
                  </div>
                )}

                {/* Se consórcio estiver encerrado */}
                {isEncerrado ? (
                  <div className="p-3.5 rounded-2xl bg-slate-100 text-slate-700 text-xs text-center font-bold">
                    🔒 Consórcio encerrado (novos pagamentos bloqueados)
                  </div>
                ) : (
                  /* Divisor Visual & Bloco PIX */
                  <div className="border-t border-slate-200/80 pt-3.5 space-y-3">
                    {/* Identificação de Quem Recebe o Pix (Validação de Negócio) */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {contempladoDesejaPixDireto ? (
                          <>
                            <Zap className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                              Pix Direto ao Contemplado
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">💳</span>
                            <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                              Chave Pix do Consórcio
                            </span>
                          </>
                        )}
                      </div>

                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${
                        contempladoDesejaPixDireto
                          ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                          : "bg-slate-100 text-slate-700 border-slate-300"
                      }`}>
                        {contempladoDesejaPixDireto ? "Direto na Conta" : "Centralizado"}
                      </span>
                    </div>

                    {/* Detalhes do Destinatário & Tipo de Chave */}
                    <div className={`p-3.5 rounded-2xl border space-y-2.5 ${
                      contempladoDesejaPixDireto
                        ? "bg-emerald-50/50 border-emerald-200"
                        : "bg-slate-50/80 border-slate-200"
                    }`}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Favorecido:</span>
                        <strong className="text-slate-900 font-bold truncate max-w-[200px] text-right">
                          {nomeDestinatario}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 font-medium">Tipo de Chave:</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          contempladoDesejaPixDireto
                            ? "bg-emerald-200/70 text-emerald-900"
                            : "bg-slate-200 text-slate-800"
                        }`}>
                          {tipoChaveDestino}
                        </span>
                      </div>

                      {/* Campo da Chave Pix em Destaque */}
                      <div className="space-y-1.5 pt-1">
                        <label className="text-[10px] uppercase font-bold text-slate-500 block tracking-wider">
                          Chave Pix para Transferência
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value={chaveDestino || "Não cadastrada"}
                            className={`flex-1 border text-xs font-mono font-bold py-3 px-3.5 rounded-xl focus:outline-none truncate shadow-2xs ${
                              contempladoDesejaPixDireto
                                ? "bg-white border-emerald-300 text-emerald-950"
                                : "bg-white border-slate-300 text-slate-900"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => handleCopiarPix(chaveDestino, nomeDestinatario)}
                            disabled={!chaveDestino}
                            className={`p-3 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 border shadow-2xs active:scale-95 ${
                              pixCopiado
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-slate-300 text-slate-700 hover:bg-slate-100"
                            }`}
                            title="Copiar Chave Pix"
                          >
                            {pixCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      {/* Botão de Ação Primária em Destaque Máximo */}
                      <button
                        type="button"
                        onClick={() => handleCopiarPix(chaveDestino, nomeDestinatario)}
                        disabled={!chaveDestino}
                        className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer touch-target ${
                          pixCopiado
                            ? "bg-emerald-600 text-white shadow-emerald-200"
                            : contempladoDesejaPixDireto
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
                            : "bg-theme-main hover:opacity-95 text-white"
                        }`}
                      >
                        {pixCopiado ? (
                          <>
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            <span>✓ Chave PIX Copiada com Sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                            <span>
                              {contempladoDesejaPixDireto
                                ? "Copiar Chave PIX do Contemplado"
                                : "Copiar Chave PIX do Consórcio"}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Mensagem Explicativa Amigável */}
                      <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                        {contempladoDesejaPixDireto ? (
                          <span>💡 {infoPix.mensagemContextual}</span>
                        ) : (
                          <span>ℹ️ {infoPix.mensagemContextual}</span>
                        )}
                      </p>

                      {/* Regras do consórcio (se houver) */}
                      {consorcio.regras && (
                        <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                          <p className="whitespace-pre-line leading-relaxed italic">
                            <strong>Regras:</strong> {consorcio.regras}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
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

          {/* Ordem de Contemplação & Sorteio com Filtros, Botão de Exportação e Scroll Interno */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <span>🎲</span> Ordem de Contemplação & Sorteio
                </h4>
                <p className="text-xs text-slate-500">
                  Sequência e calendário oficial de recebimento da bolada definido pelo grupo
                </p>
              </div>

              {/* Botões de Compartilhamento e Download da Imagem do Cronograma */}
              <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => handleExportarCronograma("whatsapp")}
                  disabled={exportandoCronograma}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer disabled:opacity-50"
                  title="Compartilhar imagem do cronograma oficial no WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                  <span>{exportandoCronograma ? "Gerando..." : "Compartilhar Imagem"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportarCronograma("download")}
                  disabled={exportandoCronograma}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 border border-slate-200/80 shadow-2xs"
                  title="Baixar imagem em PNG de alta resolução"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Baixar Imagem</span>
                  <span className="sm:hidden">Baixar</span>
                </button>
              </div>
            </div>

            {/* Barra de Progresso de Contemplações e Filtros Rápidos */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl p-2.5 sm:px-3.5">
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="font-bold text-slate-700">Contemplações:</span>
                <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-lg text-[11px]">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  {cotasContempladas.length} de {consorcio.totalCotas} contemplados
                </span>
                {cotasAguardando.length > 0 && (
                  <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                    • {cotasAguardando.length} aguardando bolada
                  </span>
                )}
              </div>

              {/* Filtros Rápidos de Contemplação */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/60 shadow-2xs self-start sm:self-auto flex-wrap">
                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("TODAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "TODAS"
                      ? "bg-slate-900 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Todas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroContemplacao === "TODAS"
                        ? "bg-white/20 text-white"
                        : "bg-slate-200 text-slate-700"
                    }`}
                  >
                    {cotasOrdenadas.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("AGUARDANDO")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "AGUARDANDO"
                      ? "bg-amber-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Aguardando</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroContemplacao === "AGUARDANDO"
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {cotasAguardando.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setFiltroContemplacao("CONTEMPLADAS")}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    filtroContemplacao === "CONTEMPLADAS"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <span>Contempladas</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                      filtroContemplacao === "CONTEMPLADAS"
                        ? "bg-white/20 text-white"
                        : "bg-emerald-100 text-emerald-900"
                    }`}
                  >
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
                  const participantePrincipal = cota.participantes?.[0]?.usuario;
                  const temPixDireto = Boolean(
                    participantePrincipal?.isActivated &&
                    participantePrincipal?.receberPixDireto &&
                    participantePrincipal?.chavePix
                  );
                  const {
                    valorCotaNoCiclo,
                    boladaTotal,
                    boladaLiquida,
                    cotaPropriaRetida,
                  } = calcularBoladaCiclo({
                    numeroCiclo: cicloNum,
                    valorBase: consorcio.valorCota,
                    modelo: consorcio.modeloContribuicao,
                    acrescimo: consorcio.valorAcrescimo,
                    totalCotas: consorcio.totalCotas,
                    temPixDireto,
                  });
                  const mesAnoCiclo = formatarMesAnoCiclo(consorcio, cicloNum);

                  return (
                    <div
                      key={cota.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                        isContemplada
                          ? "bg-emerald-50/60 border-emerald-200/80 ring-1 ring-emerald-500/20"
                          : isMinha
                          ? "bg-theme-light/40 border-theme-main/40 ring-1 ring-theme-main/20"
                          : "bg-slate-50/80 hover:bg-slate-50 border-slate-200/70"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-2xs flex-shrink-0 ${
                            isContemplada
                              ? "bg-emerald-600 text-white ring-2 ring-emerald-400/30"
                              : isMinha
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
                                isContemplada
                                  ? "text-emerald-950 font-extrabold"
                                  : isMinha
                                  ? "text-theme-text"
                                  : "text-slate-800"
                              }`}
                            >
                              {nomes}
                            </p>
                            {isContemplada && (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 font-extrabold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-2xs">
                                <Sparkles className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Já Contemplado</span>
                              </span>
                            )}
                            {isMinha && (
                              <span className="text-[10px] bg-theme-main text-white font-extrabold px-2 py-0.5 rounded-full shadow-2xs">
                                Sua Cota
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-slate-500 mt-0.5 font-medium">
                            <span>
                              Cota #{cota.numero}
                              {cota.isCompartilhada ? " (Compartilhada)" : " (Individual)"}
                            </span>
                            <span>•</span>
                            {temPixDireto ? (
                              <span className="inline-flex items-center gap-1.5 flex-wrap">
                                <span>
                                  Bolada Total:{" "}
                                  <strong
                                    className={
                                      isContemplada
                                        ? "text-emerald-800 font-black"
                                        : isMinha
                                        ? "text-theme-text font-black"
                                        : "text-emerald-700 font-bold"
                                    }
                                  >
                                    {formatarMoedaBRL(boladaTotal)}
                                  </strong>
                                </span>
                                <span className="text-[10px] text-slate-500 hidden sm:inline">
                                  (Líquida: {formatarMoedaBRL(boladaLiquida)}, retém cota de {formatarMoedaBRL(cotaPropriaRetida)})
                                </span>
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 py-0.2 rounded font-bold">
                                  Pix Direto
                                </span>
                              </span>
                            ) : (
                              <span>
                                Bolada:{" "}
                                <strong
                                  className={
                                    isContemplada
                                      ? "text-emerald-800 font-black"
                                      : isMinha
                                      ? "text-theme-text font-bold"
                                      : "text-slate-900 font-bold"
                                  }
                                >
                                  {formatarMoedaBRL(boladaTotal)}
                                </strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 flex-shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/60">
                        <div>
                          {isContemplada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-600 text-white shadow-2xs">
                              <Sparkles className="w-3 h-3 text-amber-300 fill-amber-300" />
                              <span>Contemplada</span>
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-slate-700 bg-white px-2.5 py-0.5 rounded-xl border border-slate-200 shadow-2xs inline-block">
                              Ciclo #{cicloNum} • Aguardando
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                          <Calendar
                            className={`w-3.5 h-3.5 flex-shrink-0 ${
                              isContemplada
                                ? "text-emerald-600"
                                : isMinha
                                ? "text-theme-main"
                                : "text-slate-400"
                            }`}
                          />
                          <span>
                            {isContemplada ? "Contemplado em " : "Recebe em: "}
                            <strong
                              className={
                                isContemplada
                                  ? "text-emerald-900 font-black"
                                  : isMinha
                                  ? "text-theme-text font-black"
                                  : "text-slate-900 font-bold"
                              }
                            >
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

      {/* Modal de Pré-visualização e Envio do Cronograma Oficial */}
      <ModalCronogramaPreview
        aberto={modalCronogramaAberto}
        onClose={() => setModalCronogramaAberto(false)}
        imagemUrl={previewCronogramaUrl}
        imagemBlob={previewCronogramaBlob}
        resultado={previewCronogramaResultado}
        nomeConsorcio={consorcio.nome}
        totalContemplados={cotasContempladas.length}
        totalCotas={consorcio.totalCotas}
      />
    </div>
  );
}
