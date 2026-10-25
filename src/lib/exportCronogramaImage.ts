/**
 * Utilitário de alta resolução para renderização e exportação do Cronograma
 * Oficial de Ciclos em imagem PNG elegante para compartilhamento no WhatsApp.
 */

export interface CicloExportItem {
  numCiclo: number;
  dataVencimento: string;
  participanteNome: string;
  boladaFormatada: string;
  isPrimeiro: boolean;
  isUltimo: boolean;
}

export interface DadosCronogramaExport {
  nomeConsorcio: string;
  totalCotas: number;
  valorCotaFormatado: string;
  valorTotalFormatado: string;
  frequencia: string;
  chavePix: string;
  tipoChavePix?: string;
  organizadorNome?: string;
  ciclos: CicloExportItem[];
}

/**
 * Carrega a imagem da logo do Clube da Cota de forma segura
 */
function carregarLogo(): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = "/icon-192x192.png";
  });
}

/**
 * Desenha um retângulo com cantos arredondados
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Gera um Blob PNG de alta resolução com o cronograma completo dos ciclos
 */
export async function gerarImagemCronogramaCanvas(
  dados: DadosCronogramaExport
): Promise<Blob> {
  const canvasWidth = 1080;
  const headerHeight = 330;
  const tableHeaderHeight = 52;
  const rowHeight = 56;
  const footerHeight = 130;
  const totalRows = dados.ciclos.length;
  const canvasHeight = headerHeight + tableHeaderHeight + totalRows * rowHeight + footerHeight;

  const canvas = document.createElement("canvas");
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Não foi possível inicializar o contexto 2D do Canvas.");
  }

  // 1. Fundo Global
  ctx.fillStyle = "#F8FAFC";
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // 2. Header Superior (Gradiente Navy / Slate Premium)
  const headerGradient = ctx.createLinearGradient(0, 0, canvasWidth, headerHeight);
  headerGradient.addColorStop(0, "#08101E");
  headerGradient.addColorStop(0.5, "#0F1E36");
  headerGradient.addColorStop(1, "#162846");
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, canvasWidth, headerHeight);

  // Linha de realce esmeralda no topo
  ctx.fillStyle = "#10B981";
  ctx.fillRect(0, 0, canvasWidth, 6);

  // Tentar carregar logo
  const logoImg = await carregarLogo();
  const logoX = 54;
  const logoY = 36;
  const logoSize = 64;

  if (logoImg) {
    ctx.save();
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 14);
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
  } else {
    // Fallback: Ícone estilizado com monograma
    ctx.fillStyle = "#10B981";
    roundRect(ctx, logoX, logoY, logoSize, logoSize, 14);
    ctx.fill();
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CC", logoX + logoSize / 2, logoY + 42);
  }

  // Título da Marca
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 24px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("CLUBE DA COTA", logoX + logoSize + 18, logoY + 28);

  ctx.fillStyle = "#34D399";
  ctx.font = "700 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("CONTROLE INTELIGENTE DE CONSÓRCIOS ENTRE AMIGOS", logoX + logoSize + 18, logoY + 48);

  // Selo Auditado (Canto Superior Direito)
  const sealWidth = 230;
  const sealHeight = 36;
  const sealX = canvasWidth - sealWidth - 54;
  const sealY = logoY + 12;

  ctx.fillStyle = "rgba(16, 185, 129, 0.15)";
  roundRect(ctx, sealX, sealY, sealWidth, sealHeight, 18);
  ctx.fill();
  ctx.strokeStyle = "rgba(52, 211, 153, 0.4)";
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = "#34D399";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✓ ORDEM OFICIAL DO SORTEIO", sealX + sealWidth / 2, sealY + 23);

  // Nome do Consórcio
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "900 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  const nomeTexto = dados.nomeConsorcio || "Consórcio Entre Amigos";
  ctx.fillText(nomeTexto, 54, 152);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "500 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(
    `Cronograma Completo dos ${dados.totalCotas} Ciclos de Pagamento & Contemplação`,
    54,
    180
  );

  // 4 Cards de Métricas no Header
  const metricCards = [
    { label: "VALOR DA COTA", value: dados.valorCotaFormatado },
    { label: "BOLADA TOTAL", value: dados.valorTotalFormatado },
    { label: "DURAÇÃO TOTAL", value: dados.frequencia },
    {
      label: "CHAVE PIX",
      value: dados.chavePix ? `${dados.chavePix}` : "A definir",
    },
  ];

  const cardGap = 16;
  const cardWidth = (canvasWidth - 54 * 2 - cardGap * 3) / 4;
  const cardHeight = 72;
  const cardY = 214;

  metricCards.forEach((card, i) => {
    const cX = 54 + i * (cardWidth + cardGap);
    ctx.fillStyle = "rgba(255, 255, 255, 0.07)";
    roundRect(ctx, cX, cardY, cardWidth, cardHeight, 14);
    ctx.fill();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.textAlign = "left";
    ctx.fillStyle = "#94A3B8";
    ctx.font = "700 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(card.label, cX + 16, cardY + 26);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "800 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    // Trunca se muito longo
    let val = card.value;
    if (val.length > 20) val = val.substring(0, 18) + "...";
    ctx.fillText(val, cX + 16, cardY + 52);
  });

  // 3. Tabela de Ciclos
  const tableY = headerHeight;

  // Cabeçalho da Tabela
  ctx.fillStyle = "#0F172A";
  ctx.fillRect(0, tableY, canvasWidth, tableHeaderHeight);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "bold 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

  // Colunas:
  // Ciclo: x = 54
  // Vencimento: x = 200
  // Contemplado: x = 400
  // Bolada: x = canvasWidth - 54 (Right aligned)
  ctx.textAlign = "left";
  ctx.fillText("CICLO", 54, tableY + 31);
  ctx.fillText("VENCIMENTO", 190, tableY + 31);
  ctx.fillText("PARTICIPANTE CONTEMPLADO (ORDEM DE RECEBIMENTO)", 380, tableY + 31);
  ctx.textAlign = "right";
  ctx.fillText("BOLADA ENTREGUE", canvasWidth - 54, tableY + 31);

  // Linhas da Tabela
  dados.ciclos.forEach((ciclo, idx) => {
    const rowY = tableY + tableHeaderHeight + idx * rowHeight;

    // Fundo da linha
    if (ciclo.isUltimo) {
      ctx.fillStyle = "#EFF6FF"; // Destaque azul suave no último
    } else if (ciclo.isPrimeiro) {
      ctx.fillStyle = "#ECFDF5"; // Destaque verde suave no primeiro
    } else if (idx % 2 === 0) {
      ctx.fillStyle = "#FFFFFF";
    } else {
      ctx.fillStyle = "#F8FAFC";
    }
    ctx.fillRect(0, rowY, canvasWidth, rowHeight);

    // Linha divisória fina
    ctx.fillStyle = "#E2E8F0";
    ctx.fillRect(54, rowY + rowHeight - 1, canvasWidth - 108, 1);

    // Coluna 1: Ciclo (Badge ou texto)
    ctx.textAlign = "left";
    ctx.font = "800 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillStyle = ciclo.isUltimo ? "#1D4ED8" : "#0F172A";
    ctx.fillText(`#${ciclo.numCiclo}`, 54, rowY + 34);

    if (ciclo.isPrimeiro) {
      ctx.fillStyle = "#10B981";
      roundRect(ctx, 92, rowY + 18, 54, 22, 6);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Início", 102, rowY + 33);
    } else if (ciclo.isUltimo) {
      ctx.fillStyle = "#1D4ED8";
      roundRect(ctx, 96, rowY + 18, 54, 22, 6);
      ctx.fill();
      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("Fim 🏁", 104, rowY + 33);
    }

    // Coluna 2: Vencimento
    ctx.fillStyle = "#334155";
    ctx.font = "600 14px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(ciclo.dataVencimento, 190, rowY + 34);

    // Coluna 3: Participante Contemplado
    ctx.fillStyle = "#0F172A";
    ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    let partNome = ciclo.participanteNome;
    if (partNome.length > 40) {
      partNome = partNome.substring(0, 38) + "...";
    }
    ctx.fillText(partNome, 380, rowY + 34);

    // Coluna 4: Bolada Entregue
    ctx.textAlign = "right";
    ctx.fillStyle = ciclo.isUltimo ? "#1D4ED8" : "#047857";
    ctx.font = "900 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(ciclo.boladaFormatada, canvasWidth - 54, rowY + 34);
  });

  // 4. Rodapé Elegante com Marca & Propaganda
  const footerY = canvasHeight - footerHeight;

  ctx.fillStyle = "#08101E";
  ctx.fillRect(0, footerY, canvasWidth, footerHeight);

  // Linha de realce verde no topo do rodapé
  ctx.fillStyle = "#10B981";
  ctx.fillRect(0, footerY, canvasWidth, 3);

  // Informações do Rodapé (Esquerda)
  ctx.textAlign = "left";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "800 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Clube da Cota • Plataforma de Gestão de Consórcios entre Amigos", 54, footerY + 45);

  ctx.fillStyle = "#94A3B8";
  ctx.font = "500 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(
    "Organize consórcios com segurança, transparência total e controle de recebimentos.",
    54,
    footerY + 70
  );

  ctx.fillStyle = "#34D399";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("www.clubedacota.com.br", 54, footerY + 95);

  // Carimbo de Emissão e Auditoria (Direita)
  const agora = new Date();
  const dataHoraFormatada = `${agora.toLocaleDateString("pt-BR")} às ${agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

  ctx.textAlign = "right";
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("ORDEM OFICIAL AUDITADA", canvasWidth - 54, footerY + 45);

  ctx.fillStyle = "#64748B";
  ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText(`Emitido em ${dataHoraFormatada}`, canvasWidth - 54, footerY + 70);

  ctx.fillStyle = "#475569";
  ctx.font = "italic 11px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Válido como comprovante do sorteio", canvasWidth - 54, footerY + 95);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Falha ao converter canvas para Blob PNG."));
      }
    }, "image/png");
  });
}

/**
 * Realiza o download direto da imagem PNG no navegador
 */
export function baixarBlobComoArquivo(blob: Blob, nomeArquivo: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nomeArquivo;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export interface ResultadoCompartilhamento {
  compartilhadoDireto: boolean;
  copiadoClipboard?: boolean;
  nomeArquivo: string;
  textoMensagem: string;
  urlWhatsApp: string;
}

/**
 * Tenta copiar a imagem PNG diretamente para a área de transferência do usuário
 */
export async function copiarImagemParaClipboard(blob: Blob): Promise<boolean> {
  if (
    typeof navigator !== "undefined" &&
    navigator.clipboard &&
    typeof ClipboardItem !== "undefined"
  ) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "image/png": blob,
        }),
      ]);
      return true;
    } catch (err) {
      console.warn("Falha ao copiar imagem para clipboard:", err);
    }
  }
  return false;
}

/**
 * Tenta compartilhar diretamente a imagem via Web Share API (mobile/WhatsApp com HTTPS),
 * ou faz o download da imagem e prepara o envio assistido para o WhatsApp.
 */
export async function compartilharCronogramaWhatsApp(
  dados: DadosCronogramaExport,
  blob: Blob
): Promise<ResultadoCompartilhamento> {
  const slug = (dados.nomeConsorcio || "consorcio")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "-");

  const nomeArquivo = `cronograma-${slug}.png`;
  const file = new File([blob], nomeArquivo, { type: "image/png" });

  const textoMensagem = `🎲 *Cronograma Oficial de Contemplação*\nConsórcio: *${dados.nomeConsorcio}*\nTotal: *${dados.valorTotalFormatado}* (${dados.totalCotas} Meses)\n\nConfira a ordem oficial de recebimento de cada mês gerada pelo Clube da Cota!`;
  const urlWhatsApp = `https://api.whatsapp.com/send?text=${encodeURIComponent(textoMensagem)}`;

  // 1. Tentar Web Share API com arquivo (funciona nativamente no WhatsApp mobile / Android / iOS com HTTPS)
  if (
    typeof navigator !== "undefined" &&
    navigator.canShare &&
    navigator.canShare({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: `Cronograma do Consórcio - ${dados.nomeConsorcio}`,
        text: textoMensagem,
      });
      return {
        compartilhadoDireto: true,
        nomeArquivo,
        textoMensagem,
        urlWhatsApp,
      };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return {
          compartilhadoDireto: true,
          nomeArquivo,
          textoMensagem,
          urlWhatsApp,
        }; // Usuário cancelou a folha de compartilhamento
      }
      console.warn("Web Share falhou, usando fluxo assistido:", err);
    }
  }

  // 2. Se Web Share com arquivo não estiver disponível (ex: rede local HTTP ou navegador desktop):
  // Baixa o arquivo PNG e tenta copiar para a área de transferência
  const copiado = await copiarImagemParaClipboard(blob);
  baixarBlobComoArquivo(blob, nomeArquivo);

  return {
    compartilhadoDireto: false,
    copiadoClipboard: copiado,
    nomeArquivo,
    textoMensagem,
    urlWhatsApp,
  };
}
