"use client";

import React, { useState } from "react";
import { createConsorcioAction } from "@/app/actions";
import { Check, Plus, Trash2, Users, AlertCircle, ArrowRight, ArrowLeft, TrendingUp, User } from "lucide-react";
import {
  calcularTotalArrecadacaoConsorcio,
  calcularValorCiclo,
  validarMinimoParticipantes,
  formatarMoedaBRL,
  parseMoedaBRL,
  calcularResumoFinanceiroConsorcio,
  formatarDataSegura,
} from "@/lib/finance";

interface CriarConsorcioWizardProps {
  currentUser: any;
  onConcluido: () => void;
}

export function CriarConsorcioWizard({ currentUser, onConcluido }: CriarConsorcioWizardProps) {
  const [etapa, setEtapa] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  // Etapa 1: Dados Básicos
  const dataHojePadrao = new Date().toISOString().split("T")[0];
  const [nome, setNome] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [dataInicio, setDataInicio] = useState(dataHojePadrao);
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
  const [dataPrimeiroVencimento, setDataPrimeiroVencimento] = useState(dataHojePadrao);
  const [vencimentoAlteradoManualmente, setVencimentoAlteradoManualmente] = useState(false);

  const handleDataInicioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDataInicio(val);
    // Se o usuário ainda não alterou manualmente o vencimento no Passo 3, sincroniza automaticamente
    if (!vencimentoAlteradoManualmente) {
      setDataPrimeiroVencimento(val);
    }
  };

  const handleDataVencimentoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDataPrimeiroVencimento(e.target.value);
    setVencimentoAlteradoManualmente(true);
  };

  const totalCotas = participantes.reduce((acc, p) => acc + (p.cotasCount || 1), 0);
  const totalMembros = participantes.reduce((acc, p) => acc + (p.isCompartilhada ? 2 : 1), 0);
  const resumoFinanceiro = calcularResumoFinanceiroConsorcio({
    valorCotaBase: valorCota,
    valorAcrescimo: modeloContribuicao === "ACRESCIMO_MENSAL" ? valorAcrescimo : 0,
    modeloContribuicao,
    totalCotas,
  });
  const totalBolada = resumoFinanceiro.volumeTotalMovimentado;

  const handleValorCotaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseMoedaBRL(e.target.value);
    setValorCota(numeric);
  };

  const handleValorAcrescimoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const numeric = parseMoedaBRL(e.target.value);
    setValorAcrescimo(numeric);
  };

  const handlePasteMoney = (e: React.ClipboardEvent<HTMLInputElement>, setter: (val: number) => void) => {
    e.preventDefault();
    const text = e.clipboardData.getData("text").trim();
    if (!text) return;
    if (text.includes(",")) {
      const clean = text.replace(/\./g, "").replace(",", ".").replace(/[^\d.]/g, "");
      const val = parseFloat(clean);
      if (!isNaN(val)) setter(val);
    } else {
      const clean = text.replace(/[^\d.]/g, "");
      const val = parseFloat(clean);
      if (!isNaN(val)) setter(val);
    }
  };

  const handleAdicionarParticipante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      setErroMsg("Informe o nome do participante.");
      return;
    }

    if (isCompartilhada && !parceiroNome.trim()) {
      setErroMsg("Informe o nome do segundo participante para a cota compartilhada.");
      return;
    }

    setParticipantes([
      ...participantes,
      {
        nome: novoNome.trim(),
        email: novoEmail.trim() || undefined,
        cotasCount: novasCotas,
        isCompartilhada,
        fraçãoNome: isCompartilhada ? parceiroNome.trim() : undefined,
        fraçãoEmail: isCompartilhada ? (parceiroEmail.trim() || undefined) : undefined,
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
                onChange={handleDataInicioChange}
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
              placeholder="Informe sua Chave Pix (Ex: CPF, celular, e-mail ou chave aleatória)"
              value={dadosPagamento}
              onChange={(e) => setDadosPagamento(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
            />
            <p className="text-[11px] text-slate-400">
              Informe a chave Pix para que os participantes possam copiar e realizar o pagamento das parcelas.
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

          {/* Card de Contagem de Cotas Criadas em Tempo Real (Integrado ao Tema do Usuário) */}
          <div className="p-4 sm:p-5 bg-gradient-to-br from-theme-dark to-theme-main text-white rounded-3xl shadow-sm border border-theme-dark/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-white/15 text-white border border-white/20 flex items-center justify-center text-xl flex-shrink-0 shadow-inner">
                🎯
              </div>
              <div>
                <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest block">
                  Total de Cotas do Consórcio
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    {totalCotas}
                  </span>
                  <span className="text-xs font-bold text-white/90">
                    {totalCotas === 1 ? "cota criada" : "cotas criadas"}
                  </span>
                  {totalCotas > 0 && (
                    <span className="text-[11px] text-white/75 font-medium hidden sm:inline">
                      • {totalCotas} {totalCotas === 1 ? "ciclo / mês" : "ciclos / meses"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:border-l sm:border-white/20 sm:pl-5 self-start sm:self-auto">
              <div className="bg-white/15 px-3.5 py-1.5 rounded-xl border border-white/20 text-center min-w-[75px]">
                <span className="text-[10px] text-white/80 font-bold uppercase block">Pessoas</span>
                <span className="text-sm font-black text-white">{totalMembros}</span>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1 ${
                  totalMembros >= 2
                    ? "bg-emerald-500/30 border-emerald-300/50 text-white"
                    : "bg-amber-400/30 border-amber-300/50 text-white"
                }`}
              >
                {totalMembros >= 2 ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Mínimo OK</span>
                  </>
                ) : (
                  <span>Mínimo 2</span>
                )}
              </div>
            </div>
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

          {/* Cabeçalho da Lista de Participantes */}
          {participantes.length > 0 && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Membros Adicionados ({participantes.length})
              </span>
              <span className="text-xs font-black text-theme-text bg-theme-light px-2.5 py-1 rounded-xl">
                Soma: {totalCotas} {totalCotas === 1 ? "cota" : "cotas"}
              </span>
            </div>
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
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[11px] text-slate-500">
                        {p.email ? p.email : "Sem e-mail cadastrado"}
                        {p.isCompartilhada && p.fraçãoEmail ? ` / ${p.fraçãoEmail}` : ""}
                      </span>
                      <span className="text-[10px] font-bold text-theme-text bg-theme-light border border-theme-main/20 px-2 py-0.5 rounded-md">
                        {p.isCompartilhada
                          ? `${p.cotasCount || 1} cota(s) compartilhada (50% cada)`
                          : `${p.cotasCount} cota(s) individual`}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoverParticipante(idx)}
                    className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
              <div>
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white font-medium"
                />
              </div>
              <div>
                <input
                  type="email"
                  placeholder="E-mail (opcional)"
                  value={novoEmail}
                  onChange={(e) => setNovoEmail(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic mt-0.5">
              💡 O e-mail é opcional (necessário apenas se o participante for acessar o sistema para acompanhar suas parcelas).
            </p>

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
                  className="rounded text-theme-main focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-slate-700">
                  Esta é uma Cota Compartilhada (dividida com outra pessoa)
                </span>
              </label>

              {isCompartilhada && (
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Nome do parceiro(a) *"
                      value={parceiroNome}
                      onChange={(e) => setParceiroNome(e.target.value)}
                      className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white font-medium"
                    />
                    <input
                      type="email"
                      placeholder="E-mail do parceiro (opcional)"
                      value={parceiroEmail}
                      onChange={(e) => setParceiroEmail(e.target.value)}
                      className="p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                    />
                  </div>
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
                type="text"
                inputMode="numeric"
                value={formatarMoedaBRL(valorCota)}
                onChange={handleValorCotaChange}
                onPaste={(e) => handlePasteMoney(e, setValorCota)}
                className="w-full p-3 rounded-xl border border-slate-200 text-base font-black text-slate-900 focus:border-theme-main focus:outline-none bg-white shadow-2xs"
              />
              <p className="text-[11px] text-slate-400 mt-1">Ex: R$ 100,00 ou R$ 1.200,00</p>
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
              <p className="text-[11px] text-slate-400 mt-1">Periodicidade dos pagamentos e sorteios</p>
            </div>
          </div>

          {/* Campo e Simulação para Acréscimo Mensal (Alinhado ao Tema do Usuário) */}
          {modeloContribuicao === "ACRESCIMO_MENSAL" && (
            <div className="p-4 sm:p-5 bg-theme-light/70 border border-theme-main/30 rounded-3xl space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-800">
                  Acréscimo por Mês/Ciclo (R$) *
                </label>
                <span className="text-[10px] bg-theme-main/10 text-theme-text font-bold px-2.5 py-0.5 rounded-full border border-theme-main/20">
                  Ex: + R$ 5,00
                </span>
              </div>
              <input
                type="text"
                inputMode="numeric"
                value={formatarMoedaBRL(valorAcrescimo)}
                onChange={handleValorAcrescimoChange}
                onPaste={(e) => handlePasteMoney(e, setValorAcrescimo)}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-theme-main bg-white text-base font-black text-slate-900 focus:outline-none shadow-2xs"
              />
              <div className="pt-2 text-xs space-y-2 border-t border-theme-main/15">
                <p className="font-bold uppercase tracking-wider text-[10px] text-slate-500">
                  Simulação de Parcelas por Cota ({totalCotas} Cotas):
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">1º Mês</span>
                    <span className="font-black text-slate-900">{formatarMoedaBRL(resumoFinanceiro.parcelaPrimeiroCiclo)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">2º Mês</span>
                    <span className="font-black text-slate-900">{formatarMoedaBRL(valorCota + valorAcrescimo)}</span>
                    <span className="text-[10px] text-theme-text block font-semibold">(+ {formatarMoedaBRL(valorAcrescimo)})</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
                    <span className="text-[10px] text-slate-400 block font-semibold">3º Mês</span>
                    <span className="font-black text-slate-900">{formatarMoedaBRL(valorCota + valorAcrescimo * 2)}</span>
                    <span className="text-[10px] text-theme-text block font-semibold">(+ {formatarMoedaBRL(valorAcrescimo * 2)})</span>
                  </div>
                  <div className="bg-gradient-to-br from-theme-dark to-theme-main text-white p-2.5 rounded-xl shadow-xs border border-theme-dark/20">
                    <span className="text-[10px] text-white/80 block font-bold">{totalCotas}º Mês (Fim)</span>
                    <span className="font-black text-white">{formatarMoedaBRL(resumoFinanceiro.parcelaUltimoCiclo)}</span>
                    <span className="text-[10px] text-white/90 block font-bold">(+ {formatarMoedaBRL((totalCotas - 1) * valorAcrescimo)})</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Primeiro Vencimento *</label>
              <span className="text-[11px] text-slate-400">
                Data do 1º pagamento e contemplação
              </span>
            </div>
            <input
              type="date"
              required
              value={dataPrimeiroVencimento}
              onChange={handleDataVencimentoChange}
              className="w-full p-3 rounded-xl border border-slate-200 text-sm focus:border-theme-main focus:outline-none"
            />
          </div>

          {/* Resumo Financeiro Completo e Validado */}
          <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3 text-xs sm:text-sm shadow-2xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/80">
              <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">Resumo Financeiro do Grupo</span>
              <span className="font-bold text-theme-text bg-theme-light px-2.5 py-0.5 rounded-full text-xs">
                {totalCotas} cotas • {totalCotas} {frequencia === "MENSAL" ? "meses" : frequencia === "QUINZENAL" ? "quinzenas" : "semanas"}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-0.5">
                <div>
                  <span className="text-slate-700 font-bold block text-xs">Bolada por Contemplação:</span>
                  <span className="text-[11px] text-slate-400">Valor líquido entregue ao sorteado em cada ciclo</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-sm sm:text-base">
                    {modeloContribuicao === "ACRESCIMO_MENSAL"
                      ? `${formatarMoedaBRL(resumoFinanceiro.boladaPrimeiroCiclo)} a ${formatarMoedaBRL(resumoFinanceiro.boladaUltimoCiclo)}`
                      : formatarMoedaBRL(resumoFinanceiro.boladaPrimeiroCiclo)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-700 font-bold block text-xs">Total Pago por Cota (ao final):</span>
                  <span className="text-[11px] text-slate-400">Soma de todas as parcelas pagas por cada membro</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-slate-900 text-xs sm:text-sm">
                    {formatarMoedaBRL(resumoFinanceiro.totalPagoPorCota)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-0.5 border-t border-slate-200/60">
                <div>
                  <span className="text-slate-700 font-bold block text-xs">Volume Total Movimentado:</span>
                  <span className="text-[11px] text-slate-400">Arrecadação acumulada de todo o consórcio</span>
                </div>
                <div className="text-right">
                  <span className="font-black text-emerald-700 text-sm sm:text-base">
                    {formatarMoedaBRL(resumoFinanceiro.volumeTotalMovimentado)}
                  </span>
                </div>
              </div>
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
                  setErroMsg("Informe um valor válido para a cota (maior que zero).");
                  return;
                }
                if (modeloContribuicao === "ACRESCIMO_MENSAL" && valorAcrescimo <= 0) {
                  setErroMsg("Informe um valor de acréscimo progressivo maior que zero.");
                  return;
                }
                if (!dataPrimeiroVencimento) {
                  setErroMsg("Selecione a data do primeiro vencimento.");
                  return;
                }
                setErroMsg("");
                setEtapa(4);
              }}
              className="flex-1 py-3.5 bg-theme-main text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md hover:opacity-90 transition cursor-pointer"
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
                  ? `Com Acréscimo (+ ${formatarMoedaBRL(valorAcrescimo)}/ciclo)`
                  : "Valor Fixo"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">
                {modeloContribuicao === "ACRESCIMO_MENSAL" ? "Valor Inicial da Cota:" : "Valor da Cota:"}
              </span>
              <span className="font-bold text-slate-900">{formatarMoedaBRL(valorCota)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Bolada por Contemplação:</span>
              <span className="font-bold text-slate-900">
                {modeloContribuicao === "ACRESCIMO_MENSAL"
                  ? `${formatarMoedaBRL(resumoFinanceiro.boladaPrimeiroCiclo)} a ${formatarMoedaBRL(resumoFinanceiro.boladaUltimoCiclo)}`
                  : formatarMoedaBRL(resumoFinanceiro.boladaPrimeiroCiclo)}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Total Pago por Cota (ao final):</span>
              <span className="font-bold text-slate-900">{formatarMoedaBRL(resumoFinanceiro.totalPagoPorCota)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Volume Total do Consórcio:</span>
              <span className="font-black text-theme-text text-base">{formatarMoedaBRL(resumoFinanceiro.volumeTotalMovimentado)}</span>
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
              <span className="text-slate-500">Data de Início:</span>
              <span className="font-bold text-slate-900">
                {formatarDataSegura(dataInicio)}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">1º Vencimento:</span>
              <span className="font-bold text-slate-900">
                {formatarDataSegura(dataPrimeiroVencimento)}
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
