-- CreateTable
CREATE TABLE "goals" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "targetValue" DECIMAL(15,2),
    "targetUnit" VARCHAR(50),
    "currentValue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "deadline" TIMESTAMP(3),
    "priority" VARCHAR(20) NOT NULL,
    "status" VARCHAR(30) NOT NULL,
    "weight" DECIMAL(5,4),
    "dependencies" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "milestones" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "targetDate" TIMESTAMP(3) NOT NULL,
    "actualDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "importance" VARCHAR(20) NOT NULL,
    "dependencies" TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "milestones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_team_members" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL,
    "responsibilities" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "hoursAllocated" DECIMAL(10,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_team_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_risks" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(30) NOT NULL,
    "severity" VARCHAR(20) NOT NULL,
    "probability" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "impact" TEXT,
    "mitigationPlan" TEXT,
    "ownerId" VARCHAR(255),
    "identifiedDate" TIMESTAMP(3) NOT NULL,
    "resolvedDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "project_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_expenses" (
    "id" TEXT NOT NULL,
    "activityId" VARCHAR(255) NOT NULL,
    "expenseId" VARCHAR(255) NOT NULL,
    "allocationPercentage" DECIMAL(5,2),
    "allocationAmount" DECIMAL(15,2),
    "notes" TEXT,
    "createdBy" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userProfileId" TEXT,

    CONSTRAINT "activity_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "goals_projectId_idx" ON "goals"("projectId");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE INDEX "goals_priority_idx" ON "goals"("priority");

-- CreateIndex
CREATE INDEX "milestones_projectId_idx" ON "milestones"("projectId");

-- CreateIndex
CREATE INDEX "milestones_status_idx" ON "milestones"("status");

-- CreateIndex
CREATE INDEX "milestones_targetDate_idx" ON "milestones"("targetDate");

-- CreateIndex
CREATE INDEX "project_team_members_projectId_idx" ON "project_team_members"("projectId");

-- CreateIndex
CREATE INDEX "project_team_members_userId_idx" ON "project_team_members"("userId");

-- CreateIndex
CREATE INDEX "project_team_members_isActive_idx" ON "project_team_members"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "project_team_members_projectId_userId_isActive_key" ON "project_team_members"("projectId", "userId", "isActive");

-- CreateIndex
CREATE INDEX "project_risks_projectId_idx" ON "project_risks"("projectId");

-- CreateIndex
CREATE INDEX "project_risks_status_idx" ON "project_risks"("status");

-- CreateIndex
CREATE INDEX "project_risks_severity_idx" ON "project_risks"("severity");

-- CreateIndex
CREATE INDEX "project_risks_category_idx" ON "project_risks"("category");

-- CreateIndex
CREATE INDEX "activity_expenses_activityId_idx" ON "activity_expenses"("activityId");

-- CreateIndex
CREATE INDEX "activity_expenses_expenseId_idx" ON "activity_expenses"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "activity_expenses_activityId_expenseId_key" ON "activity_expenses"("activityId", "expenseId");

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
