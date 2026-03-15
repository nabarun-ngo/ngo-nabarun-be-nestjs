/*
  Warnings:

  - You are about to drop the column `jobId` on the `workflow_tasks` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "workflow_tasks_jobId_idx";

-- AlterTable
ALTER TABLE "workflow_tasks" DROP COLUMN "jobId",
ADD COLUMN     "autoCloseCondition" VARCHAR(255),
ADD COLUMN     "autoCloseEventName" VARCHAR(255);
