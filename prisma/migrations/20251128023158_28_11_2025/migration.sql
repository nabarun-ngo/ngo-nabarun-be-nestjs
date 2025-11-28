/*
  Warnings:

  - You are about to drop the column `description` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `paidDate` on the `donations` table. All the data in the column will be lost.
  - You are about to drop the column `raisedDate` on the `donations` table. All the data in the column will be lost.
  - Added the required column `raisedOn` to the `donations` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "donations_raisedDate_idx";

-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "accountHolderId" VARCHAR(255),
ADD COLUMN     "accountHolderName" VARCHAR(255),
ADD COLUMN     "activatedOn" TIMESTAMP(3),
ADD COLUMN     "bankDetail" JSONB,
ADD COLUMN     "upiDetail" JSONB;

-- AlterTable
ALTER TABLE "donations" DROP COLUMN "description",
DROP COLUMN "paidDate",
DROP COLUMN "raisedDate",
ADD COLUMN     "additionalFields" JSONB,
ADD COLUMN     "cancelletionReason" TEXT,
ADD COLUMN     "confirmedById" VARCHAR(255),
ADD COLUMN     "confirmedOn" TIMESTAMP(3),
ADD COLUMN     "donorPhone" VARCHAR(20),
ADD COLUMN     "endDate" TIMESTAMP(3),
ADD COLUMN     "forEventId" VARCHAR(255),
ADD COLUMN     "isGuest" BOOLEAN DEFAULT false,
ADD COLUMN     "isPaymentNotified" BOOLEAN DEFAULT false,
ADD COLUMN     "laterPaymentReason" TEXT,
ADD COLUMN     "paidOn" TIMESTAMP(3),
ADD COLUMN     "paidToAccountId" VARCHAR(255),
ADD COLUMN     "paidUsingUPI" VARCHAR(20),
ADD COLUMN     "paymentFailureDetail" TEXT,
ADD COLUMN     "paymentMethod" VARCHAR(20),
ADD COLUMN     "raisedOn" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "startDate" TIMESTAMP(3),
ADD COLUMN     "transactionRef" VARCHAR(255);

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "noticeDate" TIMESTAMP(3) NOT NULL,
    "publishDate" TIMESTAMP(3),
    "hasMeeting" BOOLEAN NOT NULL DEFAULT false,
    "creatorId" VARCHAR(255) NOT NULL,
    "creatorRoleCode" VARCHAR(50),
    "meetingId" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meetings" (
    "id" TEXT NOT NULL,
    "extMeetingId" VARCHAR(255),
    "meetingSummary" VARCHAR(500) NOT NULL,
    "meetingDescription" TEXT,
    "meetingLocation" VARCHAR(500),
    "meetingDate" TIMESTAMP(3) NOT NULL,
    "meetingStartTime" VARCHAR(20),
    "meetingEndTime" VARCHAR(20),
    "meetingRefId" VARCHAR(255),
    "meetingType" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "meetingRemarks" TEXT,
    "meetingRefType" VARCHAR(20),
    "extAudioConferenceLink" VARCHAR(1000),
    "extVideoConferenceLink" VARCHAR(1000),
    "extHtmlLink" VARCHAR(1000),
    "creatorEmail" VARCHAR(255),
    "extConferenceStatus" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "meeting_attendees" (
    "id" TEXT NOT NULL,
    "meetingId" VARCHAR(255) NOT NULL,
    "userId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_attendees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "phase" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "budget" DECIMAL(15,2) NOT NULL,
    "spentAmount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "currency" VARCHAR(3) NOT NULL,
    "location" VARCHAR(255),
    "targetBeneficiaryCount" INTEGER,
    "actualBeneficiaryCount" INTEGER,
    "managerId" VARCHAR(255) NOT NULL,
    "sponsorId" VARCHAR(255),
    "tags" VARCHAR(50)[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

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
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "goals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scale" VARCHAR(20) NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "priority" VARCHAR(20) NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "actualStartDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "location" VARCHAR(255),
    "venue" VARCHAR(255),
    "assignedTo" VARCHAR(255),
    "organizerId" VARCHAR(255),
    "parentActivityId" VARCHAR(255),
    "expectedParticipants" INTEGER,
    "actualParticipants" INTEGER,
    "estimatedCost" DECIMAL(15,2),
    "actualCost" DECIMAL(15,2),
    "currency" VARCHAR(3),
    "tags" VARCHAR(50)[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" BIGINT NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
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
CREATE TABLE "beneficiaries" (
    "id" TEXT NOT NULL,
    "projectId" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" VARCHAR(30) NOT NULL,
    "gender" VARCHAR(20),
    "age" INTEGER,
    "dateOfBirth" TIMESTAMP(3),
    "contactNumber" VARCHAR(20),
    "email" VARCHAR(255),
    "address" TEXT,
    "location" VARCHAR(255),
    "category" VARCHAR(100),
    "enrollmentDate" TIMESTAMP(3) NOT NULL,
    "exitDate" TIMESTAMP(3),
    "status" VARCHAR(20) NOT NULL,
    "benefitsReceived" VARCHAR(100)[],
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "beneficiaries_pkey" PRIMARY KEY ("id")
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

    CONSTRAINT "activity_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notices_meetingId_key" ON "notices"("meetingId");

-- CreateIndex
CREATE INDEX "notices_status_idx" ON "notices"("status");

-- CreateIndex
CREATE INDEX "notices_creatorId_idx" ON "notices"("creatorId");

-- CreateIndex
CREATE INDEX "notices_noticeDate_idx" ON "notices"("noticeDate");

-- CreateIndex
CREATE INDEX "meetings_meetingType_status_idx" ON "meetings"("meetingType", "status");

-- CreateIndex
CREATE INDEX "meetings_meetingRefId_meetingRefType_idx" ON "meetings"("meetingRefId", "meetingRefType");

-- CreateIndex
CREATE INDEX "meetings_meetingDate_idx" ON "meetings"("meetingDate");

-- CreateIndex
CREATE INDEX "meetings_extMeetingId_idx" ON "meetings"("extMeetingId");

-- CreateIndex
CREATE INDEX "meeting_attendees_meetingId_idx" ON "meeting_attendees"("meetingId");

-- CreateIndex
CREATE INDEX "meeting_attendees_userId_idx" ON "meeting_attendees"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "meeting_attendees_meetingId_userId_key" ON "meeting_attendees"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "projects_code_key" ON "projects"("code");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_category_idx" ON "projects"("category");

-- CreateIndex
CREATE INDEX "projects_phase_idx" ON "projects"("phase");

-- CreateIndex
CREATE INDEX "projects_managerId_idx" ON "projects"("managerId");

-- CreateIndex
CREATE INDEX "projects_code_idx" ON "projects"("code");

-- CreateIndex
CREATE INDEX "goals_projectId_idx" ON "goals"("projectId");

-- CreateIndex
CREATE INDEX "goals_status_idx" ON "goals"("status");

-- CreateIndex
CREATE INDEX "goals_priority_idx" ON "goals"("priority");

-- CreateIndex
CREATE INDEX "activities_projectId_idx" ON "activities"("projectId");

-- CreateIndex
CREATE INDEX "activities_status_idx" ON "activities"("status");

-- CreateIndex
CREATE INDEX "activities_scale_idx" ON "activities"("scale");

-- CreateIndex
CREATE INDEX "activities_type_idx" ON "activities"("type");

-- CreateIndex
CREATE INDEX "activities_assignedTo_idx" ON "activities"("assignedTo");

-- CreateIndex
CREATE INDEX "activities_organizerId_idx" ON "activities"("organizerId");

-- CreateIndex
CREATE INDEX "activities_parentActivityId_idx" ON "activities"("parentActivityId");

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
CREATE INDEX "beneficiaries_projectId_idx" ON "beneficiaries"("projectId");

-- CreateIndex
CREATE INDEX "beneficiaries_status_idx" ON "beneficiaries"("status");

-- CreateIndex
CREATE INDEX "beneficiaries_type_idx" ON "beneficiaries"("type");

-- CreateIndex
CREATE INDEX "beneficiaries_enrollmentDate_idx" ON "beneficiaries"("enrollmentDate");

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

-- CreateIndex
CREATE INDEX "accounts_accountHolderId_idx" ON "accounts"("accountHolderId");

-- CreateIndex
CREATE INDEX "donations_raisedOn_idx" ON "donations"("raisedOn");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accountHolderId_fkey" FOREIGN KEY ("accountHolderId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_paidToAccountId_fkey" FOREIGN KEY ("paidToAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notices" ADD CONSTRAINT "notices_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "meeting_attendees" ADD CONSTRAINT "meeting_attendees_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "goals" ADD CONSTRAINT "goals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_organizerId_fkey" FOREIGN KEY ("organizerId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_parentActivityId_fkey" FOREIGN KEY ("parentActivityId") REFERENCES "activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "milestones" ADD CONSTRAINT "milestones_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_team_members" ADD CONSTRAINT "project_team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "beneficiaries" ADD CONSTRAINT "beneficiaries_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_risks" ADD CONSTRAINT "project_risks_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
