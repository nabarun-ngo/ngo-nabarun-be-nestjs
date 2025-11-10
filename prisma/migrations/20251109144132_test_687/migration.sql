-- AlterTable
ALTER TABLE "user_roles" ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "donorId" VARCHAR(255),
    "donorName" VARCHAR(100),
    "donorEmail" VARCHAR(100),
    "description" TEXT,
    "raisedDate" TIMESTAMP(3) NOT NULL,
    "paidDate" TIMESTAMP(3),
    "transactionId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "accountId" VARCHAR(255) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "requestedBy" VARCHAR(255) NOT NULL,
    "approvedBy" VARCHAR(255),
    "accountId" VARCHAR(255),
    "transactionId" VARCHAR(255),
    "receiptUrl" VARCHAR(500),
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "approvedDate" TIMESTAMP(3),
    "paidDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "accountId" VARCHAR(255),
    "transactionId" VARCHAR(255),
    "earningDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_type_status_idx" ON "accounts"("type", "status");

-- CreateIndex
CREATE UNIQUE INDEX "donations_transactionId_key" ON "donations"("transactionId");

-- CreateIndex
CREATE INDEX "donations_donorId_status_idx" ON "donations"("donorId", "status");

-- CreateIndex
CREATE INDEX "donations_type_status_idx" ON "donations"("type", "status");

-- CreateIndex
CREATE INDEX "donations_raisedDate_idx" ON "donations"("raisedDate");

-- CreateIndex
CREATE INDEX "transactions_accountId_transactionDate_idx" ON "transactions"("accountId", "transactionDate");

-- CreateIndex
CREATE INDEX "transactions_type_status_idx" ON "transactions"("type", "status");

-- CreateIndex
CREATE INDEX "transactions_referenceId_referenceType_idx" ON "transactions"("referenceId", "referenceType");

-- CreateIndex
CREATE UNIQUE INDEX "expenses_transactionId_key" ON "expenses"("transactionId");

-- CreateIndex
CREATE INDEX "expenses_category_status_idx" ON "expenses"("category", "status");

-- CreateIndex
CREATE INDEX "expenses_requestedBy_idx" ON "expenses"("requestedBy");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_transactionId_key" ON "earnings"("transactionId");

-- CreateIndex
CREATE INDEX "earnings_category_status_idx" ON "earnings"("category", "status");

-- CreateIndex
CREATE INDEX "earnings_source_idx" ON "earnings"("source");

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
