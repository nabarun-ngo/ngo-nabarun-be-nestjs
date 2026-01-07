-- AlterTable
ALTER TABLE "workflow_instances" ADD COLUMN     "extUserEmail" TEXT,
ADD COLUMN     "isExtUser" BOOLEAN NOT NULL DEFAULT false;
