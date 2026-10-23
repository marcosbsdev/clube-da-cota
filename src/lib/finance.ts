/**
 * Regras financeiras e de cálculo do Clube da Cota (MVP)
 */

export type FrequenciaTipo = "SEMANAL" | "QUINZENAL" | "MENSAL" | "OUTRA";
export type ModeloContribuicao = "FIXO" | "ACRESCIMO_MENSAL";

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
  modeloContribuicao?: ModeloContribuicao;
  totalCotas: number;
}): ResumoFinanceiroCalculado {
  const isAcrescimo = modeloContribuicao === "ACRESCIMO_MENSAL";
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
  modelo: ModeloContribuicao = "FIXO",
  acrescimo: number = 0
): number {
  if (modelo === "ACRESCIMO_MENSAL") {
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
  modeloContribuicao?: ModeloContribuicao;
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

