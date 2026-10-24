/**
 * Regras financeiras e de cálculo do Clube da Cota (MVP)
 */

export type FrequenciaTipo = "SEMANAL" | "QUINZENAL" | "MENSAL" | "OUTRA";
export type ModeloContribuicao = "FIXO" | "ACRESCIMO_MENSAL" | "PROGRESSIVO";

/**
 * Retorna se o consórcio adota o modelo com acréscimo mensal progressivo.
 * Suporta os identificadores 'ACRESCIMO_MENSAL' e 'PROGRESSIVO'.
 */
export function isModeloAcrescimo(modelo?: string | null): boolean {
  if (!modelo) return false;
  return modelo === "ACRESCIMO_MENSAL" || modelo === "PROGRESSIVO";
}

export interface DateGenerationParams {
  dataPrimeiroVencimento: Date;
  frequencia: FrequenciaTipo;
  quantidadeCiclos: number;
}

/**
 * Formata valores numéricos para moeda no padrão brasileiro (BRL)
 * Separando milhões, milhares, centenas e centavos (ex: R$ 1.200,00)
 */
export function formatarMoedaBRL(valor: number): string {
  if (isNaN(valor) || valor === null || valor === undefined) return "R$ 0,00";
  return `R$ ${valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Converte string digitada ou com máscara em número float válido
 */
export function parseMoedaBRL(valorStr: string): number {
  if (!valorStr) return 0;
  const digits = valorStr.replace(/\D/g, "");
  if (!digits) return 0;
  return Number(digits) / 100;
}

export interface ResumoFinanceiroCalculado {
  parcelaPrimeiroCiclo: number;
  parcelaUltimoCiclo: number;
  boladaPrimeiroCiclo: number;
  boladaUltimoCiclo: number;
  totalPagoPorCota: number;
  volumeTotalMovimentado: number;
}

/**
 * Realiza a validação e consolidação matemática completa dos valores de um consórcio
 */
export function calcularResumoFinanceiroConsorcio({
  valorCotaBase,
  valorAcrescimo = 0,
  modeloContribuicao = "FIXO",
  totalCotas,
}: {
  valorCotaBase: number;
  valorAcrescimo?: number;
  modeloContribuicao?: ModeloContribuicao | string;
  totalCotas: number;
}): ResumoFinanceiroCalculado {
  const isAcrescimo = isModeloAcrescimo(modeloContribuicao);
  const acrescimo = isAcrescimo ? Math.max(0, valorAcrescimo) : 0;
  const cotas = Math.max(1, totalCotas);

  const parcelaPrimeiroCiclo = valorCotaBase;
  const parcelaUltimoCiclo = valorCotaBase + (cotas - 1) * acrescimo;

  const boladaPrimeiroCiclo = parcelaPrimeiroCiclo * cotas;
  const boladaUltimoCiclo = parcelaUltimoCiclo * cotas;

  // Soma de uma PA (Progressão Aritmética) para calcular o total pago por 1 cota ao longo de todos os ciclos
  const totalPagoPorCota = ((parcelaPrimeiroCiclo + parcelaUltimoCiclo) * cotas) / 2;

  // Volume total movimentado somando todas as cotas
  const volumeTotalMovimentado = totalPagoPorCota * cotas;

  return {
    parcelaPrimeiroCiclo,
    parcelaUltimoCiclo,
    boladaPrimeiroCiclo,
    boladaUltimoCiclo,
    totalPagoPorCota,
    volumeTotalMovimentado,
  };
}

/**
 * Calcula o valor da cota para um ciclo específico (considerando valor fixo ou acréscimo mensal progressivo)
 */
export function calcularValorCiclo(
  numeroCiclo: number, // 1, 2, 3...
  valorBase: number,
  modelo: ModeloContribuicao | string = "FIXO",
  acrescimo: number = 0
): number {
  if (isModeloAcrescimo(modelo)) {
    return valorBase + (numeroCiclo - 1) * acrescimo;
  }
  return valorBase;
}

/**
 * Calcula o total global arrecadado ao longo de todos os ciclos
 */
export function calcularTotalArrecadacaoConsorcio({
  valorCotaBase,
  valorAcrescimo = 0,
  modeloContribuicao = "FIXO",
  totalCotas,
}: {
  valorCotaBase: number;
  valorAcrescimo?: number;
  modeloContribuicao?: ModeloContribuicao | string;
  totalCotas: number;
}): number {
  let total = 0;
  for (let ciclo = 1; ciclo <= totalCotas; ciclo++) {
    const valorNesseCiclo = calcularValorCiclo(ciclo, valorCotaBase, modeloContribuicao, valorAcrescimo);
    total += valorNesseCiclo * totalCotas;
  }
  return total;
}

/**
 * Calcula as próximas datas de vencimento com base na frequência e no primeiro vencimento
 */
export function calcularDatasVencimento({
  dataPrimeiroVencimento,
  frequencia,
  quantidadeCiclos,
}: DateGenerationParams): Date[] {
  const datas: Date[] = [];
  const base = new Date(dataPrimeiroVencimento);

  for (let i = 0; i < quantidadeCiclos; i++) {
    const data = new Date(base);
    if (frequencia === "SEMANAL") {
      data.setDate(base.getDate() + i * 7);
    } else if (frequencia === "QUINZENAL") {
      data.setDate(base.getDate() + i * 14);
    } else if (frequencia === "MENSAL") {
      data.setMonth(base.getMonth() + i);
    } else {
      // Padrão de segurança: mensal
      data.setMonth(base.getMonth() + i);
    }
    datas.push(data);
  }

  return datas;
}

/**
 * Validação de cotas compartilhadas: a soma das frações/percentuais deve totalizar 100%
 * e a soma dos valores deve bater exatamente com o valor total da cota.
 */
export function validarDivisaoCota(
  valorTotalCota: number,
  participantes: { usuarioId: string; percentual?: number; valorParcela: number }[]
): { valido: boolean; mensagem?: string } {
  if (!participantes || participantes.length === 0) {
    return { valido: false, mensagem: "A cota precisa ter pelo menos um participante." };
  }

  const somaValores = participantes.reduce((acc, p) => acc + p.valorParcela, 0);
  const diferenca = Math.abs(somaValores - valorTotalCota);

  // Tolerância de centavos
  if (diferenca > 0.05) {
    return {
      valido: false,
      mensagem: `A soma das parcelas (R$ ${somaValores.toFixed(2)}) não confere com o valor da cota (R$ ${valorTotalCota.toFixed(2)}).`,
    };
  }

  return { valido: true };
}

/**
 * Validação de quantidade mínima de participantes no consórcio:
 * Um consórcio deve ter obrigatoriamente no mínimo 2 participantes (não pode ser unipessoal).
 * Cotas compartilhadas contam como 2 pessoas distintas.
 */
export function validarMinimoParticipantes(
  participantes: { isCompartilhada?: boolean }[]
): { valido: boolean; totalPessoas: number; mensagem?: string } {
  if (!participantes || participantes.length === 0) {
    return {
      valido: false,
      totalPessoas: 0,
      mensagem: "Um consórcio deve ter obrigatoriamente no mínimo 2 participantes.",
    };
  }

  const totalPessoas = participantes.reduce((acc, p) => acc + (p.isCompartilhada ? 2 : 1), 0);
  if (totalPessoas < 2) {
    return {
      valido: false,
      totalPessoas,
      mensagem: "Um consórcio deve ter obrigatoriamente no mínimo 2 participantes.",
    };
  }

  return { valido: true, totalPessoas };
}

/**
 * Determina o status da contribuição com base na data de vencimento e confirmação
 */
export function determinarStatusContribuicao(
  statusAtual: "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO",
  dataVencimento: Date,
  dataAtual: Date = new Date()
): "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO" {
  if (statusAtual === "PAGO" || statusAtual === "CANCELADO") {
    return statusAtual;
  }

  // Uma contribuição é considerada atrasada a partir do dia seguinte ao vencimento
  const vencimentoFimDoDia = new Date(dataVencimento);
  vencimentoFimDoDia.setHours(23, 59, 59, 999);

  if (dataAtual > vencimentoFimDoDia) {
    return "EM_ATRASO";
  }

  return "PENDENTE";
}

/**
 * Calcula os 4 indicadores financeiros do Painel do Criador
 */
export function calcularIndicadoresConsorcio(
  contribuicoes: {
    valorPrevisto: number;
    status: "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";
    dataVencimento: Date;
  }[],
  dataAtual: Date = new Date()
) {
  let totalPrevisto = 0;
  let totalRecebido = 0;
  let totalPendentePrazo = 0;
  let totalEmAtraso = 0;
  let quantidadeAtrasados = 0;

  for (const c of contribuicoes) {
    if (c.status === "CANCELADO") continue;

    totalPrevisto += c.valorPrevisto;

    if (c.status === "PAGO") {
      totalRecebido += c.valorPrevisto;
    } else {
      const statusEfetivo = determinarStatusContribuicao(c.status, c.dataVencimento, dataAtual);
      if (statusEfetivo === "EM_ATRASO") {
        totalEmAtraso += c.valorPrevisto;
        quantidadeAtrasados++;
      } else {
        totalPendentePrazo += c.valorPrevisto;
      }
    }
  }

  const percentualRecebido = totalPrevisto > 0 ? (totalRecebido / totalPrevisto) * 100 : 0;

  return {
    totalPrevisto,
    totalRecebido,
    totalPendentePrazo,
    totalEmAtraso,
    quantidadeAtrasados,
    percentualRecebido: Math.round(percentualRecebido),
  };
}

/**
 * Formata datas de forma segura contra desvios de fuso horário (ex: UTC-3 de Brasília)
 * Evita que '2026-11-05' seja exibido como '04/11/2026' ou '06/11/2026'.
 */
export function formatarDataSegura(data: string | Date | null | undefined): string {
  if (!data) return "";
  if (typeof data === "string") {
    const matchYmd = data.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (matchYmd) {
      const [, ano, mes, dia] = matchYmd;
      return `${dia}/${mes}/${ano}`;
    }
  }
  const d = new Date(data);
  if (isNaN(d.getTime())) return "";
  const isZeroHoraUtc = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
  return d.toLocaleDateString("pt-BR", {
    timeZone: isZeroHoraUtc ? "UTC" : undefined,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/**
 * Retorna o mês e ano por extenso no padrão brasileiro (ex: "Janeiro de 2027")
 * Seguro contra desvios de fuso horário.
 */
export function formatarMesEAnoSeguro(data: string | Date | null | undefined): string {
  if (!data) return "";
  const meses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];
  if (typeof data === "string") {
    const matchYmd = data.match(/^(\d{4})-(\d{2})/);
    if (matchYmd) {
      const [, ano, mes] = matchYmd;
      const mesNum = parseInt(mes, 10);
      if (mesNum >= 1 && mesNum <= 12) {
        return `${meses[mesNum - 1]} de ${ano}`;
      }
    }
  }
  const d = new Date(data);
  if (isNaN(d.getTime())) return "";
  const isZeroHoraUtc = d.getUTCHours() === 0 && d.getUTCMinutes() === 0;
  const mesIndex = isZeroHoraUtc ? d.getUTCMonth() : d.getMonth();
  const ano = isZeroHoraUtc ? d.getUTCFullYear() : d.getFullYear();
  return `${meses[mesIndex]} de ${ano}`;
}

/**
 * Retorna a data prevista para um ciclo específico do consórcio,
 * considerando a data do primeiro vencimento, frequência e quantidade de ciclos.
 */
export function calcularDataCiclo(
  consorcio: {
    dataPrimeiroVencimento?: string | Date | null;
    dataInicio?: string | Date | null;
    frequencia?: string | null;
    contribuicoes?: { numeroCiclo: number; dataVencimento: string | Date }[];
  },
  numeroCiclo: number
): Date {
  // 1. Tenta buscar primeiro nas contribuições reais já geradas
  const contrib = consorcio?.contribuicoes?.find((c) => c.numeroCiclo === numeroCiclo);
  if (contrib?.dataVencimento) {
    return new Date(contrib.dataVencimento);
  }

  // 2. Calcula matematicamente com base no primeiro vencimento ou início
  const baseRaw = consorcio?.dataPrimeiroVencimento || consorcio?.dataInicio || new Date();
  const base = new Date(baseRaw);
  const freq = consorcio?.frequencia || "MENSAL";
  const offset = Math.max(0, numeroCiclo - 1);
  const data = new Date(base);

  if (freq === "SEMANAL") {
    data.setDate(base.getDate() + offset * 7);
  } else if (freq === "QUINZENAL") {
    data.setDate(base.getDate() + offset * 14);
  } else {
    // Padrão Mensal com proteção UTC / Fuso
    const isZeroUtc = base.getUTCHours() === 0 && base.getUTCMinutes() === 0;
    if (isZeroUtc) {
      const diaOriginal = base.getUTCDate();
      data.setUTCMonth(base.getUTCMonth() + offset);
      if (data.getUTCDate() !== diaOriginal) {
        data.setUTCDate(0);
      }
    } else {
      const diaOriginal = base.getDate();
      data.setMonth(base.getMonth() + offset);
      if (data.getDate() !== diaOriginal) {
        data.setDate(0);
      }
    }
  }

  return data;
}

/**
 * Retorna o mês e ano formatado por extenso (ex: "Outubro de 2026") para um ciclo específico
 */
export function formatarMesAnoCiclo(
  consorcio: {
    dataPrimeiroVencimento?: string | Date | null;
    dataInicio?: string | Date | null;
    frequencia?: string | null;
    contribuicoes?: { numeroCiclo: number; dataVencimento: string | Date }[];
  },
  numeroCiclo: number
): string {
  const data = calcularDataCiclo(consorcio, numeroCiclo);
  return formatarMesEAnoSeguro(data);
}

export type TipoChavePix = "CELULAR" | "CPF_CNPJ" | "EMAIL" | "CHAVE_ALEATORIA";

export const TIPOS_CHAVE_PIX: {
  value: TipoChavePix;
  label: string;
  placeholder: string;
  exemplo: string;
}[] = [
  {
    value: "CELULAR",
    label: "Celular",
    placeholder: "(00) 00000-0000",
    exemplo: "(11) 98765-4321",
  },
  {
    value: "CPF_CNPJ",
    label: "CPF/CNPJ",
    placeholder: "000.000.000-00 ou 00.000.000/0000-00",
    exemplo: "123.456.789-00",
  },
  {
    value: "EMAIL",
    label: "E-mail",
    placeholder: "exemplo@dominio.com",
    exemplo: "contato@email.com",
  },
  {
    value: "CHAVE_ALEATORIA",
    label: "Chave Aleatória",
    placeholder: "Chave aleatória (UUID)",
    exemplo: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
];

export function getTipoChavePixLabel(tipo?: string | null): string {
  const achado = TIPOS_CHAVE_PIX.find((t) => t.value === tipo);
  return achado?.label || "Chave Aleatória";
}

/**
 * Calcula os valores de bolada bruta e líquida para um ciclo específico.
 * Se o participante optou por Pix direto na conta (e possui cadastro ativo e chave informada),
 * a bolada líquida é o valor arrecadado dos demais participantes (totalCotas - 1) * valorCota,
 * e sua própria cota fica retida no bolso.
 * Se o participante não optou por Pix direto ou não concluiu cadastro, a bolada é 100% bruta (valor cheio).
 */
export function calcularBoladaCiclo({
  numeroCiclo,
  valorBase,
  modelo = "FIXO",
  acrescimo = 0,
  totalCotas,
  temPixDireto,
}: {
  numeroCiclo: number;
  valorBase: number;
  modelo?: string | null;
  acrescimo?: number;
  totalCotas: number;
  temPixDireto: boolean;
}) {
  const valorCotaNoCiclo = calcularValorCiclo(numeroCiclo, valorBase, modelo || "FIXO", acrescimo);
  const cotas = Math.max(1, totalCotas);
  const boladaTotal = valorCotaNoCiclo * cotas;
  const boladaLiquida = temPixDireto ? valorCotaNoCiclo * Math.max(1, cotas - 1) : boladaTotal;
  const cotaPropriaRetida = temPixDireto ? valorCotaNoCiclo : 0;

  return {
    valorCotaNoCiclo,
    boladaTotal,
    boladaLiquida,
    cotaPropriaRetida,
    temPixDireto,
  };
}

/**
 * Remove caracteres não numéricos de um telefone
 */
export function sanitizarTelefone(valor?: string | null): string {
  if (!valor) return "";
  return valor.replace(/\D/g, "");
}

/**
 * Aplica máscara brasileira padrão a um número de telefone/celular:
 * Ex: (11) 98765-4321 ou (11) 8765-4321
 */
export function formatarTelefone(valor?: string | null): string {
  const digits = sanitizarTelefone(valor);
  if (!digits) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Gera URL oficial de envio direto via WhatsApp Web / App.
 * Se houver telefone informado, adiciona o DDI Brasil (55) caso necessário.
 */
export function gerarLinkWhatsApp({
  telefone,
  mensagem,
}: {
  telefone?: string | null;
  mensagem: string;
}): string {
  const digits = sanitizarTelefone(telefone);
  const textoCodificado = encodeURIComponent(mensagem);

  if (digits.length >= 10) {
    const ddi = digits.startsWith("55") ? digits : `55${digits}`;
    return `https://wa.me/${ddi}?text=${textoCodificado}`;
  }

  return `https://wa.me/?text=${textoCodificado}`;
}

