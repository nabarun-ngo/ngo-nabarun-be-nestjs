-- DropForeignKey
ALTER TABLE "public"."workflow_tasks" DROP CONSTRAINT "workflow_tasks_assignedToId_fkey";

-- AlterTable
ALTER TABLE "workflow_tasks" ALTER COLUMN "assignedToId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
