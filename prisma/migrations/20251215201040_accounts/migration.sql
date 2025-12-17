/*
  Warnings:

  - Added the required column `fromAccountBalance` to the `transactions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `toAccountBalance` to the `transactions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "fromAccountBalance" DECIMAL(15,2) NOT NULL,
ADD COLUMN     "toAccountBalance" DECIMAL(15,2) NOT NULL;
