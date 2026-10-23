"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getParticipanteByToken,
  submitReceiptByTokenAction,
  ativarContaComSenhaAction,
} from "@/app/actions";
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Copy,
  Check,
  Upload,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  ChevronDown,
  ChevronUp,
  MessageCircle,
} from "lucide-react";
import Link from "next/link";
import { formatarMoedaBRL, formatarDataSegura } from "@/lib/finance";

export default function ParticipanteTokenPage() {
  const params = useParams();
  const token = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [data, setData] = useState<any>(null);

  // Estados de ações
  const [pixCopiado, setPixCopiado] = useState(false);
  const [modalUploadAberto, setModalUploadAberto] = useState(false);
  const [contribuicaoSelecionada, setContribuicaoSelecionada] = useState<any>(null);
  const [nomeArquivo, setNomeArquivo] = useState("");
  const [enviandoComprovante, setEnviandoComprovante] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState("");

  // Estado de ativação de senha
  const [mostrarCriarSenha, setMostrarCriarSenha] = useState(false);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmaSenha, setConfirmaSenha] = useState("");
  const [salvandoSenha, setSalvandoSenha] = useState(false);
  const [erroSenha, setErroSenha] = useState("");
  const [senhaCriada, setSenhaCriada] = useState(false);

  // Acordeão de transparência
  const [verCiclosGrupo, setVerCiclosGrupo] = useState(false);

  const carregarDados = async () => {
    if (!token) return;
    setLoading(true);
    const res = await getParticipanteByToken(token);
    if (res.success && res.data) {
      setData(res.data);
      // Salva no localStorage para conveniência do usuário
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("clube_cota_participant_token", token);
        } catch (e) {
          // ignore
        }
      }
    } else {
      setErro(res.error || "Link de acesso inválido ou expirado.");
    }
    setLoading(false);
  };

  useEffect(() => {
    carregarDados();
  }, [token]);

  const handleCopiarPix = (chave: string) => {
    if (!chave) return;
    navigator.clipboard.writeText(chave);
    setPixCopiado(true);
    setTimeout(() => setPixCopiado(false), 2500);
  };

  const handleEnviarComprovante = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contribuicaoSelecionada || !nomeArquivo) return;

    setEnviandoComprovante(true);
    const res = await submitReceiptByTokenAction(token, contribuicaoSelecionada.id, nomeArquivo);
    setEnviandoComprovante(false);

    if (res.success) {
      setMsgSucesso(res.message || "Comprovante enviado com sucesso!");
      setNomeArquivo("");
      setModalUploadAberto(false);
      carregarDados();
      setTimeout(() => setMsgSucesso(""), 4000);
    } else {
      alert(res.error || "Erro ao enviar comprovante.");
    }
  };

  const handleCriarSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setErroSenha("");

    if (novaSenha.length < 6) {
      setErroSenha("A senha deve ter no mínimo 6 caracteres.");
      return;
    }

    if (novaSenha !== confirmaSenha) {
      setErroSenha("As senhas informadas não coincidem.");
      return;
    }

    setSalvandoSenha(true);
    const res = await ativarContaComSenhaAction(token, novaSenha);
    setSalvandoSenha(false);

    if (res.success) {
      setSenhaCriada(true);
      setMsgSucesso(res.message || "Senha cadastrada com sucesso!");
      carregarDados();
      setTimeout(() => setMsgSucesso(""), 4000);
    } else {
      setErroSenha(res.error || "Erro ao cadastrar senha.");
    }
  };

  const formatarData = (d: string) => {
    return formatarDataSegura(d);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Carregando seus dados da cota...</p>
        </div>
      </main>
    );
  }

  if (erro || !data) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-center mx-auto text-2xl">
            ⚠️
          </div>
          <h2 className="text-lg font-black text-slate-900">Acesso Não Encontrado</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {erro || "O link que você tentou acessar não é válido ou foi desativado."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition"
            >
              Ir para o Clube da Cota
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const { participante, cota, consorcio, contribuicoes, ciclosGrupo } = data;

  // Cálculos pessoais
  const totalDevido = contribuicoes.reduce((acc: number, c: any) => acc + c.valorPrevisto, 0);
  const totalPago = contribuicoes
    .filter((c: any) => c.status === "PAGO")
    .reduce((acc: number, c: any) => acc + c.valorPrevisto, 0);
  const totalPendente = totalDevido - totalPago;

  const proximaParcela = contribuicoes.find(
    (c: any) => c.status === "PENDENTE" || c.status === "EM_ATRASO"
  );

  const chavePixEfetiva = consorcio.chavePix || consorcio.dadosBancarios || "";

  return (
    <main className="min-h-screen bg-slate-100/80 text-slate-900 pb-16">
      {/* Top Navbar Leve */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
              CC
            </div>
            <div>
              <span className="text-xs font-black text-slate-900 block tracking-tight">
                Clube da Cota
              </span>
              <span className="text-[10px] text-slate-500 font-semibold block">
                Portal do Participante
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {consorcio.status === "ATIVO" ? "Consórcio Ativo" : consorcio.status}
            </span>
          </div>
        </div>
      </header>

      {/* Container Central Mobile-First */}
      <div className="max-w-3xl mx-auto px-4 pt-5 space-y-4">
        {/* Banner de Mensagem de Sucesso */}
        {msgSucesso && (
          <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2 shadow-sm animate-in fade-in duration-200">
            <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{msgSucesso}</span>
          </div>
        )}

        {/* 1. Header do Participante & Cota */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                Bem-vindo(a)
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                Olá, {participante.nome}! 👋
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Consórcio: <strong className="text-slate-800">{consorcio.nome}</strong> • Organizado por{" "}
                <span className="text-slate-700 font-semibold">{consorcio.criadorNome}</span>
              </p>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="text-xs font-black bg-slate-900 text-white px-3 py-1.5 rounded-xl block shadow-2xs">
                Cota #{cota.numero}
              </span>
              <span className="text-[10px] text-slate-500 font-medium block mt-1">
                {cota.isCompartilhada ? "Cota Compartilhada" : "Cota Individual"}
              </span>
            </div>
          </div>

          {consorcio.finalidade && (
            <p className="text-xs text-slate-600 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
              &ldquo;{consorcio.finalidade}&rdquo;
            </p>
          )}
        </div>

        {/* 2. Card da Bolada / Contemplação */}
        <div
          className={`rounded-3xl p-5 sm:p-6 border shadow-xs transition ${
            cota.status === "CONTEMPLADA"
              ? "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200"
              : "bg-gradient-to-br from-blue-50/70 to-indigo-50/70 border-blue-200/80"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{cota.status === "CONTEMPLADA" ? "🎉" : "🎯"}</span>
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Sua Contemplação (Bolada)
              </span>
            </div>
            <span
              className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                cota.status === "CONTEMPLADA"
                  ? "bg-emerald-600 text-white"
                  : "bg-blue-600 text-white"
              }`}
            >
              {cota.status === "CONTEMPLADA" ? "CONTEMPLADA!" : `Ciclo #${cota.ordemSorteio}`}
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white/80 backdrop-blur-xs p-4 rounded-2xl border border-white/60">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Valor Previsto da Bolada
              </span>
              <p className="text-2xl sm:text-3xl font-black text-slate-900 mt-0.5">
                {formatarMoedaBRL(consorcio.valorTotalBolada)}
              </p>
              <span className="text-xs text-slate-600 font-medium mt-0.5 block">
                {cota.status === "CONTEMPLADA"
                  ? "Cota sorteada/contemplada com sucesso!"
                  : `Você receberá a bolada no Ciclo #${cota.ordemSorteio} do consórcio.`}
              </span>
            </div>

            <div className="sm:text-right flex-shrink-0">
              <span className="text-[11px] font-bold text-slate-500 uppercase block">
                Ordem no Sorteio
              </span>
              <span className="text-lg font-black text-slate-800">
                #{cota.ordemSorteio} de {consorcio.totalCotas}
              </span>
            </div>
          </div>
        </div>

        {/* 3. Próxima Parcela & Dados do PIX */}
        {proximaParcela ? (
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">
                  Pagamento Atual
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Ciclo #{proximaParcela.numeroCiclo} • Parcela da Cota
                </h3>
              </div>
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full ${
                  proximaParcela.status === "EM_ATRASO"
                    ? "bg-rose-100 text-rose-800 border border-rose-200"
                    : "bg-amber-100 text-amber-900 border border-amber-200"
                }`}
              >
                {proximaParcela.status === "EM_ATRASO" ? "Vencida" : "Aguardando Pagamento"}
              </span>
            </div>

            <div className="bg-slate-50/90 rounded-2xl p-4 border border-slate-100 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs text-slate-500 font-medium block">Valor a pagar:</span>
                <p className="text-2xl font-black text-slate-900">
                  {formatarMoedaBRL(proximaParcela.valorPrevisto)}
                </p>
                <p className="text-xs text-slate-600 font-medium mt-0.5 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  Vencimento: <strong>{formatarData(proximaParcela.dataVencimento)}</strong>
                </p>
              </div>

              {proximaParcela.comprovante ? (
                <div className="text-right">
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl inline-block">
                    {proximaParcela.comprovante.status === "PENDENTE"
                      ? "Comprovante em análise"
                      : "Comprovante enviado"}
                  </span>
                </div>
              ) : null}
            </div>

            {/* Chave PIX do Administrador */}
            {chavePixEfetiva ? (
              <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <span>⚡</span> Chave PIX do Organizador
                  </span>
                  <span className="text-[11px] text-blue-700 font-medium">
                    {consorcio.criadorNome}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={chavePixEfetiva}
                    className="flex-1 bg-white border border-blue-200 text-slate-800 text-xs font-mono font-bold py-2.5 px-3 rounded-xl focus:outline-none"
                  />
                  <button
                    onClick={() => handleCopiarPix(chavePixEfetiva)}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer flex-shrink-0"
                  >
                    {pixCopiado ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-300" />
                        <span>Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar PIX</span>
                      </>
                    )}
                  </button>
                </div>

                {consorcio.regras && (
                  <p className="text-[11px] text-slate-500 italic mt-1 leading-relaxed">
                    Instruções: {consorcio.regras}
                  </p>
                )}
              </div>
            ) : null}

            {/* Botão de Enviar Comprovante */}
            <button
              onClick={() => {
                setContribuicaoSelecionada(proximaParcela);
                setModalUploadAberto(true);
              }}
              className="w-full py-3.5 px-4 bg-slate-900 hover:bg-black active:scale-[0.99] text-white font-bold rounded-2xl text-xs sm:text-sm shadow-sm flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>
                {proximaParcela.comprovante
                  ? "Reenviar Novo Comprovante"
                  : "Enviar Comprovante PIX"}
              </span>
            </button>
          </div>
        ) : (
          <div className="bg-emerald-50 rounded-3xl p-6 border border-emerald-200 text-center space-y-2">
            <span className="text-3xl block">🎉</span>
            <h3 className="text-base font-black text-emerald-900">
              Todas as parcelas estão quitadas!
            </h3>
            <p className="text-xs text-emerald-700">
              Você não possui parcelas pendentes para esta cota. Parabéns!
            </p>
          </div>
        )}

        {/* 4. Resumo Financeiro Pessoal */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
          <span className="text-xs font-bold uppercase tracking-wide text-slate-500 block">
            Seu Resumo Financeiro
          </span>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <span className="text-[10px] sm:text-xs text-slate-500 font-bold block">
                Total Previsto
              </span>
              <p className="text-xs sm:text-base font-black text-slate-900 mt-1">
                {formatarMoedaBRL(totalDevido)}
              </p>
            </div>

            <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100">
              <span className="text-[10px] sm:text-xs text-emerald-700 font-bold block">
                ✓ Já Pago
              </span>
              <p className="text-xs sm:text-base font-black text-emerald-800 mt-1">
                {formatarMoedaBRL(totalPago)}
              </p>
            </div>

            <div className="bg-amber-50/80 p-3 rounded-2xl border border-amber-100">
              <span className="text-[10px] sm:text-xs text-amber-800 font-bold block">
                ⏳ Falta Pagar
              </span>
              <p className="text-xs sm:text-base font-black text-amber-900 mt-1">
                {formatarMoedaBRL(totalPendente)}
              </p>
            </div>
          </div>
        </div>

        {/* 5. Histórico Completo de Parcelas */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-3.5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                Histórico de Parcelas
              </h3>
              <p className="text-xs text-slate-500">Todas as contribuições da sua cota</p>
            </div>
            <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-lg">
              {contribuicoes.length} parcelas
            </span>
          </div>

          <div className="space-y-2">
            {contribuicoes.map((c: any) => {
              const isPago = c.status === "PAGO";
              const isAtraso = c.status === "EM_ATRASO";

              return (
                <div
                  key={c.id}
                  className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                    isPago
                      ? "bg-emerald-50/40 border-emerald-100"
                      : isAtraso
                      ? "bg-rose-50/40 border-rose-100"
                      : "bg-slate-50/80 border-slate-100"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-slate-800">
                        Ciclo #{c.numeroCiclo}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isPago
                            ? "bg-emerald-100 text-emerald-800"
                            : isAtraso
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {isPago ? "Pago" : isAtraso ? "Em Atraso" : "Pendente"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Vencimento: {formatarData(c.dataVencimento)}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-black text-slate-900">
                      {formatarMoedaBRL(c.valorPrevisto)}
                    </p>
                    {c.comprovante && (
                      <span className="text-[10px] font-semibold text-slate-500 block mt-0.5">
                        {c.comprovante.status === "CONFIRMADO"
                          ? "✓ Comprovante Aprovado"
                          : "⏳ Em Conferência"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 6. Transparência do Grupo (Ordem de Sorteio do Consórcio) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs">
          <button
            onClick={() => setVerCiclosGrupo(!verCiclosGrupo)}
            className="w-full flex items-center justify-between text-left cursor-pointer"
          >
            <div>
              <h4 className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>👥</span> Ordem de Contemplação do Grupo
              </h4>
              <p className="text-[11px] text-slate-500">
                Transparência dos {ciclosGrupo.length} ciclos do consórcio
              </p>
            </div>
            <div className="text-slate-400">
              {verCiclosGrupo ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </button>

          {verCiclosGrupo && (
            <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 animate-in fade-in duration-150">
              {ciclosGrupo.map((cg: any, idx: number) => {
                const isMinhaCota = cg.numeroCota === cota.numero;
                const isContemplada = cg.status === "CONTEMPLADA";

                return (
                  <div
                    key={idx}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                      isMinhaCota
                        ? "bg-blue-50 border-blue-200 font-bold"
                        : "bg-slate-50/70 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-6 h-6 rounded-lg bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                        #{cg.ordemSorteio}
                      </span>
                      <span className="truncate">
                        {cg.participantes} {isMinhaCota && "(Você)"}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isContemplada
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {isContemplada ? "Contemplada" : "Aguardando"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 7. Dúvidas com o Organizador */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>Dúvidas sobre o consórcio?</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Entre em contato direto com o organizador ({consorcio.criadorNome})
            </p>
          </div>

          <a
            href={`https://wa.me/?text=${encodeURIComponent(
              `Olá ${consorcio.criadorNome}! Sou ${participante.nome}, da cota #${cota.numero} do consórcio ${consorcio.nome}. Gostaria de tirar uma dúvida.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer self-start sm:self-auto"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Falar no WhatsApp</span>
          </a>
        </div>

        {/* 8. Criar Senha de Acesso (Opcional) */}
        {!participante.temSenha && !senhaCriada && (
          <div className="bg-slate-50 rounded-3xl p-5 border border-slate-200 text-slate-800 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Deseja cadastrar uma senha? (Opcional)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Você não precisa de senha para usar este link. Mas se quiser, pode cadastrar para
                  acessar de qualquer dispositivo ou criar seus próprios consórcios.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMostrarCriarSenha(!mostrarCriarSenha)}
                className="text-xs font-bold text-blue-600 hover:underline flex-shrink-0 cursor-pointer"
              >
                {mostrarCriarSenha ? "Fechar" : "Criar Senha"}
              </button>
            </div>

            {mostrarCriarSenha && (
              <form onSubmit={handleCriarSenha} className="pt-3 border-t border-slate-200/80 space-y-3">
                {erroSenha && (
                  <p className="text-xs text-rose-600 font-semibold">{erroSenha}</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Nova Senha:
                    </label>
                    <input
                      type="password"
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                      placeholder="Mínimo 6 dígitos"
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">
                      Confirmar Senha:
                    </label>
                    <input
                      type="password"
                      value={confirmaSenha}
                      onChange={(e) => setConfirmaSenha(e.target.value)}
                      placeholder="Repita a senha"
                      className="w-full p-2.5 text-xs bg-white border border-slate-300 rounded-xl focus:border-blue-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={salvandoSenha}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {salvandoSenha ? "Salvando..." : "Salvar Senha"}
                </button>
              </form>
            )}
          </div>
        )}
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
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center font-bold text-xs transition cursor-pointer"
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
    </main>
  );
}
