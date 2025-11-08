/*
  Warnings:

  - You are about to alter the column `assignedToId` on the `task_assignments` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.
  - Added the required column `status` to the `task_assignments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `assignedToId` to the `workflow_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."task_assignments" DROP CONSTRAINT "task_assignments_assignedToId_fkey";

-- AlterTable
ALTER TABLE "task_assignments" ADD COLUMN     "acceptedAt" TIMESTAMP(3),
ADD COLUMN     "assignedBy" VARCHAR(255),
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "roleName" VARCHAR(50),
ADD COLUMN     "status" VARCHAR(20) NOT NULL,
ALTER COLUMN "assignedToId" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "workflow_instances" ALTER COLUMN "description" SET DATA TYPE TEXT,
ALTER COLUMN "currentStepId" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "remarks" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "workflow_tasks" ADD COLUMN     "assignedToId" VARCHAR(255) NOT NULL;

-- CreateIndex
CREATE INDEX "task_assignments_assignedToId_status_idx" ON "task_assignments"("assignedToId", "status");

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
