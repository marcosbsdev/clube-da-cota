"use client";

import React, { useState } from "react";
import { createConsorcioAction } from "@/app/actions";
import { Check, Plus, Trash2, Users, AlertCircle, ArrowRight, ArrowLeft, TrendingUp, User } from "lucide-react";
import { calcularTotalArrecadacaoConsorcio, calcularValorCiclo, validarMinimoParticipantes } from "@/lib/finance";

interface CriarConsorcioWizardProps {
  currentUser: any;
  onConcluido: () => void;
}

export function CriarConsorcioWizard({ currentUser, onConcluido }: CriarConsorcioWizardProps) {
  const [etapa, setEtapa] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  // Etapa 1: Dados Básicos
  const [nome, setNome] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split("T")[0]);
  const [regras, setRegras] = useState("");
  const [dadosPagamento, setDadosPagamento] = useState("");

  // Etapa 2: Participantes e Cotas (inicia vazio; criador é opcional como participante)
  const [participantes, setParticipantes] = useState<any[]>([]);

  // Form temporário de novo participante
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novasCotas, setNovasCotas] = useState(1);
  const [isCompartilhada, setIsCompartilhada] = useState(false);
  const [parceiroNome, setParceiroNome] = useState("");
  const [parceiroEmail, setParceiroEmail] = useState("");

  // Etapa 3: Valores e Vencimento
  const [valorCota, setValorCota] = useState<number>(500);
  const [modeloContribuicao, setModeloContribuicao] = useState<"FIXO" | "ACRESCIMO_MENSAL">("FIXO");
  const [valorAcrescimo, setValorAcrescimo] = useState<number>(5);
  const [frequencia, setFrequencia] = useState<"MENSAL" | "QUINZENAL" | "SEMANAL">("MENSAL");
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState(
    new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  const totalCotas = participantes.reduce((acc, p) => acc + (p.cotasCount || 1), 0);
  const totalBolada = calcularTotalArrecadacaoConsorcio({
    valorCotaBase: valorCota,
    valorAcrescimo: modeloContribuicao === "ACRESCIMO_MENSAL" ? valorAcrescimo : 0,
    modeloContribuicao,
    totalCotas,
  });

  const handleAdicionarParticipante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim() || !novoEmail.trim()) return;

    if (isCompartilhada && (!parceiroNome.trim() || !parceiroEmail.trim())) {
      setErroMsg("Informe os dados do segundo participante para a cota compartilhada.");
      return;
    }

    setParticipantes([
      ...participantes,
      {
        nome: novoNome.trim(),
        email: novoEmail.trim(),
        cotasCount: novasCotas,
        isCompartilhada,
        fraçãoNome: isCompartilhada ? parceiroNome.trim() : undefined,
        fraçãoEmail: isCompartilhada ? parceiroEmail.trim() : undefined,
        valorFração1: isCompartilhada ? valorCota / 2 : undefined,
        valorFração2: isCompartilhada ? valorCota / 2 : undefined,
      },
    ]);

    // Limpa campos
    setNovoNome("");
    setNovoEmail("");
    setNovasCotas(1);
    setIsCompartilhada(false);
    setParceiroNome("");
    setParceiroEmail("");
    setErroMsg("");
  };

  const handleRemoverParticipante = (index: number) => {
    setParticipantes(participantes.filter((_, i) => i !== index));
  };

  const handleFinalizar = async () => {
    setLoading(true);
    setErroMsg("");

    const res = await createConsorcioAction({
      criadorId: currentUser.id,
      nome,
      finalidade,
      regras,
      chavePix: dadosPagamento,
      dadosBancarios: dadosPagamento,
      dataInicio,
      dataPrimeiroVencimento,
      frequencia,
      modeloContribuicao,
      valorCota,
      valorAcrescimo: modeloContribuicao === "ACRESCIMO_MENSAL" ? valorAcrescimo : 0,
      participantes,
    });

    setLoading(false);
    if (res.success) {
      onConcluido();
    } else {
      setErroMsg(res.error || "Ocorreu um erro ao criar o consórcio.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Indicador de Passos Responsivo */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
        {/* Visual de passos para Desktop */}
        <div className="hidden sm:grid grid-cols-4 gap-3 mb-4">
          {[
            { num: 1, title: "Dados Básicos" },
            { num: 2, title: "Participantes" },
            { num: 3, title: "Valores & Prazos" },
            { num: 4, title: "Revisão Final" },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-3 rounded-2xl border text-center transition ${
                etapa === s.num
                  ? "bg-theme-light border-theme-main text-theme-text font-bold shadow-sm"
                  : etapa > s.num
                  ? "bg-slate-50 border-slate-200 text-slate-700 font-semibold"
                  : "bg-white border-slate-200/60 text-slate-400 font-medium"
              }`}
            >
              <span className="text-[10px] block uppercase tracking-wider opacity-70">Passo {s.num}</span>
              <span className="text-xs truncate block font-bold">{s.title}</span>
            </div>
          ))}
        </div>

        {/* Visual de passos para Mobile */}
        <div className="flex sm:hidden items-center justify-between text-xs font-semibold text-slate-500 mb-2">
          <span className="text-theme-text font-bold">Passo {etapa} de 4</span>
          <span className="font-bold text-slate-700">
            {etapa === 1 && "Dados Básicos"}
            {etapa === 2 && "Participantes & Cotas"}
            {etapa === 3 && "Valores & Vencimentos"}
            {etapa === 4 && "Revisão Final"}
          </span>
        </div>
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-theme-main h-full rounded-full transition-all duration-300"
            style={{ width: `${(etapa / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {erroMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{erroMsg}</span>
        </div>
      )}

      {/* ETAPA 1: DADOS BÁSICOS */}
      {etapa === 1 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Informações Iniciais do Consórcio</h3>
            <p className="text-xs text-slate-500">Defina o nome do grupo, datas e instruções de pagamento.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Consórcio *</label>
              <input
                type="text"
                required
                placeholder="Ex: Consórcio Família Silva 2026"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Objetivo / Finalidade (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Reforma da casa, férias em grupo, etc."
                value={finalidade}
                onChange={(e) => setFinalidade(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Data Prevista de Início *</label>
              <input
                type="date"
                required
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Regras Combinadas (Opcional)</label>
              <input
                type="text"
                placeholder="Ex: Pagamentos até o dia 10 de cada mês pelo Pix..."
                value={regras}
                onChange={(e) => setRegras(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <span>💳</span> Dados para Receber os Pagamentos (Opcional)
            </label>
            <textarea
              rows={3}
              placeholder="Informe onde os participantes devem pagar (Ex: Chave Pix CPF: 123.456.789-00 ou Banco Itaú, Agência 1234, Conta 56789-0 - Titular: Marcos)"
              value={dadosPagamento}
              onChange={(e) => setDadosPagamento(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Campo livre para chave Pix, dados de conta bancária ou orientações para os participantes realizarem o pagamento.
            </p>
          </div>

          <button
            onClick={() => {
              if (!nome.trim()) {
                setErroMsg("O nome do consórcio é obrigatório.");
                return;
              }
              setErroMsg("");
              setEtapa(2);
            }}
            className="w-full mt-2 py-3.5 bg-theme-main hover:opacity-90 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target"
          >
            <span>Continuar para Participantes</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ETAPA 2: PARTICIPANTES E COTAS */}
      {etapa === 2 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Participantes e Cotas</h3>
            <p className="text-xs text-slate-500">
              Adicione cada membro. Cotas podem ser individuais ou compartilhadas entre 2 amigos.
            </p>
          </div>

          {/* Atalho opcional para o criador se incluir */}
          {!participantes.some((p) => p.email?.toLowerCase() === currentUser.email?.toLowerCase()) && (
            <button
              type="button"
              onClick={() => {
                setNovoNome(currentUser.name);
                setNovoEmail(currentUser.email);
              }}
              className="w-full py-2.5 px-3 bg-theme-light border border-theme-main/30 text-theme-text rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-theme-main/10 transition"
            >
              <User className="w-4 h-4" />
              <span>Eu também vou participar (Preencher meus dados no formulário)</span>
            </button>
          )}

          {/* Lista de Participantes já adicionados */}
          {participantes.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-500">
              Nenhum participante adicionado ainda. Preencha o formulário abaixo para incluir membros nas cotas (o criador é opcional).
            </div>
          ) : (
            <div className="space-y-2.5">
              {participantes.map((p, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">
                      {p.nome} {p.isCompartilhada ? `& ${p.fraçãoNome}` : ""}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {p.isCompartilhada
                        ? `${p.cotasCount || 1} cota(s) compartilhada (50% cada)`
                        : `${p.cotasCount} cota(s) individual`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverParticipante(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                    title="Remover participante"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Formulário para Adicionar Mais Participantes */}
          <form onSubmit={handleAdicionarParticipante} className="p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-3xl space-y-3.5">
            <h4 className="text-xs sm:text-sm font-bold text-slate-800">Adicionar Novo Participante</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Nome completo"
                value={novoNome}
                onChange={(e) => setNovoNome(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
              />
              <input
                type="email"
                placeholder="E-mail"
                value={novoEmail}
                onChange={(e) => setNovoEmail(e.target.value)}
                className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 font-semibold">Quantidade de Cotas:</label>
              <input
                type="number"
                min={1}
                max={50}
                value={novasCotas}
                onChange={(e) => setNovasCotas(Math.max(1, Number(e.target.value)))}
                className="w-20 p-2.5 rounded-xl border border-slate-200 text-xs text-center focus:outline-none font-bold bg-white"
              />
            </div>

            {/* Checkbox para Cota Compartilhada */}
            <div className="pt-2 border-t border-slate-200/60">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isCompartilhada}
                  onChange={(e) => setIsCompartilhada(e.target.checked)}
                  className="rounded text-theme-main focus:ring-0 w-4 h-4"
                />
                <span className="text-xs font-bold text-slate-700">
                  Esta é uma Cota Compartilhada (dividida com outra pessoa)
                </span>
              </label>

              {isCompartilhada && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-200">
                  <input
                    type="text"
                    placeholder="Nome do parceiro(a)"
                    value={parceiroNome}
                    onChange={(e) => setParceiroNome(e.target.value)}
                    className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                  />
                  <input
                    type="email"
                    placeholder="E-mail do parceiro"
                    value={parceiroEmail}
                    onChange={(e) => setParceiroEmail(e.target.value)}
                    className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Incluir Participante na Lista</span>
            </button>
          </form>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEtapa(1)}
              className="py-3 px-5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              onClick={() => {
                const validacao = validarMinimoParticipantes(participantes);
                if (!validacao.valido) {
                  setErroMsg(validacao.mensagem || "Um consórcio deve ter obrigatoriamente no mínimo 2 participantes.");
                  return;
                }
                setErroMsg("");
                setEtapa(3);
              }}
              className="flex-1 py-3.5 bg-theme-main text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition"
            >
              <span>Avançar para Valores</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 3: VALORES E VENCIMENTOS */}
      {etapa === 3 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Valores e Calendário</h3>
            <p className="text-xs text-slate-500">Defina o valor das parcelas, acréscimos e datas de vencimento.</p>
          </div>

          {/* Modelo de Contribuição: Fixo ou com Acréscimo Mensal */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Modelo de Valor das Cotas
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setModeloContribuicao("FIXO")}
                className={`p-4 rounded-2xl border text-xs font-bold text-left transition ${
                  modeloContribuicao === "FIXO"
                    ? "border-theme-main bg-theme-light text-theme-text shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <span className="text-sm">Valor Fixo</span>
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                  Valor constante e igual em todos os meses
                </span>
              </button>

              <button
                type="button"
                onClick={() => setModeloContribuicao("ACRESCIMO_MENSAL")}
                className={`p-4 rounded-2xl border text-xs font-bold text-left transition ${
                  modeloContribuicao === "ACRESCIMO_MENSAL"
                    ? "border-theme-main bg-theme-light text-theme-text shadow-sm"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-1.5 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>Com Acréscimo Progressivo</span>
                </div>
                <span className="block text-[11px] font-normal text-slate-500 mt-0.5">
                  Aumenta mês a mês (+ R$ definido)
                </span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {modeloContribuicao === "ACRESCIMO_MENSAL" ? "Valor Inicial da Cota (1º Mês) *" : "Valor por Cota (R$) *"}
              </label>
              <input
                type="number"
                min={10}
                step={10}
                value={valorCota}
                onChange={(e) => setValorCota(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900 focus:border-theme-main focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frequência das Contribuições</label>
              <select
                value={frequencia}
                onChange={(e: any) => setFrequencia(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none bg-white font-semibold"
              >
                <option value="MENSAL">Mensal (1 vez por mês)</option>
                <option value="QUINZENAL">Quinzenal (a cada 15 dias)</option>
                <option value="SEMANAL">Semanal (a cada 7 dias)</option>
              </select>
            </div>
          </div>

          {/* Campo e Simulação para Acréscimo Mensal */}
          {modeloContribuicao === "ACRESCIMO_MENSAL" && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-amber-900">
                  Acréscimo por Mês/Ciclo (R$) *
                </label>
                <span className="text-[10px] bg-amber-200 text-amber-900 font-bold px-2.5 py-0.5 rounded-full">
                  Ex: + R$ 5,00
                </span>
              </div>
              <input
                type="number"
                min={1}
                step={1}
                value={valorAcrescimo}
                onChange={(e) => setValorAcrescimo(Number(e.target.value))}
                className="w-full p-3 rounded-xl border border-amber-300 bg-white text-sm font-bold text-slate-900 focus:outline-none"
              />
              <div className="pt-2 text-xs text-amber-800 space-y-1 border-t border-amber-200/60">
                <p className="font-bold">Simulação de Parcelas por Cota:</p>
                <p className="opacity-90 leading-relaxed">
                  • 1º Mês: R$ {valorCota.toFixed(2)}<br />
                  • 2º Mês: R$ {(valorCota + valorAcrescimo).toFixed(2)} (+R$ {valorAcrescimo.toFixed(2)})<br />
                  • 3º Mês: R$ {(valorCota + valorAcrescimo * 2).toFixed(2)} (+R$ {(valorAcrescimo * 2).toFixed(2)})<br />
                  {totalCotas > 3 && (
                    <span>• Último Mês ({totalCotas}º): R$ {(valorCota + (totalCotas - 1) * valorAcrescimo).toFixed(2)}</span>
                  )}
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primeiro Vencimento *</label>
            <input
              type="date"
              required
              value={dataPrimeiroVencimento}
              onChange={(e) => setDataPrimeiroVencimento(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
            />
          </div>

          {/* Resumo Automático */}
          <div className="bg-theme-light p-4 rounded-2xl border border-theme-light space-y-1.5 text-xs sm:text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Total de Cotas:</span>
              <span className="font-bold text-slate-800">{totalCotas} cotas</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">
                {modeloContribuicao === "ACRESCIMO_MENSAL" ? "Bolada Acumulada Total:" : "Bolada Total a Arrecadar:"}
              </span>
              <span className="font-black text-theme-text text-base">R$ {totalBolada.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 font-medium">Duração Prevista:</span>
              <span className="font-bold text-slate-800">{totalCotas} {frequencia === "MENSAL" ? "meses" : "ciclos"}</span>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEtapa(2)}
              className="py-3 px-5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              onClick={() => {
                if (valorCota <= 0) {
                  setErroMsg("Informe um valor válido para a cota.");
                  return;
                }
                setErroMsg("");
                setEtapa(4);
              }}
              className="flex-1 py-3.5 bg-theme-main text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition"
            >
              <span>Revisão Final</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ETAPA 4: REVISÃO FINAL E ATIVAÇÃO */}
      {etapa === 4 && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
          <div>
            <h3 className="font-bold text-slate-900 text-base sm:text-lg">Revisão e Ativação</h3>
            <p className="text-xs text-slate-500">
              Confira as informações antes de ativar. Após a criação, o plano de parcelas será gerado automaticamente.
            </p>
          </div>

          <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 space-y-2.5 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Consórcio:</span>
              <span className="font-bold text-slate-900">{nome}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Modelo de Cobrança:</span>
              <span className="font-bold text-slate-900">
                {modeloContribuicao === "ACRESCIMO_MENSAL"
                  ? `Com Acréscimo (+ R$ ${valorAcrescimo.toFixed(2)}/ciclo)`
                  : "Valor Fixo"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">
                {modeloContribuicao === "ACRESCIMO_MENSAL" ? "Valor Inicial da Cota:" : "Valor da Cota:"}
              </span>
              <span className="font-bold text-slate-900">R$ {valorCota.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Bolada Prevista:</span>
              <span className="font-black text-theme-text text-base">R$ {totalBolada.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total de Cotas:</span>
              <span className="font-bold text-slate-900">{totalCotas} cota(s)</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total de Membros / Participantes:</span>
              <span className="font-bold text-slate-900">
                {participantes.reduce((acc, p) => acc + (p.isCompartilhada ? 2 : 1), 0)} pessoa(s)
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">1º Vencimento:</span>
              <span className="font-bold text-slate-900">
                {new Date(dataPrimeiroVencimento).toLocaleDateString("pt-BR")}
              </span>
            </div>
            {dadosPagamento && (
              <div className="flex justify-between">
                <span className="text-slate-500">Dados de Pagamento:</span>
                <span className="font-bold text-slate-900 text-right truncate max-w-[260px]">{dadosPagamento}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setEtapa(3)}
              disabled={loading}
              className="py-3 px-5 bg-slate-100 text-slate-700 font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-1.5 hover:bg-slate-200 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <button
              onClick={handleFinalizar}
              disabled={loading}
              className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition touch-target"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? "Criando e Gerando Parcelas..." : "Confirmar & Ativar Consórcio"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
