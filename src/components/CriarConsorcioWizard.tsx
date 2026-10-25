"use client";

import React, { useState } from "react";
import {
  createConsorcioAction,
  getAgendaParticipantesAction,
  ParticipanteAgendaItem,
} from "@/app/actions";
import { Check, Plus, Trash2, Users, AlertCircle, ArrowRight, ArrowLeft, TrendingUp, User, Calendar, Flag, Clock, ChevronDown, ChevronUp, Crown, Copy, MessageCircle, CheckCircle2, Search, Link2 } from "lucide-react";
import { ModalUpgradePlanos } from "./ModalUpgradePlanos";
import { DADOS_PAGAMENTO_UPGRADE, PLANOS_INFO, getVigenciaPlano } from "@/lib/plans";
import {
  calcularTotalArrecadacaoConsorcio,
  calcularValorCiclo,
  validarMinimoParticipantes,
  formatarMoedaBRL,
  parseMoedaBRL,
  calcularResumoFinanceiroConsorcio,
  formatarDataSegura,
  calcularDatasVencimento,
  TipoChavePix,
  TIPOS_CHAVE_PIX,
  getTipoChavePixLabel,
  formatarTelefone,
  gerarLinkWhatsApp,
} from "@/lib/finance";

interface CriarConsorcioWizardProps {
  currentUser: any;
  todosConsorcios?: any[];
  onConcluido: (novoConsorcioId?: string, nomeConsorcio?: string) => void;
  onVoltar?: () => void;
}

