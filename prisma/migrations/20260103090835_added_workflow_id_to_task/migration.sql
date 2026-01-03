/*
  Warnings:

  - Added the required column `workflowId` to the `workflow_tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "workflow_tasks" ADD COLUMN     "workflowId" VARCHAR(50) NOT NULL;
