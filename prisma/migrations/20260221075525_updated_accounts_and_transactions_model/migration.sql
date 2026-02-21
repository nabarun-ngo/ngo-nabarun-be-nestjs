/*
  Warnings:

  - You are about to drop the column `donationId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `fromAccountBalance` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `fromAccountId` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `toAccountBalance` on the `transactions` table. All the data in the column will be lost.
  - You are about to drop the column `toAccountId` on the `transactions` table. All the data in the column will be lost.
  - Added the required column `balanceAfter` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transactionRef` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_donationId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_fromAccountId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_toAccountId_fkey";

-- DropIndex
DROP INDEX "transactions_fromAccountId_toAccountId_transactionDate_idx";

-- AlterTable
ALTER TABLE "transactions" DROP COLUMN "donationId",
DROP COLUMN "fromAccountBalance",
DROP COLUMN "fromAccountId",
DROP COLUMN "toAccountBalance",
DROP COLUMN "toAccountId",
ADD COLUMN     "accountId" VARCHAR(255),
ADD COLUMN     "balanceAfter" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "refAccountId" VARCHAR(255),
ADD COLUMN     "transactionRef" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "transactions_accountId_idx" ON "transactions"("accountId");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;
