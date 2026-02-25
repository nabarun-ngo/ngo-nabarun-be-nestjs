-- DropIndex
DROP INDEX "transactions_accountId_idx";

-- CreateIndex
CREATE INDEX "transactions_accountId_createdAt_id_idx" ON "transactions"("accountId", "createdAt", "id");
