-- DropForeignKey
ALTER TABLE "addresses" DROP CONSTRAINT "addresses_userId_fkey";

-- DropForeignKey
ALTER TABLE "document_mappings" DROP CONSTRAINT "document_mappings_documentReferenceId_fkey";

-- DropForeignKey
ALTER TABLE "document_references" DROP CONSTRAINT "document_references_uploadedById_fkey";

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_donorId_fkey";

-- DropForeignKey
ALTER TABLE "donations" DROP CONSTRAINT "donations_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "earnings" DROP CONSTRAINT "earnings_accountId_fkey";

-- DropForeignKey
ALTER TABLE "expenses" DROP CONSTRAINT "expenses_accountId_fkey";

-- DropForeignKey
ALTER TABLE "links" DROP CONSTRAINT "links_userId_fkey";

-- DropForeignKey
ALTER TABLE "phone_numbers" DROP CONSTRAINT "phone_numbers_userId_fkey";

-- DropForeignKey
ALTER TABLE "task_assignments" DROP CONSTRAINT "task_assignments_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "task_assignments" DROP CONSTRAINT "task_assignments_taskId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_accountId_fkey";

-- DropForeignKey
ALTER TABLE "user_roles" DROP CONSTRAINT "user_roles_userId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_instances" DROP CONSTRAINT "workflow_instances_initiatedById_fkey";

-- DropForeignKey
ALTER TABLE "workflow_instances" DROP CONSTRAINT "workflow_instances_initiatedForId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_steps" DROP CONSTRAINT "workflow_steps_instanceId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_tasks" DROP CONSTRAINT "workflow_tasks_assignedToId_fkey";

-- DropForeignKey
ALTER TABLE "workflow_tasks" DROP CONSTRAINT "workflow_tasks_stepId_fkey";
