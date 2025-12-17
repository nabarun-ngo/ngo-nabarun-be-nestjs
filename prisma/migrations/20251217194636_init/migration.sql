-- CreateTable
CREATE TABLE "user_profiles" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(5),
    "firstName" VARCHAR(50) NOT NULL,
    "middleName" VARCHAR(50),
    "lastName" VARCHAR(50) NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "gender" VARCHAR(10),
    "about" VARCHAR(200),
    "picture" TEXT,
    "email" VARCHAR(100) NOT NULL,
    "isPublic" BOOLEAN,
    "authUserId" VARCHAR(100),
    "status" VARCHAR(20) NOT NULL,
    "isTemporary" BOOLEAN NOT NULL,
    "isSameAddress" BOOLEAN,
    "loginMethods" VARCHAR(100),
    "panNumber" VARCHAR(20),
    "aadharNumber" VARCHAR(20),
    "donationPauseStart" TIMESTAMP(3),
    "donationPauseEnd" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "roleCode" VARCHAR(50) NOT NULL,
    "roleName" VARCHAR(50) NOT NULL,
    "authRoleCode" VARCHAR(50) NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" VARCHAR(255),
    "expireAt" TIMESTAMP(3),
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" TEXT NOT NULL,
    "phoneCode" TEXT,
    "phoneNumber" TEXT,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "links" (
    "id" TEXT NOT NULL,
    "linkName" VARCHAR(20) NOT NULL,
    "linkType" VARCHAR(20) NOT NULL,
    "linkValue" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addresses" (
    "id" TEXT NOT NULL,
    "addressLine1" TEXT,
    "addressLine2" TEXT,
    "addressLine3" TEXT,
    "hometown" TEXT,
    "zipCode" TEXT,
    "state" TEXT,
    "district" TEXT,
    "country" TEXT,
    "addressType" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "addresses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "oauth_tokens" (
    "id" TEXT NOT NULL,
    "provider" VARCHAR(20) NOT NULL,
    "clientId" VARCHAR(100) NOT NULL,
    "email" VARCHAR(100) NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenType" VARCHAR(20),
    "expiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "oauth_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(20) NOT NULL,
    "apiKey" TEXT NOT NULL,
    "apiKeyId" VARCHAR(50) NOT NULL,
    "permissions" TEXT NOT NULL,
    "rateLimit" INTEGER,
    "expiresAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_instances" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "description" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "currentStepId" VARCHAR(100),
    "data" TEXT,
    "initiatedById" VARCHAR(100),
    "initiatedForId" VARCHAR(100),
    "completedAt" TIMESTAMP(3),
    "remarks" VARCHAR(255),
    "delegated" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "workflow_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_steps" (
    "id" TEXT NOT NULL,
    "instanceId" TEXT NOT NULL,
    "stepId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "status" VARCHAR(20) NOT NULL,
    "orderIndex" INTEGER NOT NULL,
    "onSuccessStepId" VARCHAR(50),
    "onFailureStepId" VARCHAR(50),
    "failureReason" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workflow_tasks" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "taskId" VARCHAR(50) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "type" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "handler" VARCHAR(255),
    "checklist" TEXT,
    "autoCloseable" BOOLEAN,
    "autoCloseRefId" VARCHAR(50),
    "jobId" VARCHAR(255),
    "resultData" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedById" VARCHAR(255),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "task_assignments" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "assignedToId" VARCHAR(255) NOT NULL,
    "roleName" VARCHAR(50),
    "assignedBy" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "task_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "balance" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "accountHolderName" VARCHAR(255),
    "accountHolderId" VARCHAR(255),
    "activatedOn" TIMESTAMP(3),
    "bankDetail" TEXT,
    "upiDetail" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donations" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "donorId" VARCHAR(255),
    "donorName" VARCHAR(100),
    "donorEmail" VARCHAR(100),
    "donorPhone" VARCHAR(20),
    "isGuest" BOOLEAN DEFAULT false,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "raisedOn" TIMESTAMP(3) NOT NULL,
    "paidOn" TIMESTAMP(3),
    "confirmedById" VARCHAR(255),
    "confirmedOn" TIMESTAMP(3),
    "paymentMethod" VARCHAR(20),
    "paidToAccountId" VARCHAR(255),
    "forEventId" VARCHAR(255),
    "paidUsingUPI" VARCHAR(20),
    "isPaymentNotified" BOOLEAN DEFAULT false,
    "transactionRef" VARCHAR(255),
    "remarks" TEXT,
    "cancelletionReason" TEXT,
    "laterPaymentReason" TEXT,
    "paymentFailureDetail" TEXT,
    "additionalFields" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "donations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(20) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "fromAccountId" VARCHAR(255),
    "toAccountId" VARCHAR(255),
    "fromAccountBalance" DECIMAL(15,2) NOT NULL,
    "toAccountBalance" DECIMAL(15,2) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "particulars" TEXT,
    "createdById" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "donationId" TEXT,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "items" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'INR',
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "isDelegated" BOOLEAN NOT NULL DEFAULT false,
    "createdById" VARCHAR(255) NOT NULL,
    "paidById" VARCHAR(255) NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "submittedById" VARCHAR(255) NOT NULL,
    "submittedOn" TIMESTAMP(3),
    "finalizedById" VARCHAR(255),
    "finalizedOn" TIMESTAMP(3),
    "settledById" VARCHAR(255),
    "settledOn" TIMESTAMP(3),
    "rejectedById" VARCHAR(255),
    "rejectedOn" TIMESTAMP(3),
    "updatedById" VARCHAR(255),
    "updatedOn" TIMESTAMP(3),
    "accountId" VARCHAR(255),
    "accountName" VARCHAR(255),
    "transactionRef" VARCHAR(255),
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "userProfileId" TEXT,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earnings" (
    "id" TEXT NOT NULL,
    "category" VARCHAR(30) NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "description" TEXT NOT NULL,
    "source" VARCHAR(100) NOT NULL,
    "referenceId" VARCHAR(255),
    "referenceType" VARCHAR(50),
    "accountId" VARCHAR(255),
    "transactionId" VARCHAR(255),
    "earningDate" TIMESTAMP(3) NOT NULL,
    "receivedDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_references" (
    "id" TEXT NOT NULL,
    "fileName" VARCHAR(500) NOT NULL,
    "remotePath" VARCHAR(1000) NOT NULL,
    "publicToken" VARCHAR(255) NOT NULL,
    "contentType" VARCHAR(100) NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "document_references_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "document_mappings" (
    "id" TEXT NOT NULL,
    "documentReferenceId" VARCHAR(255) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_mappings_pkey" PRIMARY KEY ("id")
);

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
    "version" INTEGER NOT NULL DEFAULT 0,
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
    "version" INTEGER NOT NULL DEFAULT 0,
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
    "version" INTEGER NOT NULL DEFAULT 0,
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
    "version" INTEGER NOT NULL DEFAULT 0,
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
    "version" INTEGER NOT NULL DEFAULT 0,
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
    "userProfileId" TEXT,

    CONSTRAINT "activity_expenses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_profiles_email_key" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_email_idx" ON "user_profiles"("email");

-- CreateIndex
CREATE INDEX "user_profiles_authUserId_idx" ON "user_profiles"("authUserId");

-- CreateIndex
CREATE INDEX "oauth_tokens_email_clientId_idx" ON "oauth_tokens"("email", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_apiKeyId_key" ON "api_keys"("apiKeyId");

-- CreateIndex
CREATE INDEX "api_keys_apiKeyId_idx" ON "api_keys"("apiKeyId");

-- CreateIndex
CREATE INDEX "workflow_instances_type_status_idx" ON "workflow_instances"("type", "status");

-- CreateIndex
CREATE INDEX "workflow_instances_status_idx" ON "workflow_instances"("status");

-- CreateIndex
CREATE INDEX "workflow_instances_initiatedForId_idx" ON "workflow_instances"("initiatedForId");

-- CreateIndex
CREATE INDEX "workflow_steps_instanceId_idx" ON "workflow_steps"("instanceId");

-- CreateIndex
CREATE INDEX "workflow_tasks_stepId_idx" ON "workflow_tasks"("stepId");

-- CreateIndex
CREATE INDEX "workflow_tasks_status_idx" ON "workflow_tasks"("status");

-- CreateIndex
CREATE INDEX "workflow_tasks_jobId_idx" ON "workflow_tasks"("jobId");

-- CreateIndex
CREATE INDEX "task_assignments_taskId_idx" ON "task_assignments"("taskId");

-- CreateIndex
CREATE INDEX "task_assignments_assignedToId_status_idx" ON "task_assignments"("assignedToId", "status");

-- CreateIndex
CREATE INDEX "accounts_type_status_idx" ON "accounts"("type", "status");

-- CreateIndex
CREATE INDEX "accounts_accountHolderId_idx" ON "accounts"("accountHolderId");

-- CreateIndex
CREATE INDEX "donations_donorId_status_idx" ON "donations"("donorId", "status");

-- CreateIndex
CREATE INDEX "donations_type_status_idx" ON "donations"("type", "status");

-- CreateIndex
CREATE INDEX "donations_raisedOn_idx" ON "donations"("raisedOn");

-- CreateIndex
CREATE INDEX "transactions_fromAccountId_toAccountId_transactionDate_idx" ON "transactions"("fromAccountId", "toAccountId", "transactionDate");

-- CreateIndex
CREATE INDEX "transactions_type_status_idx" ON "transactions"("type", "status");

-- CreateIndex
CREATE INDEX "transactions_referenceId_referenceType_idx" ON "transactions"("referenceId", "referenceType");

-- CreateIndex
CREATE INDEX "expenses_status_idx" ON "expenses"("status");

-- CreateIndex
CREATE INDEX "expenses_createdById_idx" ON "expenses"("createdById");

-- CreateIndex
CREATE INDEX "expenses_paidById_idx" ON "expenses"("paidById");

-- CreateIndex
CREATE INDEX "expenses_referenceId_referenceType_idx" ON "expenses"("referenceId", "referenceType");

-- CreateIndex
CREATE UNIQUE INDEX "earnings_transactionId_key" ON "earnings"("transactionId");

-- CreateIndex
CREATE INDEX "earnings_category_status_idx" ON "earnings"("category", "status");

-- CreateIndex
CREATE INDEX "earnings_source_idx" ON "earnings"("source");

-- CreateIndex
CREATE INDEX "document_mappings_entityType_entityId_idx" ON "document_mappings"("entityType", "entityId");

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

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "links" ADD CONSTRAINT "links_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addresses" ADD CONSTRAINT "addresses_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedById_fkey" FOREIGN KEY ("initiatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_instances" ADD CONSTRAINT "workflow_instances_initiatedForId_fkey" FOREIGN KEY ("initiatedForId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_steps" ADD CONSTRAINT "workflow_steps_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "workflow_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "workflow_steps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "workflow_tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "task_assignments" ADD CONSTRAINT "task_assignments_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_accountHolderId_fkey" FOREIGN KEY ("accountHolderId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donations" ADD CONSTRAINT "donations_paidToAccountId_fkey" FOREIGN KEY ("paidToAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_fromAccountId_fkey" FOREIGN KEY ("fromAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_toAccountId_fkey" FOREIGN KEY ("toAccountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "donations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_paidById_fkey" FOREIGN KEY ("paidById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_submittedById_fkey" FOREIGN KEY ("submittedById") REFERENCES "user_profiles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_finalizedById_fkey" FOREIGN KEY ("finalizedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_settledById_fkey" FOREIGN KEY ("settledById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_rejectedById_fkey" FOREIGN KEY ("rejectedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earnings" ADD CONSTRAINT "earnings_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_references" ADD CONSTRAINT "document_references_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "document_mappings" ADD CONSTRAINT "document_mappings_documentReferenceId_fkey" FOREIGN KEY ("documentReferenceId") REFERENCES "document_references"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "user_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_expenses" ADD CONSTRAINT "activity_expenses_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
