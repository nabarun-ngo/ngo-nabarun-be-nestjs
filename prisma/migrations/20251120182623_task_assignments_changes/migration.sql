/*
  Warnings:

  - You are about to drop the column `assignedToId` on the `workflow_tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "workflow_tasks" DROP CONSTRAINT "workflow_tasks_assignedToId_fkey";

-- DropIndex
DROP INDEX "workflow_steps_instanceId_orderIndex_idx";

-- AlterTable
ALTER TABLE "workflow_tasks" DROP COLUMN "assignedToId";
