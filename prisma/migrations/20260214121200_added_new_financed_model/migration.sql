-- CreateTable
CREATE TABLE "payment_transactions" (
    "id" TEXT NOT NULL,
    "gateway" VARCHAR(30) NOT NULL,
    "gatewayOrderId" VARCHAR(100),
    "gatewayPaymentId" VARCHAR(100),
    "status" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "receiptPrefix" VARCHAR(50),
    "referenceType" VARCHAR(30) NOT NULL,
    "referenceId" VARCHAR(255) NOT NULL,
    "gatewayPayload" JSONB,
    "failureReason" TEXT,
    "idempotencyKey" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "capturedAt" TIMESTAMP(3),

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fiscal_periods" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(20) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "closedById" VARCHAR(255),

    CONSTRAINT "fiscal_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL,
    "fiscalPeriodId" VARCHAR(255),
    "entryDate" DATE NOT NULL,
    "description" TEXT NOT NULL,
    "referenceType" VARCHAR(50),
    "referenceId" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "createdById" VARCHAR(255),
    "postedAt" TIMESTAMP(3),
    "postedById" VARCHAR(255),
    "reversalOfId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "journal_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "journalEntryId" VARCHAR(255) NOT NULL,
    "accountId" VARCHAR(255) NOT NULL,
    "lineNumber" INTEGER NOT NULL,
    "debitAmount" DECIMAL(15,2) NOT NULL,
    "creditAmount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "balanceAfter" DECIMAL(15,2),
    "particulars" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_gatewayOrderId_key" ON "payment_transactions"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "payment_transactions_idempotencyKey_key" ON "payment_transactions"("idempotencyKey");

-- CreateIndex
CREATE INDEX "payment_transactions_referenceType_referenceId_idx" ON "payment_transactions"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "payment_transactions_gatewayOrderId_idx" ON "payment_transactions"("gatewayOrderId");

-- CreateIndex
CREATE INDEX "payment_transactions_gatewayPaymentId_idx" ON "payment_transactions"("gatewayPaymentId");

-- CreateIndex
CREATE INDEX "payment_transactions_idempotencyKey_idx" ON "payment_transactions"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "fiscal_periods_code_key" ON "fiscal_periods"("code");

-- CreateIndex
CREATE INDEX "fiscal_periods_status_idx" ON "fiscal_periods"("status");

-- CreateIndex
CREATE INDEX "fiscal_periods_startDate_endDate_idx" ON "fiscal_periods"("startDate", "endDate");

-- CreateIndex
CREATE INDEX "journal_entries_entryDate_idx" ON "journal_entries"("entryDate");

-- CreateIndex
CREATE INDEX "journal_entries_referenceType_referenceId_idx" ON "journal_entries"("referenceType", "referenceId");

-- CreateIndex
CREATE INDEX "journal_entries_fiscalPeriodId_idx" ON "journal_entries"("fiscalPeriodId");

-- CreateIndex
CREATE INDEX "journal_entries_status_idx" ON "journal_entries"("status");

-- CreateIndex
CREATE INDEX "ledger_entries_accountId_createdAt_idx" ON "ledger_entries"("accountId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_journalEntryId_idx" ON "ledger_entries"("journalEntryId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_journalEntryId_lineNumber_key" ON "ledger_entries"("journalEntryId", "lineNumber");

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_fiscalPeriodId_fkey" FOREIGN KEY ("fiscalPeriodId") REFERENCES "fiscal_periods"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_entries" ADD CONSTRAINT "journal_entries_reversalOfId_fkey" FOREIGN KEY ("reversalOfId") REFERENCES "journal_entries"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
