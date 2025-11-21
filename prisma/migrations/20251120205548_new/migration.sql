/*
  Warnings:

  - You are about to drop the column `completedBy` on the `workflow_tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "workflow_tasks" DROP COLUMN "completedBy",
ADD COLUMN     "completedById" VARCHAR(255);

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
