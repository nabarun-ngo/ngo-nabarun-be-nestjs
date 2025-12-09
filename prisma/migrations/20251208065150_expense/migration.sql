/*
  Warnings:

  - You are about to drop the column `createdByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `createdByUserId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `finalizedByUserId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `isAdmin` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `paidByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `paidByUserId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `rejectedByUserId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `settledByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `settledByUserId` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedByName` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `updatedByUserId` on the `expenses` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "createdByName",
DROP COLUMN "createdByUserId",
DROP COLUMN "finalizedByName",
DROP COLUMN "finalizedByUserId",
DROP COLUMN "isAdmin",
DROP COLUMN "paidByName",
DROP COLUMN "paidByUserId",
DROP COLUMN "rejectedByName",
DROP COLUMN "rejectedByUserId",
DROP COLUMN "settledByName",
DROP COLUMN "settledByUserId",
DROP COLUMN "updatedByName",
DROP COLUMN "updatedByUserId",
ADD COLUMN     "category" VARCHAR(20),
ADD COLUMN     "userProfileId" TEXT;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
