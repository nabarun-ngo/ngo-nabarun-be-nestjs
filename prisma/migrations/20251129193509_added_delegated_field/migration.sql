/*
  Warnings:

  - You are about to drop the column `accountId` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `fromAccountId` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAccountId` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";

-- DropIndex
DROP INDEX "transactions_accountId_transactionDate_idx";

-- AlterTable
ALTER TABLE "accounts" ALTER COLUMN "bankDetail" SET DATA TYPE TEXT,
ALTER COLUMN "upiDetail" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "accountId",
ADD COLUMN     "fromAccountId" VARCHAR(255) NOT NULL,
ADD COLUMN     "particulars" TEXT,
ADD COLUMN     "toAccountId" VARCHAR(255) NOT NULL;

-- AlterTable
ALTER TABLE "workflow_instances" ADD COLUMN     "delegated" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "transactions_fromAccountId_toAccountId_transactionDate_idx" ON "transactions"("fromAccountId", "toAccountId", "transactionDate");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
