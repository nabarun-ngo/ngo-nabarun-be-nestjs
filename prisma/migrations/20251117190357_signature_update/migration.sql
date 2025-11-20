/*
  Warnings:

  - You are about to alter the column `initiatedById` on the `workflow_instances` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.
  - You are about to alter the column `initiatedForId` on the `workflow_instances` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(100)`.

*/
-- DropForeignKey
ALTER TABLE "public"."workflow_instances" DROP CONSTRAINT "workflow_instances_initiatedById_fkey";

-- DropForeignKey
ALTER TABLE "public"."workflow_instances" DROP CONSTRAINT "workflow_instances_initiatedForId_fkey";

-- AlterTable
ALTER TABLE "workflow_instances" ALTER COLUMN "initiatedById" SET DATA TYPE VARCHAR(100),
ALTER COLUMN "initiatedForId" SET DATA TYPE VARCHAR(100);

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedForId_fkey" FOREIGN KEY ("initiatedForId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
