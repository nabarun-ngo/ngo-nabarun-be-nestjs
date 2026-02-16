/*
  Warnings:

  - You are about to drop the column `currentStepId` on the `workflow_instances` table. All the data in the column will be lost.
  - You are about to drop the column `onFailureStepId` on the `workflow_steps` table. All the data in the column will be lost.
  - You are about to drop the column `onSuccessStepId` on the `workflow_steps` table. All the data in the column will be lost.
  - You are about to drop the column `stepId` on the `workflow_steps` table. All the data in the column will be lost.
  - You are about to drop the column `taskId` on the `workflow_tasks` table. All the data in the column will be lost.
  - Added the required column `stepDefId` to the `workflow_steps` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taskDefId` to the `workflow_tasks` table without a default value. This is not possible if the table is not empty.

*/

-- AlterTable
ALTER TABLE "workflow_instances" RENAME COLUMN "currentStepId" TO "currentStepDefId";

-- AlterTable
ALTER TABLE "workflow_steps" DROP COLUMN "onFailureStepId";
ALTER TABLE "workflow_steps" DROP COLUMN "onSuccessStepId";
ALTER TABLE "workflow_steps" RENAME COLUMN "stepId" TO "stepDefId";

-- AlterTable
ALTER TABLE "workflow_tasks" RENAME COLUMN "taskId" TO "taskDefId";
ALTER TABLE "workflow_tasks" ADD COLUMN "stepDefId" VARCHAR(50) NOT NULL DEFAULT 'NA';
