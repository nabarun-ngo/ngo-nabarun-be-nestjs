/*
  Warnings:

  - You are about to drop the column `failureReason` on the `workflow_steps` table. All the data in the column will be lost.
  - You are about to drop the column `failureReason` on the `workflow_tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workflow_steps" DROP COLUMN "failureReason",
ADD COLUMN     "remarks" TEXT;

-- AlterTable
ALTER TABLE "workflow_tasks" DROP COLUMN "failureReason",
ADD COLUMN     "remarks" TEXT;
