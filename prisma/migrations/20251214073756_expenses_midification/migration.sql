/*
  Warnings:

  - You are about to drop the column `category` on the `expenses` table. All the data in the column will be lost.
  - You are about to drop the column `expenseCreated` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `submittedById` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "activity_expenses" DROP CONSTRAINT "activity_expenses_createdBy_fkey";

-- DropForeignKey
ALTER TABLE "activity_expenses" DROP CONSTRAINT "activity_expenses_expenseId_fkey";

-- AlterTable
ALTER TABLE "activity_expenses" ADD COLUMN     "userProfileId" TEXT;

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "category",
DROP COLUMN "expenseCreated",
ADD COLUMN     "rejectedOn" TIMESTAMP(3),
ADD COLUMN     "submittedById" VARCHAR(255) NOT NULL,
ADD COLUMN     "submittedOn" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