export function CriarConsorcioWizard({
  currentUser,
  todosConsorcios = [],
  onConcluido,
  onVoltar,
}: CriarConsorcioWizardProps) {
  const [etapa, setEtapa] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [erroMsg, setErroMsg] = useState("");

  // Estados para Modal de Upgrade e Limites de Plano
  const [modalUpgradeAberto, setModalUpgradeAberto] = useState(false);
  const [upgradeMotivo, setUpgradeMotivo] = useState("");
  const [planoRecomendado, setPlanoRecomendado] = useState<"PRO" | "PRO_MASTER">("PRO");
  const [planoSelecionadoLimite, setPlanoSelecionadoLimite] = useState<"PRO" | "PRO_MASTER">("PRO");
  const [chavePixCopiada, setChavePixCopiada] = useState(false);

  // Cálculo de consórcios ativos criados pelo usuário (Modelo A: Comum possui até 1 consórcio ativo simultâneo)
  const consorciosAtivosDoCriador = (todosConsorcios || []).filter(
    (c: any) => c.criadorId === currentUser.id && c.status === "ATIVO"
  ).length;

  const vigencia = getVigenciaPlano(currentUser);
  const planoEfetivo = vigencia.isAtivo ? currentUser.role : "COMUM";

  const maxConsorciosPlano =
    planoEfetivo === "COMUM" ? 1 : planoEfetivo === "PRO" ? 3 : Infinity;
  const maxParticipantesPlano =
    planoEfetivo === "COMUM" ? 10 : planoEfetivo === "PRO" ? 20 : Infinity;

  const atingiuLimiteConsorcios = consorciosAtivosDoCriador >= maxConsorciosPlano;

  // Etapa 1: Dados Básicos
  const dataHojePadrao = new Date().toISOString().split("T")[0];
  const [nome, setNome] = useState("");
  const [finalidade, setFinalidade] = useState("");
  const [dataInicio, setDataInicio] = useState(dataHojePadrao);
  const [regras, setRegras] = useState("");
  const [tipoChavePix, setTipoChavePix] = useState<TipoChavePix>("CELULAR");
  const [chavePix, setChavePix] = useState("");

  // Etapa 2: Participantes e Cotas (inicia vazio; criador é opcional como participante)
  const [participantes, setParticipantes] = useState<any[]>([]);

  // Form temporário de novo participante
  const [novoNome, setNovoNome] = useState("");
  const [novoEmail, setNovoEmail] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoUsuarioId, setNovoUsuarioId] = useState<string | null>(null);
  const [novasCotas, setNovasCotas] = useState(1);
  const [isCompartilhada, setIsCompartilhada] = useState(false);
  const [parceiroNome, setParceiroNome] = useState("");
  const [parceiroEmail, setParceiroEmail] = useState("");
  const [parceiroTelefone, setParceiroTelefone] = useState("");
  const [parceiroUsuarioId, setParceiroUsuarioId] = useState<string | null>(null);

  // Agenda de contatos frequentes e sugestões inteligentes de autocomplete
  const [agenda, setAgenda] = useState<ParticipanteAgendaItem[]>([]);
  const [sugestoesTitularAbertas, setSugestoesTitularAbertas] = useState(false);
  const [sugestoesParceiroAbertas, setSugestoesParceiroAbertas] = useState(false);

  React.useEffect(() => {
    if (currentUser?.id) {
      getAgendaParticipantesAction(currentUser.id).then((lista) => {
        setAgenda(lista || []);
      });
    }
  }, [currentUser?.id]);

  const sugestoesTitular = React.useMemo(() => {
    const q = novoNome.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const qDigits = q.replace(/\D/g, "");
    return agenda
      .filter((item) => {
        const jaAdicionado = participantes.some((p) => p.usuarioId === item.id);
        if (jaAdicionado) return false;
        const matchNome = item.name.toLowerCase().includes(q);
        const matchTelefone =
          qDigits.length >= 2 && item.telefone
            ? item.telefone.replace(/\D/g, "").includes(qDigits)
            : false;
        const matchEmail = item.email ? item.email.toLowerCase().includes(q) : false;
        return matchNome || matchTelefone || matchEmail;
      })
      .slice(0, 5);
  }, [novoNome, agenda, participantes]);

  const sugestoesParceiro = React.useMemo(() => {
    const q = parceiroNome.trim().toLowerCase();
    if (!q || q.length < 2) return [];
    const qDigits = q.replace(/\D/g, "");
    return agenda
      .filter((item) => {
        const jaAdicionado =
          participantes.some((p) => p.usuarioId === item.id || p.fraçãoUsuarioId === item.id) ||
          novoUsuarioId === item.id;
        if (jaAdicionado) return false;
        const matchNome = item.name.toLowerCase().includes(q);
        const matchTelefone =
          qDigits.length >= 2 && item.telefone
            ? item.telefone.replace(/\D/g, "").includes(qDigits)
            : false;
        const matchEmail = item.email ? item.email.toLowerCase().includes(q) : false;
        return matchNome || matchTelefone || matchEmail;
      })
      .slice(0, 5);
  }, [parceiroNome, agenda, participantes, novoUsuarioId]);

  const handleSelecionarTitular = (item: ParticipanteAgendaItem) => {
    setNovoNome(item.name);
    setNovoEmail(item.email || "");
    setNovoTelefone(item.telefone ? formatarTelefone(item.telefone) : "");
    setNovoUsuarioId(item.id);
    setSugestoesTitularAbertas(false);
  };

  const handleSelecionarParceiro = (item: ParticipanteAgendaItem) => {
    setParceiroNome(item.name);
    setParceiroEmail(item.email || "");
    setParceiroTelefone(item.telefone ? formatarTelefone(item.telefone) : "");
    setParceiroUsuarioId(item.id);
    setSugestoesParceiroAbertas(false);
  };

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

  // Estados de expansão do cronograma detalhado
  const [cronogramaAbertoPasso3, setCronogramaAbertoPasso3] = useState(false);
  const [cronogramaAbertoPasso4, setCronogramaAbertoPasso4] = useState(false);

  // Cálculo das datas de vencimento de todos os ciclos
  const datasCiclos = React.useMemo(() => {
    if (!dataPrimeiroVencimento || totalCotas <= 0) return [];
    const [ano, mes, dia] = dataPrimeiroVencimento.split("-").map(Number);
    if (!ano || !mes || !dia) return [];
    const dataBase = new Date(ano, mes - 1, dia, 12, 0, 0);
    return calcularDatasVencimento({
      dataPrimeiroVencimento: dataBase,
      frequencia,
      quantidadeCiclos: Math.max(1, totalCotas),
    });
  }, [dataPrimeiroVencimento, frequencia, totalCotas]);

  const dataUltimoVencimento = datasCiclos.length > 0 ? datasCiclos[datasCiclos.length - 1] : null;

  const textoFrequencia =
    frequencia === "MENSAL"
      ? `${totalCotas} meses`
      : frequencia === "QUINZENAL"
      ? `${totalCotas} quinzenas`
      : `${totalCotas} semanas`;

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

    const novosAdicionados = isCompartilhada ? 2 : 1;
    if (totalMembros + novosAdicionados > maxParticipantesPlano) {
      setPlanoRecomendado(currentUser.role === "COMUM" ? "PRO" : "PRO_MASTER");
      setUpgradeMotivo(
        `Limite de participantes atingido! O Plano ${
          currentUser.role === "COMUM" ? "Comum" : "Pro"
        } permite no máximo ${maxParticipantesPlano} pessoas por grupo. Para expandir, migre para o Plano ${
          currentUser.role === "COMUM"
            ? "Pro (até 20 participantes por R$ 19,90/mês)"
            : "Pro Master (participantes ilimitados por R$ 29,90/mês)"
        } via Pix para Marcos Batista.`
      );
      setModalUpgradeAberto(true);
      return;
    }

    setParticipantes([
      ...participantes,
      {
        usuarioId: novoUsuarioId || undefined,
        nome: novoNome.trim(),
        email: novoEmail.trim() || undefined,
        telefone: novoTelefone.trim() || undefined,
        cotasCount: novasCotas,
        isCompartilhada,
        fraçãoUsuarioId: isCompartilhada ? parceiroUsuarioId || undefined : undefined,
        fraçãoNome: isCompartilhada ? parceiroNome.trim() : undefined,
        fraçãoEmail: isCompartilhada ? parceiroEmail.trim() || undefined : undefined,
        fraçãoTelefone: isCompartilhada ? parceiroTelefone.trim() || undefined : undefined,
        valorFração1: isCompartilhada ? valorCota / 2 : undefined,
        valorFração2: isCompartilhada ? valorCota / 2 : undefined,
      },
    ]);

    // Limpa campos
    setNovoNome("");
    setNovoEmail("");
    setNovoTelefone("");
    setNovoUsuarioId(null);
    setNovasCotas(1);
    setIsCompartilhada(false);
    setParceiroNome("");
    setParceiroEmail("");
    setParceiroTelefone("");
    setParceiroUsuarioId(null);
    setErroMsg("");
    setSugestoesTitularAbertas(false);
    setSugestoesParceiroAbertas(false);
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
      tipoChavePix,
      chavePix: chavePix.trim(),
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
      onConcluido(res.consorcioId, nome.trim());
    } else {
      setErroMsg(res.error || "Ocorreu um erro ao criar o consórcio.");
    }
  };

  if (atingiuLimiteConsorcios) {
    const linkWhatsApp = gerarLinkWhatsApp({
      telefone: DADOS_PAGAMENTO_UPGRADE.whatsapp,
      mensagem: `Olá Marcos Batista! Gostaria de fazer upgrade do meu plano no Clube da Cota para o Plano ${
        planoSelecionadoLimite === "PRO" ? "Pro (R$ 19,90/mês)" : "Pro Master (R$ 29,90/mês)"
      }. Segue o comprovante da transferência Pix!`,
    });

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-amber-300 shadow-sm space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0 shadow-xs">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-amber-800 bg-amber-100 px-3 py-1 rounded-full border border-amber-200 inline-block mb-1.5">
                Capacidade Máxima do Plano
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Você já possui {consorciosAtivosDoCriador} de {maxConsorciosPlano} consórcio(s) ativo(s)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                No Plano {currentUser.role === "COMUM" ? "Comum" : "Pro"}, você pode manter até {maxConsorciosPlano} consórcio ativo simultaneamente. Encerre o consórcio atual para abrir um novo, ou selecione o plano desejado abaixo para gerenciar múltiplos grupos:
              </p>
            </div>
          </div>

          {/* Cards Interativos e Selecionáveis dos Planos Pro e Pro Master */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card Plano Pro */}
            <div
              onClick={() => setPlanoSelecionadoLimite("PRO")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                planoSelecionadoLimite === "PRO"
                  ? "border-blue-600 bg-blue-50/70 shadow-md ring-2 ring-blue-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800">
                    Plano Pro
                  </span>
                  {planoSelecionadoLimite === "PRO" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-blue-700">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" /> Selecionado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                      Toque para escolher
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-3xl font-black text-slate-900">R$ 19,90</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mês</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mb-3">
                  Até 3 consórcios ativos e até 20 participantes por grupo.
                </p>
                <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-200">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Até 3 consórcios simultâneos</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Até 20 membros por consórcio</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-blue-600" />
                    <span>Gestão de repasses e WhatsApp</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Card Plano Pro Master */}
            <div
              onClick={() => setPlanoSelecionadoLimite("PRO_MASTER")}
              className={`p-5 rounded-2xl border-2 transition cursor-pointer relative flex flex-col justify-between ${
                planoSelecionadoLimite === "PRO_MASTER"
                  ? "border-purple-600 bg-purple-50/70 shadow-md ring-2 ring-purple-500/20"
                  : "border-slate-200 bg-white hover:border-slate-300 opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 flex items-center gap-1 w-max">
                    <Crown className="w-3.5 h-3.5 text-purple-700" /> Pro Master
                  </span>
                  {planoSelecionadoLimite === "PRO_MASTER" ? (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-700">
                      <CheckCircle2 className="w-4 h-4 text-purple-600" /> Selecionado
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-slate-400 hover:text-slate-600">
                      Toque para escolher
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1 my-2">
                  <span className="text-3xl font-black text-slate-900">R$ 29,90</span>
                  <span className="text-xs text-slate-500 font-semibold">/ mês</span>
                </div>
                <p className="text-xs text-slate-600 font-medium mb-3">
                  Grupos ilimitados e governança com Trilha de Auditoria.
                </p>
                <ul className="text-xs text-slate-700 space-y-1.5 pt-2 border-t border-slate-200">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Consórcios ativos ilimitados</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Participantes ilimitados</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-purple-600" />
                    <span>Painel exclusivo de Auditoria</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Dados Pix para Marcos Batista com Valor Dinâmico do Plano Selecionado */}
          <div className="bg-gradient-to-br from-slate-50 to-emerald-50/50 rounded-2xl p-4 sm:p-5 border-2 border-emerald-200/80 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h4 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                Instruções de Pagamento via Pix:
              </h4>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                Valor a pagar: {planoSelecionadoLimite === "PRO" ? "R$ 19,90" : "R$ 29,90"}
              </span>
            </div>
            <p className="text-xs text-slate-600">
              Realize a transferência Pix para ativação imediata do{" "}
              <strong className="text-slate-900">
                {planoSelecionadoLimite === "PRO" ? "Plano Pro (R$ 19,90/mês)" : "Plano Pro Master (R$ 29,90/mês)"}
              </strong>
              :
            </p>
            <div className="bg-white rounded-xl p-3.5 border border-slate-200 text-xs space-y-1.5 font-medium">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Favorecido:</span>
                <span className="font-bold text-slate-900">{DADOS_PAGAMENTO_UPGRADE.favorecido}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-semibold">Tipo de Chave:</span>
                <span className="font-semibold text-slate-800">{DADOS_PAGAMENTO_UPGRADE.tipoChavePix}</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">Chave Pix:</span>
                <span className="font-mono font-bold text-slate-900 text-xs sm:text-sm select-all">
                  {DADOS_PAGAMENTO_UPGRADE.chavePix}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-slate-100 flex-wrap gap-1">
                <span className="text-slate-500 font-semibold">WhatsApp Oficial:</span>
                <span className="font-bold text-emerald-700 text-xs sm:text-sm">
                  {DADOS_PAGAMENTO_UPGRADE.whatsapp}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(DADOS_PAGAMENTO_UPGRADE.chavePix);
                  setChavePixCopiada(true);
                  setTimeout(() => setChavePixCopiada(false), 2500);
                }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                  chavePixCopiada
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-900 hover:bg-slate-800 text-white"
                }`}
              >
                {chavePixCopiada ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Chave Copiada!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Chave Pix</span>
                  </>
                )}
              </button>

              <a
                href={linkWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>
                  Enviar Comprovante ({planoSelecionadoLimite === "PRO" ? "Plano Pro" : "Pro Master"}) via WhatsApp
                </span>
              </a>

              {onVoltar && (
                <button
                  type="button"
                  onClick={onVoltar}
                  className="px-4 py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer ml-auto"
                >
                  Voltar para Consórcios
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {/* Chave Pix do Consórcio (Obrigatória) */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span>⚡</span> Chave Pix do Consórcio <span className="text-rose-500 font-black">*</span>
              </label>
              <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                Obrigatório
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Tipo da Chave
                </label>
                <select
                  value={tipoChavePix}
                  onChange={(e) => setTipoChavePix(e.target.value as TipoChavePix)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold focus:border-theme-main focus:outline-none bg-white cursor-pointer"
                >
                  {TIPOS_CHAVE_PIX.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Chave Pix para Recebimento *
                </label>
                <input
                  type="text"
                  required
                  placeholder={
                    TIPOS_CHAVE_PIX.find((t) => t.value === tipoChavePix)?.placeholder ||
                    "Informe a chave Pix"
                  }
                  value={chavePix}
                  onChange={(e) => setChavePix(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold focus:border-theme-main focus:outline-none bg-white shadow-2xs"
                />
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Esta chave Pix do consórcio é apresentada aos participantes para o pagamento das parcelas de cada ciclo.
            </p>
          </div>

          <button
            onClick={() => {
              if (!nome.trim()) {
                setErroMsg("O nome do consórcio é obrigatório.");
                return;
              }
              if (!chavePix.trim()) {
                setErroMsg("A chave Pix do consórcio é obrigatória.");
                return;
              }
              setErroMsg("");
              setEtapa(2);
            }}
            className="w-full mt-2 py-3.5 bg-theme-main hover:opacity-90 text-white font-bold rounded-2xl text-sm shadow-md flex items-center justify-center gap-2 transition touch-target cursor-pointer"
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
                <span className="text-sm font-black text-white">
                  {totalMembros}{maxParticipantesPlano !== Infinity ? `/${maxParticipantesPlano}` : ""}
                </span>
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

          {/* Alerta de Capacidade do Plano */}
          {maxParticipantesPlano !== Infinity && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600">
                Capacidade do Plano {currentUser.role === "COMUM" ? "Comum" : "Pro"}:{" "}
                <strong className="text-slate-900">{totalMembros} de {maxParticipantesPlano} pessoas</strong>
              </span>
              <button
                type="button"
                onClick={() => {
                  setPlanoRecomendado(currentUser.role === "COMUM" ? "PRO" : "PRO_MASTER");
                  setUpgradeMotivo(
                    `Seu consórcio já possui ${totalMembros} participantes. Para expandir a capacidade, migre para o Plano ${
                      currentUser.role === "COMUM" ? "Pro (até 20 pessoas por R$ 19,90/mês)" : "Pro Master (ilimitado por R$ 29,90/mês)"
                    } via Pix para Marcos Batista.`
                  );
                  setModalUpgradeAberto(true);
                }}
                className="text-theme-text font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>Expandir Limite</span>
                <Crown className="w-3.5 h-3.5 text-amber-500" />
              </button>
            </div>
          )}

          {/* Atalho opcional para o criador se incluir */}
          {!participantes.some(
            (p) =>
              p.usuarioId === currentUser.id ||
              (p.email && p.email.toLowerCase() === currentUser.email?.toLowerCase())
          ) && (
            <button
              type="button"
              onClick={() => {
                setNovoNome(currentUser.name);
                setNovoEmail(
                  currentUser.email?.endsWith("@clubedacota.local")
                    ? ""
                    : currentUser.email || ""
                );
                setNovoTelefone(
                  currentUser.telefone ? formatarTelefone(currentUser.telefone) : ""
                );
                setNovoUsuarioId(currentUser.id);
                setSugestoesTitularAbertas(false);
              }}
              className="w-full py-2.5 px-3 bg-theme-light border border-theme-main/30 text-theme-text rounded-2xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-theme-main/10 transition cursor-pointer"
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-slate-800 text-sm">
                        {p.nome} {p.isCompartilhada ? `& ${p.fraçãoNome}` : ""}
                      </p>
                      {p.usuarioId && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Conta Vinculada</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="text-[11px] text-slate-500">
                        {p.email ? p.email : "Sem e-mail cadastrado"}
                        {p.isCompartilhada && p.fraçãoEmail ? ` / ${p.fraçãoEmail}` : ""}
                        {p.telefone ? ` • ${p.telefone}` : ""}
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
            <div className="flex items-center justify-between">
              <h4 className="text-xs sm:text-sm font-bold text-slate-800">Adicionar Novo Participante</h4>
              {agenda.length > 0 && (
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Search className="w-3 h-3 text-theme-main" />
                  <span>Digite para buscar em sua agenda</span>
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Campo Nome com Autocomplete e Vínculo Inteligente */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nome completo *"
                  value={novoNome}
                  onChange={(e) => {
                    setNovoNome(e.target.value);
                    setSugestoesTitularAbertas(true);
                    if (novoUsuarioId) setNovoUsuarioId(null);
                  }}
                  onFocus={() => {
                    if (novoNome.trim().length >= 2) setSugestoesTitularAbertas(true);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white font-medium"
                />

                {/* Dropdown de sugestões da agenda do criador */}
                {sugestoesTitularAbertas && sugestoesTitular.length > 0 && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setSugestoesTitularAbertas(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                        <span>Sua Rede de Participantes</span>
                        <span className="text-slate-400 font-normal">Toque para vincular</span>
                      </div>
                      {sugestoesTitular.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelecionarTitular(item)}
                          className="w-full p-2.5 text-left hover:bg-theme-light/40 transition flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                              <span>{item.name}</span>
                              <Link2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                            </div>
                            <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                              {item.telefone && <span>{formatarTelefone(item.telefone)}</span>}
                              {item.telefone && item.email && <span>•</span>}
                              {item.email && <span>{item.email}</span>}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold text-theme-text bg-theme-light px-2 py-0.5 rounded-full flex-shrink-0">
                            {item.totalParticipacoes > 0
                              ? `${item.totalParticipacoes} ${item.totalParticipacoes === 1 ? "consórcio" : "consórcios"}`
                              : "Cadastrado"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {novoUsuarioId && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold w-fit mt-1.5 animate-in fade-in duration-200">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span>Conta vinculada</span>
                    <button
                      type="button"
                      onClick={() => setNovoUsuarioId(null)}
                      className="ml-1 text-slate-400 hover:text-rose-600 text-[10px] font-semibold underline cursor-pointer"
                      title="Desvincular e cadastrar como novo participante"
                    >
                      (desvincular)
                    </button>
                  </div>
                )}
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
              <div>
                <input
                  type="tel"
                  placeholder="WhatsApp / Celular (opcional)"
                  value={novoTelefone}
                  onChange={(e) => setNovoTelefone(formatarTelefone(e.target.value))}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                />
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic mt-0.5">
              💡 Digite o nome para autocompletar membros frequentes da sua rede, ou informe novos dados.
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
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nome do parceiro(a) *"
                        value={parceiroNome}
                        onChange={(e) => {
                          setParceiroNome(e.target.value);
                          setSugestoesParceiroAbertas(true);
                          if (parceiroUsuarioId) setParceiroUsuarioId(null);
                        }}
                        onFocus={() => {
                          if (parceiroNome.trim().length >= 2) setSugestoesParceiroAbertas(true);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white font-medium"
                      />

                      {/* Dropdown de sugestões para o parceiro */}
                      {sugestoesParceiroAbertas && sugestoesParceiro.length > 0 && (
                        <>
                          <div
                            className="fixed inset-0 z-20"
                            onClick={() => setSugestoesParceiroAbertas(false)}
                          />
                          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-30 overflow-hidden divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="p-2 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                              <span>Sua Rede de Participantes</span>
                              <span className="text-slate-400 font-normal">Toque para vincular</span>
                            </div>
                            {sugestoesParceiro.map((item) => (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleSelecionarParceiro(item)}
                                className="w-full p-2.5 text-left hover:bg-theme-light/40 transition flex items-center justify-between gap-2 cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                                    <span>{item.name}</span>
                                    <Link2 className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                                  </div>
                                  <div className="text-[11px] text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
                                    {item.telefone && <span>{formatarTelefone(item.telefone)}</span>}
                                    {item.telefone && item.email && <span>•</span>}
                                    {item.email && <span>{item.email}</span>}
                                  </div>
                                </div>
                                <span className="text-[10px] font-bold text-theme-text bg-theme-light px-2 py-0.5 rounded-full flex-shrink-0">
                                  {item.totalParticipacoes > 0
                                    ? `${item.totalParticipacoes} ${item.totalParticipacoes === 1 ? "consórcio" : "consórcios"}`
                                    : "Cadastrado"}
                                </span>
                              </button>
                            ))}
                          </div>
                        </>
                      )}

                      {parceiroUsuarioId && (
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-bold w-fit mt-1.5 animate-in fade-in duration-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span>Conta vinculada</span>
                          <button
                            type="button"
                            onClick={() => setParceiroUsuarioId(null)}
                            className="ml-1 text-slate-400 hover:text-rose-600 text-[10px] font-semibold underline cursor-pointer"
                            title="Desvincular e cadastrar como novo participante"
                          >
                            (desvincular)
                          </button>
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="email"
                        placeholder="E-mail (opcional)"
                        value={parceiroEmail}
                        onChange={(e) => setParceiroEmail(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                      />
                    </div>
                    <div>
                      <input
                        type="tel"
                        placeholder="WhatsApp (opcional)"
                        value={parceiroTelefone}
                        onChange={(e) => setParceiroTelefone(formatarTelefone(e.target.value))}
                        className="w-full p-3 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none bg-white"
                      />
                    </div>
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

          {/* Cronograma dos Ciclos e Término (Opção 1) */}
          {datasCiclos.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                  Previsão do Cronograma & Término
                </span>
                <span className="text-[11px] font-bold text-theme-text bg-theme-light px-2.5 py-0.5 rounded-full">
                  {textoFrequencia}
                </span>
              </div>

              {/* Cards de Início e Término */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      1º Vencimento (Início)
                    </span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                      Ciclo #1
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {formatarDataSegura(datasCiclos[0])}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Primeira cobrança e contemplação</span>
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-br from-theme-light/80 to-blue-50/70 rounded-2xl border border-theme-main/30 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-theme-text uppercase tracking-wider">
                      Último Ciclo (Término)
                    </span>
                    <span className="text-[10px] bg-theme-main text-white font-bold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-2xs">
                      <Flag className="w-3 h-3" />
                      <span>Ciclo #{totalCotas} 🏁</span>
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                    {dataUltimoVencimento ? formatarDataSegura(dataUltimoVencimento) : "-"}
                  </p>
                  <p className="text-[11px] text-theme-text font-medium mt-0.5">
                    Consórcio 100% quitado ({textoFrequencia})
                  </p>
                </div>
              </div>

              {/* Acordeão Expansível Mês a Mês */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setCronogramaAbertoPasso3(!cronogramaAbertoPasso3)}
                  className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100 transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                      <Calendar className="w-4 h-4 text-theme-main" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Ver Cronograma Completo dos {totalCotas} Ciclos
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {cronogramaAbertoPasso3
                          ? "Ocultar detalhamento mensal"
                          : "Clique para inspecionar data, parcela e bolada mês a mês"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                    <span>{cronogramaAbertoPasso3 ? "Recolher" : "Expandir"}</span>
                    {cronogramaAbertoPasso3 ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {cronogramaAbertoPasso3 && (
                  <div className="p-3.5 bg-slate-50/50 border-t border-slate-200 space-y-1.5 text-xs max-h-72 overflow-y-auto">
                    <div className="grid grid-cols-4 font-bold text-[10px] uppercase text-slate-400 px-2 pb-1 border-b border-slate-200">
                      <span>Ciclo</span>
                      <span>Vencimento</span>
                      <span>Valor Cota</span>
                      <span className="text-right">Bolada Entregue</span>
                    </div>
                    {datasCiclos.map((data, index) => {
                      const numCiclo = index + 1;
                      const valorNesseCiclo = calcularValorCiclo(
                        numCiclo,
                        valorCota,
                        modeloContribuicao,
                        valorAcrescimo
                      );
                      const boladaNesseCiclo = valorNesseCiclo * totalCotas;
                      const isUltimo = numCiclo === totalCotas;
                      const isPrimeiro = numCiclo === 1;

                      return (
                        <div
                          key={numCiclo}
                          className={`grid grid-cols-4 items-center p-2 rounded-xl transition ${
                            isUltimo
                              ? "bg-theme-main text-white font-bold shadow-xs"
                              : isPrimeiro
                              ? "bg-emerald-50/60 border border-emerald-200 text-slate-800 font-semibold"
                              : "bg-white border border-slate-100 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <span className={isUltimo ? "text-white font-black" : "font-bold text-slate-900"}>
                              #{numCiclo}
                            </span>
                            {isPrimeiro && (
                              <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1 py-0.2 rounded font-bold">
                                Início
                              </span>
                            )}
                            {isUltimo && (
                              <span className="text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-bold">
                                Fim 🏁
                              </span>
                            )}
                          </div>
                          <span>{formatarDataSegura(data)}</span>
                          <span className={isUltimo ? "text-white" : "font-medium text-slate-800"}>
                            {formatarMoedaBRL(valorNesseCiclo)}
                          </span>
                          <span className={`text-right font-black ${isUltimo ? "text-white" : "text-slate-900"}`}>
                            {formatarMoedaBRL(boladaNesseCiclo)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

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
              <span className="text-slate-500">1º Vencimento (Início):</span>
              <span className="font-bold text-slate-900">
                {formatarDataSegura(dataPrimeiroVencimento)}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Último Ciclo (Término):</span>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-900">
                  {dataUltimoVencimento ? formatarDataSegura(dataUltimoVencimento) : "-"}
                </span>
                <span className="text-[10px] bg-theme-main text-white font-bold px-2 py-0.5 rounded-md shadow-2xs">
                  Ciclo #{totalCotas} 🏁
                </span>
              </div>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="text-slate-500">Duração Total:</span>
              <span className="font-bold text-theme-text bg-theme-light px-2.5 py-0.5 rounded-full text-xs">
                {textoFrequencia}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Chave Pix do Consórcio:</span>
              <span className="font-bold text-slate-900 text-right truncate max-w-[260px]">
                {chavePix} ({getTipoChavePixLabel(tipoChavePix)})
              </span>
            </div>
          </div>

          {/* Acordeão do Cronograma Completo na Revisão Final */}
          {datasCiclos.length > 0 && (
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <button
                type="button"
                onClick={() => setCronogramaAbertoPasso4(!cronogramaAbertoPasso4)}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/70 hover:bg-slate-100 transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shadow-2xs">
                    <Calendar className="w-4 h-4 text-theme-main" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Cronograma Completo dos {totalCotas} Ciclos
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {cronogramaAbertoPasso4
                        ? "Ocultar detalhamento dos ciclos"
                        : "Clique para inspecionar as datas de vencimento e contemplação"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-theme-main bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
                  <span>{cronogramaAbertoPasso4 ? "Recolher" : "Expandir"}</span>
                  {cronogramaAbertoPasso4 ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </div>
              </button>

              {cronogramaAbertoPasso4 && (
                <div className="p-3.5 bg-slate-50/50 border-t border-slate-200 space-y-1.5 text-xs max-h-64 overflow-y-auto">
                  <div className="grid grid-cols-4 font-bold text-[10px] uppercase text-slate-400 px-2 pb-1 border-b border-slate-200">
                    <span>Ciclo</span>
                    <span>Vencimento</span>
                    <span>Valor Cota</span>
                    <span className="text-right">Bolada Entregue</span>
                  </div>
                  {datasCiclos.map((data, index) => {
                    const numCiclo = index + 1;
                    const valorNesseCiclo = calcularValorCiclo(
                      numCiclo,
                      valorCota,
                      modeloContribuicao,
                      valorAcrescimo
                    );
                    const boladaNesseCiclo = valorNesseCiclo * totalCotas;
                    const isUltimo = numCiclo === totalCotas;
                    const isPrimeiro = numCiclo === 1;

                    return (
                      <div
                        key={numCiclo}
                        className={`grid grid-cols-4 items-center p-2 rounded-xl transition ${
                          isUltimo
                            ? "bg-theme-main text-white font-bold shadow-xs"
                            : isPrimeiro
                            ? "bg-emerald-50/60 border border-emerald-200 text-slate-800 font-semibold"
                            : "bg-white border border-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className={isUltimo ? "text-white font-black" : "font-bold text-slate-900"}>
                            #{numCiclo}
                          </span>
                          {isPrimeiro && (
                            <span className="text-[9px] bg-emerald-200/80 text-emerald-900 px-1 py-0.2 rounded font-bold">
                              Início
                            </span>
                          )}
                          {isUltimo && (
                            <span className="text-[9px] bg-white/20 text-white px-1 py-0.2 rounded font-bold">
                              Fim 🏁
                            </span>
                          )}
                        </div>
                        <span>{formatarDataSegura(data)}</span>
                        <span className={isUltimo ? "text-white" : "font-medium text-slate-800"}>
                          {formatarMoedaBRL(valorNesseCiclo)}
                        </span>
                        <span className={`text-right font-black ${isUltimo ? "text-white" : "text-slate-900"}`}>
                          {formatarMoedaBRL(boladaNesseCiclo)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

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

      {/* Modal Padronizado de Upgrade de Planos com Pix para Marcos Batista */}
      <ModalUpgradePlanos
        aberto={modalUpgradeAberto}
        onFechar={() => setModalUpgradeAberto(false)}
        motivo={upgradeMotivo}
        planoRecomendado={planoRecomendado}
        userId={currentUser.id}
      />
    </div>
  );
}
