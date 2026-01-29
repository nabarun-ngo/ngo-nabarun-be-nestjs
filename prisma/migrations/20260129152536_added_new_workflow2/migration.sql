-- CreateTable
CREATE TABLE "engine_workflow_definitions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(100) NOT NULL,
    "version" INTEGER NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "definitionJson" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engine_workflow_definitions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_workflow_instances" (
    "id" TEXT NOT NULL,
    "definitionId" TEXT,
    "type" VARCHAR(100) NOT NULL,
    "definitionVersion" INTEGER,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "contextData" TEXT,
    "activeStepIds" TEXT,
    "initiatedById" VARCHAR(100),
    "initiatedForId" VARCHAR(100),
    "requestData" TEXT,
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engine_workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_workflow_steps" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stepId" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(50) NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "transitionConfig" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engine_workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_workflow_tasks" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "instanceId" VARCHAR(100) NOT NULL,
    "taskId" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "handler" VARCHAR(255),
    "taskConfig" TEXT,
    "resultData" TEXT,
    "completedById" VARCHAR(100),
    "completedAt" TIMESTAMP(3),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engine_workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "engine_task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assigneeId" VARCHAR(100) NOT NULL,
    "roleName" VARCHAR(50),
    "status" VARCHAR(20) NOT NULL,
    "assignedById" VARCHAR(100),
    "acceptedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "supersededById" VARCHAR(100),
    "dueAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "engine_task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "engine_workflow_definitions_type_version_key" ON "engine_workflow_definitions"("type", "version");

-- CreateIndex
CREATE INDEX "engine_workflow_instances_type_idx" ON "engine_workflow_instances"("type");

-- CreateIndex
CREATE INDEX "engine_workflow_instances_status_idx" ON "engine_workflow_instances"("status");

-- CreateIndex
CREATE INDEX "engine_workflow_instances_initiatedForId_idx" ON "engine_workflow_instances"("initiatedForId");

-- CreateIndex
CREATE INDEX "engine_workflow_steps_instanceId_idx" ON "engine_workflow_steps"("instanceId");

-- CreateIndex
CREATE INDEX "engine_workflow_tasks_stepId_idx" ON "engine_workflow_tasks"("stepId");

-- CreateIndex
CREATE INDEX "engine_workflow_tasks_status_idx" ON "engine_workflow_tasks"("status");

-- CreateIndex
CREATE INDEX "engine_workflow_tasks_instanceId_idx" ON "engine_workflow_tasks"("instanceId");

-- CreateIndex
CREATE INDEX "engine_task_assignments_taskId_idx" ON "engine_task_assignments"("taskId");

-- CreateIndex
CREATE INDEX "engine_task_assignments_assigneeId_idx" ON "engine_task_assignments"("assigneeId");

-- CreateIndex
CREATE INDEX "engine_task_assignments_status_idx" ON "engine_task_assignments"("status");

-- CreateIndex
CREATE INDEX "engine_task_assignments_dueAt_status_idx" ON "engine_task_assignments"("dueAt", "status");

-- AddForeignKey
ALTER TABLE "engine_workflow_instances" ADD CONSTRAINT "engine_workflow_instances_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "engine_workflow_definitions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_workflow_instances" ADD CONSTRAINT "engine_workflow_instances_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_workflow_instances" ADD CONSTRAINT "engine_workflow_instances_initiatedForId_fkey" FOREIGN KEY ("initiatedForId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_workflow_steps" ADD CONSTRAINT "engine_workflow_steps_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "engine_workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_workflow_tasks" ADD CONSTRAINT "engine_workflow_tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "engine_workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_workflow_tasks" ADD CONSTRAINT "engine_workflow_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_task_assignments" ADD CONSTRAINT "engine_task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "engine_workflow_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_task_assignments" ADD CONSTRAINT "engine_task_assignments_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "engine_task_assignments" ADD CONSTRAINT "engine_task_assignments_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "engine_task_assignments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