/**
 * Estrutura com os indicadores de ciclo e encerramento de um consórcio
 */
export interface StatusCicloConsorcio {
  isCicloConcluido: boolean;
  dataUltimoVencimento: Date | null;
  dataUltimoVencimentoFormatada: string;
  diasDecorridos: number;
  totalContribuicoes: number;
  totalPagas: number;
  totalPendentes: number;
  is100PorcentoQuitado: boolean;
  porcentagemQuitado: number;
}

/**
 * Analisa se um consórcio atingiu o fim do seu cronograma de vencimentos
 * e calcula o status de quitação das mensalidades.
 */
export function analisarCicloConsorcio(consorcio: {
  status?: string | null;
  totalCotas?: number | null;
  dataPrimeiroVencimento?: string | Date | null;
  dataInicio?: string | Date | null;
  frequencia?: string | null;
  contribuicoes?: Array<{
    numeroCiclo: number;
    dataVencimento: string | Date;
    status: string;
    valorPrevisto?: number;
  }>;
}): StatusCicloConsorcio {
  const contribuicoes = consorcio.contribuicoes || [];
  let dataUltimoVencimento: Date | null = null;

  if (contribuicoes.length > 0) {
    const timestamps = contribuicoes.map((c) => new Date(c.dataVencimento).getTime());
    dataUltimoVencimento = new Date(Math.max(...timestamps));
  } else if (consorcio.totalCotas && consorcio.totalCotas > 0) {
    dataUltimoVencimento = calcularDataCiclo(consorcio, consorcio.totalCotas);
  }

  const hoje = new Date();
  let diasDecorridos = 0;
  let isCicloConcluido = false;

  if (dataUltimoVencimento && !isNaN(dataUltimoVencimento.getTime())) {
    const diffMs = hoje.getTime() - dataUltimoVencimento.getTime();
    diasDecorridos = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    isCicloConcluido = diffMs > 0;
  }

  const totalContribuicoes = contribuicoes.length;
  const totalPagas = contribuicoes.filter((c) => c.status === "PAGO").length;
  const totalPendentes = contribuicoes.filter((c) => c.status !== "PAGO").length;
  const is100PorcentoQuitado = totalContribuicoes > 0 && totalPendentes === 0;
  const porcentagemQuitado =
    totalContribuicoes > 0 ? Math.round((totalPagas / totalContribuicoes) * 100) : 0;

  return {
    isCicloConcluido,
    dataUltimoVencimento,
    dataUltimoVencimentoFormatada: formatarDataSegura(dataUltimoVencimento),
    diasDecorridos,
    totalContribuicoes,
    totalPagas,
    totalPendentes,
    is100PorcentoQuitado,
    porcentagemQuitado,
  };
}

