-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT,
    "passwordHash" TEXT,
    "role" TEXT NOT NULL DEFAULT 'COMUM',
    "preferredTheme" TEXT NOT NULL DEFAULT 'blue',
    "isActivated" BOOLEAN NOT NULL DEFAULT false,
    "receberPixDireto" BOOLEAN NOT NULL DEFAULT false,
    "tipoChavePix" TEXT,
    "chavePix" TEXT,
    "inviteToken" TEXT,
    "inviteExpiresAt" TIMESTAMP(3),
    "resetToken" TEXT,
    "resetExpiresAt" TIMESTAMP(3),
    "planoExpiraEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Consorcio" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "finalidade" TEXT,
    "regras" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ATIVO',
    "frequencia" TEXT NOT NULL DEFAULT 'MENSAL',
    "modeloContribuicao" TEXT NOT NULL DEFAULT 'FIXO',
    "valorCota" DOUBLE PRECISION NOT NULL,
    "valorAcrescimo" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorTotalBolada" DOUBLE PRECISION NOT NULL,
    "totalCotas" INTEGER NOT NULL,
    "tipoChavePix" TEXT DEFAULT 'CHAVE_ALEATORIA',
    "chavePix" TEXT,
    "dadosBancarios" TEXT,
    "dataPrimeiroVencimento" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "criadorId" TEXT NOT NULL,

    CONSTRAINT "Consorcio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cota" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "ordemSorteio" INTEGER,
    "isCompartilhada" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ATIVA',
    "tokenAcesso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotaParticipante" (
    "id" TEXT NOT NULL,
    "cotaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "percentual" DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    "valorParcela" DOUBLE PRECISION NOT NULL,
    "tokenAcesso" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CotaParticipante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contribuicao" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT NOT NULL,
    "cotaId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "numeroCiclo" INTEGER NOT NULL,
    "valorPrevisto" DOUBLE PRECISION NOT NULL,
    "dataVencimento" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "dataPagamento" TIMESTAMP(3),
    "motivoAlteracao" TEXT,
    "responsavelAlteracaoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contribuicao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comprovante" (
    "id" TEXT NOT NULL,
    "contribuicaoId" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "arquivoUrl" TEXT NOT NULL,
    "arquivoNome" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "motivoRecusa" TEXT,
    "analisadoPorId" TEXT,
    "analisadoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comprovante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditoriaLog" (
    "id" TEXT NOT NULL,
    "consorcioId" TEXT,
    "usuarioResponsavelId" TEXT NOT NULL,
    "usuarioAfetadoId" TEXT,
    "tipoAcao" TEXT NOT NULL,
    "detalhes" TEXT NOT NULL,
    "justificativa" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditoriaLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssinaturaPlano" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "plano" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "mesesVigencia" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "comprovanteUrl" TEXT,
    "comprovanteNome" TEXT,
    "solicitadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataInicio" TIMESTAMP(3),
    "dataFim" TIMESTAMP(3),
    "aprovadoPorId" TEXT,
    "motivoRecusa" TEXT,
    "observacoes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssinaturaPlano_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_inviteToken_key" ON "User"("inviteToken");

-- CreateIndex
CREATE UNIQUE INDEX "User_resetToken_key" ON "User"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "Cota_tokenAcesso_key" ON "Cota"("tokenAcesso");

-- CreateIndex
CREATE UNIQUE INDEX "CotaParticipante_tokenAcesso_key" ON "CotaParticipante"("tokenAcesso");

-- CreateIndex
CREATE UNIQUE INDEX "CotaParticipante_cotaId_usuarioId_key" ON "CotaParticipante"("cotaId", "usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "Comprovante_contribuicaoId_key" ON "Comprovante"("contribuicaoId");

-- AddForeignKey
ALTER TABLE "Consorcio" ADD CONSTRAINT "Consorcio_criadorId_fkey" FOREIGN KEY ("criadorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cota" ADD CONSTRAINT "Cota_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "Consorcio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotaParticipante" ADD CONSTRAINT "CotaParticipante_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "Cota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotaParticipante" ADD CONSTRAINT "CotaParticipante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribuicao" ADD CONSTRAINT "Contribuicao_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "Consorcio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribuicao" ADD CONSTRAINT "Contribuicao_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "Cota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contribuicao" ADD CONSTRAINT "Contribuicao_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_contribuicaoId_fkey" FOREIGN KEY ("contribuicaoId") REFERENCES "Contribuicao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comprovante" ADD CONSTRAINT "Comprovante_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_consorcioId_fkey" FOREIGN KEY ("consorcioId") REFERENCES "Consorcio"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditoriaLog" ADD CONSTRAINT "AuditoriaLog_usuarioResponsavelId_fkey" FOREIGN KEY ("usuarioResponsavelId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlano" ADD CONSTRAINT "AssinaturaPlano_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssinaturaPlano" ADD CONSTRAINT "AssinaturaPlano_aprovadoPorId_fkey" FOREIGN KEY ("aprovadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
