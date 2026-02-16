/*
  Warnings:

  - You are about to drop the `engine_task_assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `engine_workflow_definitions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `engine_workflow_instances` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `engine_workflow_steps` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `engine_workflow_tasks` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "engine_task_assignments" DROP CONSTRAINT "engine_task_assignments_assigneeId_fkey";

-- DropForeignKey
ALTER TABLE "engine_task_assignments" DROP CONSTRAINT "engine_task_assignments_supersededById_fkey";

-- DropForeignKey
ALTER TABLE "engine_task_assignments" DROP CONSTRAINT "engine_task_assignments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_instances" DROP CONSTRAINT "engine_workflow_instances_definitionId_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_instances" DROP CONSTRAINT "engine_workflow_instances_initiatedById_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_instances" DROP CONSTRAINT "engine_workflow_instances_initiatedForId_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_steps" DROP CONSTRAINT "engine_workflow_steps_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_tasks" DROP CONSTRAINT "engine_workflow_tasks_completedById_fkey";

-- DropForeignKey
ALTER TABLE "engine_workflow_tasks" DROP CONSTRAINT "engine_workflow_tasks_stepId_fkey";

-- AlterTable
ALTER TABLE "workflow_instances" ADD COLUMN     "context" TEXT;

-- AlterTable
ALTER TABLE "workflow_steps" ADD COLUMN     "transitions" TEXT;

-- DropTable
DROP TABLE "engine_task_assignments";

-- DropTable
DROP TABLE "engine_workflow_definitions";

-- DropTable
DROP TABLE "engine_workflow_instances";

-- DropTable
DROP TABLE "engine_workflow_steps";

-- DropTable
DROP TABLE "engine_workflow_tasks";
