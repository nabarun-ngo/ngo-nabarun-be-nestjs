/*
  Warnings:

  - You are about to drop the column `transactionId` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `approvedBy` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `approvedDate` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `paidDate` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `receiptUrl` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `requestedBy` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `transactionId` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `createdById` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `paidById` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_transactionId_fkey";

-- DropIndex
DROP INDEX "donations_transactionId_key";

-- DropIndex
DROP INDEX "expenses_category_status_idx";

-- DropIndex
DROP INDEX "expenses_requestedBy_idx";

-- DropIndex
DROP INDEX "expenses_transactionId_key";

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "transactionId";

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "approvedBy",
DROP COLUMN "approvedDate",
DROP COLUMN "category",
DROP COLUMN "paidDate",
DROP COLUMN "receiptUrl",
DROP COLUMN "requestedBy",
DROP COLUMN "transactionId",
ADD COLUMN     "accountName" VARCHAR(255),
ADD COLUMN     "createdById" VARCHAR(255) NOT NULL,
ADD COLUMN     "createdByName" VARCHAR(255),
ADD COLUMN     "createdByUserId" VARCHAR(255),
ADD COLUMN     "expenseCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "finalizedById" VARCHAR(255),
ADD COLUMN     "finalizedByName" VARCHAR(255),
ADD COLUMN     "finalizedByUserId" VARCHAR(255),
ADD COLUMN     "finalizedOn" TIMESTAMP(3),
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isDelegated" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "items" TEXT,
ADD COLUMN     "paidById" VARCHAR(255) NOT NULL,
ADD COLUMN     "paidByName" VARCHAR(255),
ADD COLUMN     "paidByUserId" VARCHAR(255),
ADD COLUMN     "rejectedById" VARCHAR(255),
ADD COLUMN     "rejectedByName" VARCHAR(255),
ADD COLUMN     "rejectedByUserId" VARCHAR(255),
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "settledById" VARCHAR(255),
ADD COLUMN     "settledByName" VARCHAR(255),
ADD COLUMN     "settledByUserId" VARCHAR(255),
ADD COLUMN     "settledOn" TIMESTAMP(3),
ADD COLUMN     "title" VARCHAR(255) NOT NULL,
ADD COLUMN     "transactionRef" VARCHAR(255),
ADD COLUMN     "updatedById" VARCHAR(255),
ADD COLUMN     "updatedByName" VARCHAR(255),
ADD COLUMN     "updatedByUserId" VARCHAR(255),
ADD COLUMN     "updatedOn" TIMESTAMP(3),
ALTER COLUMN "amount" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "currency" SET DEFAULT 'INR',
ALTER COLUMN "description" DROP NOT NULL;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "donationId" TEXT;

-- CreateIndex
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");

-- CreateIndex
CREATE INDEX "expenses_paidById_idx" ON "expenses"("paidById");

-- CreateIndex
CREATE INDEX "expenses_referenceId_referenceType_idx" ON "expenses"("referenceId", "referenceType");

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