/**
 * Gera mensagem contextualizada de follow-up e customer success para o WhatsApp do organizador.
 */
export function gerarMensagemFollowupConsorcio(input: {
  nomeCriador: string;
  nomeConsorcio: string;
  isQuitado: boolean;
  totalPendentes: number;
  planoCriador: "COMUM" | "PRO" | "PRO_MASTER";
}): string {
  const primeiroNome = input.nomeCriador ? input.nomeCriador.trim().split(" ")[0] : "Organizador";

  if (input.isQuitado) {
    if (input.planoCriador === "COMUM") {
      return `Olá, ${primeiroNome}! Tudo bem? Aqui é o Marcos Batista do Clube da Cota! 🎉

Passando para parabenizar pela conclusão do seu consórcio "${input.nomeConsorcio}". Todos os pagamentos foram 100% quitados com sucesso!

Para você continuar aproveitando o Clube da Cota:
1️⃣ Caso queira abrir um novo consórcio gratuitamente, basta encerrar este grupo no seu painel para liberar sua vaga no Plano Comum.
2️⃣ Se preferir gerenciar múltiplos consórcios simultaneamente com seus amigos ou família, você pode fazer o upgrade para o Plano Pro (até 3 consórcios) ou Pro Master (ilimitados).

Precisando de qualquer suporte, estou à disposição!`;
    }

    return `Olá, ${primeiroNome}! Tudo bem? Aqui é o Marcos Batista do Clube da Cota! 🎉

Parabéns pela conclusão do consórcio "${input.nomeConsorcio}"! Todas as cotas foram integralmente quitadas.

Você já pode encerrar este grupo no seu painel para arquivar o histórico com segurança e liberar limite na sua assinatura ${input.planoCriador === "PRO_MASTER" ? "Pro Master" : "Pro"} para criar novos consórcios.

Conte comigo se precisar de qualquer apoio!`;
  }

  return `Olá, ${primeiroNome}! Tudo bem? Aqui é o Marcos Batista do Clube da Cota.

Notei que o prazo programado do consórcio "${input.nomeConsorcio}" já terminou e ainda constam ${input.totalPendentes} parcela(s) pendente(s).

Gostaria de saber se precisa de algum suporte com a plataforma ou na conferência dos pagamentos para ajudar na finalização do seu grupo. Quando concluir tudo, você poderá encerrá-lo no painel para arquivar e liberar vaga para novos consórcios!`;
}



