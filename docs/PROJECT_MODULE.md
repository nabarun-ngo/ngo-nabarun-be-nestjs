# NGO Project Management System - Final Design Document

## Overview
This system manages NGO projects with comprehensive tracking of goals, activities (merged activities and events), milestones, team members, beneficiaries, risks, and expenses. It follows the existing DDD (Domain-Driven Design) architecture pattern and integrates with the Finance module for expense management.

## Domain Models

### 1. Project
**Purpose**: Represents an NGO project/initiative

**Properties**:
- `id`: string (UUID)
- `name`: string (Project name)
- `description`: string (Project description)
- `code`: string (Unique project code, e.g., "EDU-2024-001")
- `category`: enum (EDUCATION, HEALTH, ENVIRONMENT, RURAL_DEVELOPMENT, WOMEN_EMPOWERMENT, CHILD_WELFARE, DISASTER_RELIEF, OTHER)
- `status`: enum (PLANNING, ACTIVE, ON_HOLD, COMPLETED, CANCELLED)
- `phase`: enum (INITIATION, PLANNING, EXECUTION, MONITORING, CLOSURE)
- `startDate`: Date (Project start date)
- `endDate`: Date? (Project end date, optional)
- `actualEndDate`: Date? (Actual completion date)
- `budget`: number (Total allocated budget)
- `spentAmount`: number (Total amount spent, default 0)
- `currency`: string (Currency code, e.g., "INR")
- `location`: string? (Primary location/region)
- `targetBeneficiaryCount`: number? (Target number of beneficiaries)
- `actualBeneficiaryCount`: number? (Actual number of beneficiaries reached)
- `managerId`: string (User ID of project manager)
- `sponsorId`: string? (Sponsor/donor ID if applicable)
- `tags`: string[] (Project tags for categorization)
- `metadata`: Record<string, any>? (Additional flexible data)
- `createdAt`: Date
- `updatedAt`: Date
- `version`: BigInt (Optimistic locking)
- `deletedAt`: Date?

**Business Logic**:
- Can only be cancelled if status is PLANNING or ACTIVE
- Cannot modify budget if status is COMPLETED
- End date must be after start date
- Budget must be positive
- Spent amount cannot exceed budget
- Phase transitions: INITIATION → PLANNING → EXECUTION → MONITORING → CLOSURE
- Cannot move to next phase if current phase requirements not met

**Relations**:
- Has many Goals
- Has many Activities (merged activities and events)
- Has many Milestones
- Has many Project Team Members
- Has many Beneficiaries
- Has many Risks
- Has many Expenses (through activities - linked to Finance module Expense entity)
- Belongs to Manager (User)
- Optional: Belongs to Sponsor

---

### 2. Goal
**Purpose**: Represents objectives/targets within a project

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `title`: string (Goal title)
- `description`: string? (Goal description)
- `targetValue`: number? (Numeric target, e.g., 1000 beneficiaries)
- `targetUnit`: string? (Unit of measurement, e.g., "people", "schools", "trees")
- `currentValue`: number (Current progress value, default 0)
- `deadline`: Date? (Goal deadline)
- `priority`: enum (LOW, MEDIUM, HIGH, CRITICAL)
- `status`: enum (NOT_STARTED, IN_PROGRESS, ACHIEVED, PARTIALLY_ACHIEVED, FAILED)
- `weight`: number? (Weight for overall project progress calculation, 0-1)
- `dependencies`: string[]? (IDs of goals this depends on)
- `createdAt`: Date
- `updatedAt`: Date
- `version`: BigInt
- `deletedAt`: Date?

**Business Logic**:
- Goal must belong to an active project
- Target value must be positive if provided
- Current value cannot be negative
- Weight should be between 0 and 1
- Sum of weights for all goals in a project should be <= 1.0 (validation)
- Status automatically updates based on currentValue vs targetValue
- Cannot delete goal if it's a dependency for other goals

**Relations**:
- Belongs to Project

---

### 3. Activity (Merged: Activities + Events)
**Purpose**: Represents all work items within a project - from small operational tasks to major organized events

**Scale Types**:
- `TASK`: Small operational tasks (e.g., "Prepare materials", "Visit villages")
- `ACTIVITY`: Medium activities (e.g., "Field survey", "Data collection")
- `EVENT`: Major organized events (e.g., "Training Workshop", "Awareness Campaign")

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `name`: string (Activity name)
- `description`: string? (Activity description)
- `scale`: enum (TASK, ACTIVITY, EVENT) - Determines if it's a small task or major event
- `type`: enum (TRAINING, AWARENESS, DISTRIBUTION, SURVEY, MEETING, FIELD_VISIT, DOCUMENTATION, WORKSHOP, SEMINAR, FUNDRAISING, VOLUNTEER_ACTIVITY, CONFERENCE, EXHIBITION, OTHER)
- `status`: enum (PLANNED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD, POSTPONED)
- `priority`: enum (LOW, MEDIUM, HIGH, URGENT)
- `startDate`: Date? (Planned start date)
- `endDate`: Date? (Planned end date)
- `actualStartDate`: Date? (Actual start date)
- `actualEndDate`: Date? (Actual end date)
- `location`: string? (Activity location)
- `venue`: string? (Specific venue name - mainly for EVENTS)
- `assignedTo`: string? (User ID assigned - mainly for TASKS/ACTIVITIES)
- `organizerId`: string? (User ID of organizer - mainly for EVENTS)
- `parentActivityId`: string? (Parent activity ID - for hierarchical breakdown of events into tasks)
- `expectedParticipants`: number? (Expected number of participants - mainly for EVENTS)
- `actualParticipants`: number? (Actual number of participants - mainly for EVENTS)
- `estimatedCost`: number? (Estimated cost)
- `actualCost`: number? (Actual cost)
- `currency`: string? (Currency code)
- `tags`: string[] (Activity tags)
- `metadata`: Record<string, any>? (Additional data)
- `createdAt`: Date
- `updatedAt`: Date
- `version`: BigInt
- `deletedAt`: Date?

**Business Logic**:
- Activity must belong to an active project
- End date must be after start date
- Actual dates should be within project timeline
- Cannot cancel if status is COMPLETED
- Estimated and actual costs must be positive if provided
- If scale is EVENT, organizerId should be provided
- If scale is TASK or ACTIVITY, assignedTo is recommended
- Parent activity must exist and belong to same project
- Cannot create circular parent-child relationships

**Relations**:
- Belongs to Project
- Belongs to Assigned User (optional, for TASKS/ACTIVITIES)
- Belongs to Organizer (optional, for EVENTS)
- Has Parent Activity (optional, for hierarchical breakdown)
- Has Child Activities (optional, for breaking down events into tasks)
- Has many Activity Expenses (junction table linking to Finance module Expense entity)

---

### 4. Milestone
**Purpose**: Represents key milestones/checkpoints in a project

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `name`: string (Milestone name)
- `description`: string? (Milestone description)
- `targetDate`: Date (Target completion date)
- `actualDate`: Date? (Actual completion date)
- `status`: enum (PENDING, IN_PROGRESS, ACHIEVED, DELAYED, MISSED)
- `importance`: enum (LOW, MEDIUM, HIGH, CRITICAL)
- `dependencies`: string[]? (IDs of milestones this depends on)
- `notes`: string? (Milestone notes)
- `createdAt`: Date
- `updatedAt`: Date
- `deletedAt`: Date?

**Business Logic**:
- Milestone must belong to an active project
- Target date should be within project timeline
- Status automatically updates based on targetDate vs actualDate
- Cannot delete milestone if it's a dependency for other milestones

**Relations**:
- Belongs to Project

---

### 5. Project Team Member
**Purpose**: Tracks team members/volunteers assigned to a project

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `userId`: string (User ID)
- `role`: enum (PROJECT_MANAGER, TEAM_LEAD, COORDINATOR, VOLUNTEER, CONSULTANT, OTHER)
- `responsibilities`: string? (Role responsibilities)
- `startDate`: Date (Start date on project)
- `endDate`: Date? (End date on project, if applicable)
- `hoursAllocated`: number? (Hours allocated per week/month)
- `isActive`: boolean (Whether currently active on project)
- `createdAt`: Date
- `updatedAt`: Date
- `deletedAt`: Date?

**Business Logic**:
- User must be an active user
- Project must be active
- End date must be after start date
- Cannot have duplicate active team members for same user and project
- Hours allocated must be positive if provided

**Relations**:
- Belongs to Project
- Belongs to User

---

### 6. Beneficiary
**Purpose**: Tracks beneficiaries of the project

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `name`: string (Beneficiary name)
- `type`: enum (INDIVIDUAL, FAMILY, COMMUNITY, INSTITUTION, OTHER)
- `gender`: enum? (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)
- `age`: number? (Age in years)
- `dateOfBirth`: Date? (Date of birth)
- `contactNumber`: string? (Contact number)
- `email`: string? (Email address)
- `address`: string? (Address)
- `location`: string? (Location/region)
- `category`: string? (Beneficiary category, e.g., "Student", "Farmer", "Women")
- `enrollmentDate`: Date (Date enrolled in project)
- `exitDate`: Date? (Date exited from project, if applicable)
- `status`: enum (ACTIVE, COMPLETED, DROPPED_OUT, TRANSFERRED)
- `benefitsReceived`: string[]? (List of benefits/services received)
- `notes`: string? (Additional notes)
- `metadata`: Record<string, any>? (Additional flexible data)
- `createdAt`: Date
- `updatedAt`: Date
- `deletedAt`: Date?

**Business Logic**:
- Beneficiary must belong to an active project
- Exit date must be after enrollment date
- Cannot have duplicate beneficiaries (same name + contact in same project)
- Age should be consistent with dateOfBirth if both provided

**Relations**:
- Belongs to Project

---

### 7. Project Risk
**Purpose**: Tracks risks and issues in a project

**Properties**:
- `id`: string (UUID)
- `projectId`: string (Parent project)
- `title`: string (Risk title)
- `description`: string? (Risk description)
- `category`: enum (BUDGET, TIMELINE, RESOURCE, QUALITY, STAKEHOLDER, EXTERNAL, OTHER)
- `severity`: enum (LOW, MEDIUM, HIGH, CRITICAL)
- `probability`: enum (LOW, MEDIUM, HIGH) (Probability of occurrence)
- `status`: enum (IDENTIFIED, MONITORING, MITIGATED, CLOSED, OCCURRED)
- `impact`: string? (Potential impact description)
- `mitigationPlan`: string? (Mitigation plan/strategy)
- `ownerId`: string? (User ID responsible for managing this risk)
- `identifiedDate`: Date (Date risk was identified)
- `resolvedDate`: Date? (Date risk was resolved/closed)
- `notes`: string? (Additional notes)
- `createdAt`: Date
- `updatedAt`: Date
- `deletedAt`: Date?

**Business Logic**:
- Risk must belong to an active project
- Resolved date must be after identified date
- Cannot close risk without mitigation plan if severity is HIGH or CRITICAL
- Owner must be an active user if provided

**Relations**:
- Belongs to Project
- Belongs to Owner (User, optional)

---

### 8. Activity Expense (Junction Entity)
**Purpose**: Links Finance module Expense entity to Project Activities

**Important**: This links to the existing `Expense` entity from the Finance module. The Expense entity already exists and handles all expense-related business logic.

**Properties**:
- `id`: string (UUID)
- `activityId`: string (Project Activity ID)
- `expenseId`: string (Finance module Expense ID - references Expense entity)
- `allocationPercentage`: number? (Percentage of expense allocated to this activity, 0-100)
- `allocationAmount`: number? (Fixed amount allocated to this activity)
- `notes`: string? (Notes about the allocation)
- `createdAt`: Date
- `createdBy`: string (User ID who created the link)

**Business Logic**:
- Either allocationPercentage or allocationAmount must be provided
- If allocationPercentage is used, sum across all activities for same expense should be <= 100
- If allocationAmount is used, sum across all activities for same expense should be <= expense.amount
- Expense must exist in Finance module and not be deleted
- Activity must exist and not be deleted

**Relations**:
- Belongs to Activity (Project module)
- Belongs to Expense (Finance module - existing entity)
- Belongs to Creator (User)

---

## Database Schema (Prisma)

```prisma
// ====================================
// PROJECT MODULE MODELS
// ====================================

model Project {
  id                    String   @id @default(uuid())
  name                  String   @db.VarChar(255)
  description           String   @db.Text
  code                  String   @unique @db.VarChar(50)
  category              String   @db.VarChar(50) // EDUCATION, HEALTH, etc.
  status                String   @db.VarChar(20) // PLANNING, ACTIVE, etc.
  phase                 String   @db.VarChar(20) // INITIATION, PLANNING, etc.
  startDate             DateTime
  endDate               DateTime?
  actualEndDate         DateTime?
  budget                Decimal  @db.Decimal(15, 2)
  spentAmount           Decimal  @default(0) @db.Decimal(15, 2)
  currency              String   @db.VarChar(3)
  location              String?  @db.VarChar(255)
  targetBeneficiaryCount Int?
  actualBeneficiaryCount Int?
  managerId             String   @db.VarChar(255)
  sponsorId             String?  @db.VarChar(255)
  tags                  String[] @db.VarChar(50)
  metadata              Json?
  
  // Relations
  manager               UserProfile @relation("ProjectManager", fields: [managerId], references: [id])
  sponsor               UserProfile? @relation("ProjectSponsor", fields: [sponsorId], references: [id])
  goals                 Goal[]
  activities            Activity[]
  milestones            Milestone[]
  teamMembers           ProjectTeamMember[]
  beneficiaries         Beneficiary[]
  risks                 ProjectRisk[]
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  version               BigInt    @default(0)
  deletedAt             DateTime?
  
  @@index([status])
  @@index([category])
  @@index([phase])
  @@index([managerId])
  @@index([code])
  @@map("projects")
}

model Goal {
  id              String   @id @default(uuid())
  projectId       String   @db.VarChar(255)
  title           String   @db.VarChar(255)
  description     String?  @db.Text
  targetValue     Decimal? @db.Decimal(15, 2)
  targetUnit      String?  @db.VarChar(50)
  currentValue    Decimal  @default(0) @db.Decimal(15, 2)
  deadline        DateTime?
  priority        String   @db.VarChar(20) // LOW, MEDIUM, HIGH, CRITICAL
  status          String   @db.VarChar(30) // NOT_STARTED, IN_PROGRESS, etc.
  weight          Decimal? @db.Decimal(5, 4) // 0-1
  dependencies    String[] // Array of goal IDs
  
  // Relations
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  version         BigInt    @default(0)
  deletedAt       DateTime?
  
  @@index([projectId])
  @@index([status])
  @@index([priority])
  @@map("goals")
}

model Activity {
  id                  String   @id @default(uuid())
  projectId           String   @db.VarChar(255)
  name                String   @db.VarChar(255)
  description         String?  @db.Text
  scale               String   @db.VarChar(20) // TASK, ACTIVITY, EVENT
  type                String   @db.VarChar(50) // TRAINING, AWARENESS, etc.
  status              String   @db.VarChar(20) // PLANNED, IN_PROGRESS, etc.
  priority            String   @db.VarChar(20) // LOW, MEDIUM, HIGH, URGENT
  startDate           DateTime?
  endDate             DateTime?
  actualStartDate     DateTime?
  actualEndDate       DateTime?
  location            String?  @db.VarChar(255)
  venue               String?  @db.VarChar(255) // Mainly for EVENTS
  assignedTo          String?  @db.VarChar(255) // Mainly for TASKS/ACTIVITIES
  organizerId         String?  @db.VarChar(255) // Mainly for EVENTS
  parentActivityId    String?  @db.VarChar(255) // For hierarchical breakdown
  expectedParticipants Int?    // Mainly for EVENTS
  actualParticipants  Int?     // Mainly for EVENTS
  estimatedCost       Decimal? @db.Decimal(15, 2)
  actualCost           Decimal? @db.Decimal(15, 2)
  currency             String?  @db.VarChar(3)
  tags                 String[] @db.VarChar(50)
  metadata             Json?
  
  // Relations
  project              Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  assignee             UserProfile? @relation("ActivityAssignee", fields: [assignedTo], references: [id])
  organizer            UserProfile? @relation("ActivityOrganizer", fields: [organizerId], references: [id])
  parentActivity       Activity? @relation("ActivityHierarchy", fields: [parentActivityId], references: [id])
  childActivities      Activity[] @relation("ActivityHierarchy")
  activityExpenses      ActivityExpense[]
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt
  version              BigInt    @default(0)
  deletedAt            DateTime?
  
  @@index([projectId])
  @@index([status])
  @@index([scale])
  @@index([type])
  @@index([assignedTo])
  @@index([organizerId])
  @@index([parentActivityId])
  @@map("activities")
}

model Milestone {
  id              String   @id @default(uuid())
  projectId       String   @db.VarChar(255)
  name            String   @db.VarChar(255)
  description     String?  @db.Text
  targetDate      DateTime
  actualDate      DateTime?
  status          String   @db.VarChar(20) // PENDING, IN_PROGRESS, etc.
  importance      String   @db.VarChar(20) // LOW, MEDIUM, HIGH, CRITICAL
  dependencies    String[] // Array of milestone IDs
  notes           String?  @db.Text
  
  // Relations
  project         Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  deletedAt       DateTime?
  
  @@index([projectId])
  @@index([status])
  @@index([targetDate])
  @@map("milestones")
}

model ProjectTeamMember {
  id                String   @id @default(uuid())
  projectId         String   @db.VarChar(255)
  userId            String   @db.VarChar(255)
  role              String   @db.VarChar(30) // PROJECT_MANAGER, TEAM_LEAD, etc.
  responsibilities  String?  @db.Text
  startDate         DateTime
  endDate           DateTime?
  hoursAllocated    Decimal? @db.Decimal(10, 2)
  isActive          Boolean  @default(true)
  
  // Relations
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  user              UserProfile @relation("ProjectTeamMember", fields: [userId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  @@unique([projectId, userId, isActive])
  @@index([projectId])
  @@index([userId])
  @@index([isActive])
  @@map("project_team_members")
}

model Beneficiary {
  id                String   @id @default(uuid())
  projectId         String   @db.VarChar(255)
  name              String   @db.VarChar(255)
  type              String   @db.VarChar(30) // INDIVIDUAL, FAMILY, etc.
  gender            String?  @db.VarChar(20) // MALE, FEMALE, etc.
  age               Int?
  dateOfBirth       DateTime?
  contactNumber     String?  @db.VarChar(20)
  email             String?  @db.VarChar(255)
  address           String?  @db.Text
  location          String?  @db.VarChar(255)
  category          String?  @db.VarChar(100)
  enrollmentDate    DateTime
  exitDate          DateTime?
  status            String   @db.VarChar(20) // ACTIVE, COMPLETED, etc.
  benefitsReceived  String[] @db.VarChar(100)
  notes             String?  @db.Text
  metadata          Json?
  
  // Relations
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  @@index([projectId])
  @@index([status])
  @@index([type])
  @@index([enrollmentDate])
  @@map("beneficiaries")
}

model ProjectRisk {
  id                String   @id @default(uuid())
  projectId         String   @db.VarChar(255)
  title             String   @db.VarChar(255)
  description       String?  @db.Text
  category          String   @db.VarChar(30) // BUDGET, TIMELINE, etc.
  severity          String   @db.VarChar(20) // LOW, MEDIUM, HIGH, CRITICAL
  probability       String   @db.VarChar(20) // LOW, MEDIUM, HIGH
  status            String   @db.VarChar(20) // IDENTIFIED, MONITORING, etc.
  impact            String?  @db.Text
  mitigationPlan    String?  @db.Text
  ownerId           String?  @db.VarChar(255)
  identifiedDate    DateTime
  resolvedDate      DateTime?
  notes             String?  @db.Text
  
  // Relations
  project           Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  owner             UserProfile? @relation("RiskOwner", fields: [ownerId], references: [id])
  
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  deletedAt         DateTime?
  
  @@index([projectId])
  @@index([status])
  @@index([severity])
  @@index([category])
  @@map("project_risks")
}

model ActivityExpense {
  id                  String   @id @default(uuid())
  activityId          String   @db.VarChar(255)
  expenseId            String   @db.VarChar(255) // References Finance module Expense entity
  allocationPercentage Decimal? @db.Decimal(5, 2) // 0-100
  allocationAmount     Decimal? @db.Decimal(15, 2)
  notes                String?  @db.Text
  createdBy            String   @db.VarChar(255)
  
  // Relations
  activity             Activity  @relation(fields: [activityId], references: [id], onDelete: Cascade)
  expense              Expense   @relation("ActivityExpense", fields: [expenseId], references: [id], onDelete: Cascade)
  creator              UserProfile @relation("ActivityExpenseCreator", fields: [createdBy], references: [id])
  
  createdAt           DateTime  @default(now())
  
  @@unique([activityId, expenseId])
  @@index([activityId])
  @@index([expenseId])
  @@map("activity_expenses")
}
```

**Note**: Need to add relations to existing models:
- `UserProfile`: Add `managedProjects`, `sponsoredProjects`, `assignedActivities`, `organizedActivities`, `projectTeamMembers`, `riskOwners`, `createdActivityExpenses`
- `Expense` (Finance module): Add `activityExpenses` relation

---

## API Endpoints

### Project Endpoints
- `POST /api/project/create` - Create new project
- `PATCH /api/project/:id/update` - Update project
- `GET /api/project/:id` - Get project by ID
- `GET /api/project/list` - List projects (with filters: status, category, phase, managerId, etc.)
- `PATCH /api/project/:id/status` - Update project status
- `PATCH /api/project/:id/phase` - Update project phase
- `GET /api/project/:id/goals` - Get all goals for a project
- `GET /api/project/:id/activities` - Get all activities for a project
- `GET /api/project/:id/milestones` - Get all milestones for a project
- `GET /api/project/:id/team` - Get all team members for a project
- `GET /api/project/:id/beneficiaries` - Get all beneficiaries for a project
- `GET /api/project/:id/risks` - Get all risks for a project
- `GET /api/project/:id/expenses` - Get all expenses linked to project activities
- `GET /api/project/:id/progress` - Get project progress summary (goals, budget, timeline)
- `GET /api/project/:id/dashboard` - Get project dashboard data

### Goal Endpoints
- `POST /api/goal/create` - Create new goal
- `PATCH /api/goal/:id/update` - Update goal
- `GET /api/goal/:id` - Get goal by ID
- `GET /api/goal/list` - List goals (with filters: projectId, status, priority)
- `PATCH /api/goal/:id/progress` - Update goal progress (currentValue)
- `DELETE /api/goal/:id` - Delete goal

### Activity Endpoints (Merged: Activities + Events)
- `POST /api/activity/create` - Create new activity (task, activity, or event)
- `PATCH /api/activity/:id/update` - Update activity
- `GET /api/activity/:id` - Get activity by ID
- `GET /api/activity/list` - List activities (with filters: projectId, scale, status, type, assignedTo, organizerId, parentActivityId)
- `PATCH /api/activity/:id/status` - Update activity status
- `GET /api/activity/:id/children` - Get child activities (for hierarchical breakdown)
- `POST /api/activity/:id/expense` - Link Finance module expense to activity
- `DELETE /api/activity/:id/expense/:expenseId` - Unlink expense from activity
- `GET /api/activity/:id/expenses` - Get all expenses linked to activity

### Milestone Endpoints
- `POST /api/milestone/create` - Create new milestone
- `PATCH /api/milestone/:id/update` - Update milestone
- `GET /api/milestone/:id` - Get milestone by ID
- `GET /api/milestone/list` - List milestones (with filters: projectId, status, importance)
- `PATCH /api/milestone/:id/complete` - Mark milestone as achieved
- `DELETE /api/milestone/:id` - Delete milestone

### Team Member Endpoints
- `POST /api/project-team/add` - Add team member to project
- `PATCH /api/project-team/:id/update` - Update team member details
- `GET /api/project-team/:id` - Get team member by ID
- `GET /api/project-team/list` - List team members (with filters: projectId, userId, isActive, role)
- `PATCH /api/project-team/:id/deactivate` - Deactivate team member
- `DELETE /api/project-team/:id` - Remove team member

### Beneficiary Endpoints
- `POST /api/beneficiary/create` - Create new beneficiary
- `PATCH /api/beneficiary/:id/update` - Update beneficiary
- `GET /api/beneficiary/:id` - Get beneficiary by ID
- `GET /api/beneficiary/list` - List beneficiaries (with filters: projectId, status, type, category)
- `PATCH /api/beneficiary/:id/exit` - Mark beneficiary as exited
- `GET /api/beneficiary/stats` - Get beneficiary statistics

### Risk Endpoints
- `POST /api/risk/create` - Create new risk
- `PATCH /api/risk/:id/update` - Update risk
- `GET /api/risk/:id` - Get risk by ID
- `GET /api/risk/list` - List risks (with filters: projectId, status, severity, category)
- `PATCH /api/risk/:id/status` - Update risk status
- `PATCH /api/risk/:id/resolve` - Mark risk as resolved
- `DELETE /api/risk/:id` - Delete risk

---

## Module Structure

```
src/modules/project/
├── domain/
│   ├── model/
│   │   ├── project.model.ts
│   │   ├── goal.model.ts
│   │   ├── activity.model.ts (merged activities + events)
│   │   ├── milestone.model.ts
│   │   ├── project-team-member.model.ts
│   │   ├── beneficiary.model.ts
│   │   └── project-risk.model.ts
│   ├── repositories/
│   │   ├── project.repository.interface.ts
│   │   ├── goal.repository.interface.ts
│   │   ├── activity.repository.interface.ts
│   │   ├── milestone.repository.interface.ts
│   │   ├── project-team-member.repository.interface.ts
│   │   ├── beneficiary.repository.interface.ts
│   │   └── project-risk.repository.interface.ts
│   └── events/
│       ├── project-created.event.ts
│       ├── goal-achieved.event.ts
│       ├── milestone-achieved.event.ts
│       └── activity-completed.event.ts
├── application/
│   ├── dto/
│   │   ├── project.dto.ts
│   │   ├── goal.dto.ts
│   │   ├── activity.dto.ts (merged)
│   │   ├── milestone.dto.ts
│   │   ├── project-team-member.dto.ts
│   │   ├── beneficiary.dto.ts
│   │   └── project-risk.dto.ts
│   ├── use-cases/
│   │   ├── create-project.use-case.ts
│   │   ├── update-project.use-case.ts
│   │   ├── update-project-phase.use-case.ts
│   │   ├── create-goal.use-case.ts
│   │   ├── update-goal-progress.use-case.ts
│   │   ├── create-activity.use-case.ts
│   │   ├── update-activity.use-case.ts
│   │   ├── create-milestone.use-case.ts
│   │   ├── add-team-member.use-case.ts
│   │   ├── create-beneficiary.use-case.ts
│   │   ├── create-risk.use-case.ts
│   │   └── link-expense-to-activity.use-case.ts
│   ├── services/
│   │   ├── project.service.ts
│   │   ├── goal.service.ts
│   │   ├── activity.service.ts
│   │   └── milestone.service.ts
│   └── dto/
│       └── project-dto.mapper.ts
├── infrastructure/
│   ├── persistence/
│   │   ├── project.repository.ts
│   │   ├── goal.repository.ts
│   │   ├── activity.repository.ts
│   │   ├── milestone.repository.ts
│   │   ├── project-team-member.repository.ts
│   │   ├── beneficiary.repository.ts
│   │   └── project-risk.repository.ts
│   ├── types/
│   │   └── project-persistence.types.ts
│   └── project-infra.mapper.ts
├── presentation/
│   └── controllers/
│       ├── project.controller.ts
│       ├── goal.controller.ts
│       ├── activity.controller.ts (merged)
│       ├── milestone.controller.ts
│       ├── project-team-member.controller.ts
│       ├── beneficiary.controller.ts
│       └── project-risk.controller.ts
└── project.module.ts
```

---

## Business Rules & Validations

### Project
1. Project code must be unique
2. End date must be after start date
3. Budget must be positive
4. Spent amount cannot exceed budget
5. Cannot cancel if status is COMPLETED
6. Cannot modify budget if status is COMPLETED
7. Phase transitions must follow sequence: INITIATION → PLANNING → EXECUTION → MONITORING → CLOSURE
8. Cannot move to next phase if current phase requirements not met
9. Project manager must be an active user
10. Actual beneficiary count should not exceed target (warning, not error)

### Goal
1. Goal must belong to an active project
2. Target value must be positive if provided
3. Current value cannot be negative
4. Weight should be between 0 and 1
5. Sum of weights for all goals in a project should be <= 1.0 (validation)
6. Status automatically updates based on currentValue vs targetValue
7. Cannot delete goal if it's a dependency for other goals

### Activity (Merged)
1. Activity must belong to an active project
2. End date must be after start date
3. Actual dates should be within project timeline
4. Cannot cancel if status is COMPLETED
5. Estimated and actual costs must be positive if provided
6. If scale is EVENT, organizerId should be provided
7. If scale is TASK or ACTIVITY, assignedTo is recommended
8. Parent activity must exist and belong to same project
9. Cannot create circular parent-child relationships
10. Assigned user or organizer must be an active user

### Milestone
1. Milestone must belong to an active project
2. Target date should be within project timeline
3. Status automatically updates based on targetDate vs actualDate
4. Cannot delete milestone if it's a dependency for other milestones

### Project Team Member
1. User must be an active user
2. Project must be active
3. End date must be after start date
4. Cannot have duplicate active team members for same user and project
5. Hours allocated must be positive if provided

### Beneficiary
1. Beneficiary must belong to an active project
2. Exit date must be after enrollment date
3. Cannot have duplicate beneficiaries (same name + contact in same project)
4. Age should be consistent with dateOfBirth if both provided

### Project Risk
1. Risk must belong to an active project
2. Resolved date must be after identified date
3. Cannot close risk without mitigation plan if severity is HIGH or CRITICAL
4. Owner must be an active user if provided

### Activity Expense
1. Expense must exist in Finance module and not be deleted
2. Activity must exist and not be deleted
3. Allocation percentage must be between 0 and 100
4. Allocation amount must be <= expense amount
5. Sum of allocation percentages for an expense should be <= 100
6. Sum of allocation amounts for an expense should be <= expense amount
7. Creator must be an active user

---

## Progress Calculation

### Project Progress
```
Project Progress = Σ(Goal.currentValue / Goal.targetValue * Goal.weight) for all goals
```

### Budget Utilization
```
Budget Utilization = (spentAmount / budget) * 100
```

### Goal Status Logic
- `ACHIEVED`: currentValue >= targetValue
- `PARTIALLY_ACHIEVED`: currentValue > 0 && currentValue < targetValue && deadline passed
- `IN_PROGRESS`: currentValue > 0 && currentValue < targetValue && deadline not passed
- `NOT_STARTED`: currentValue == 0
- `FAILED`: deadline passed && currentValue < targetValue * 0.5

### Milestone Status Logic
- `ACHIEVED`: actualDate is set
- `DELAYED`: targetDate passed && actualDate is null && status is IN_PROGRESS
- `MISSED`: targetDate passed && actualDate is null && status is PENDING
- `IN_PROGRESS`: targetDate is approaching (within 7 days) && actualDate is null
- `PENDING`: targetDate is in future && actualDate is null

---

## Integration with Finance Module

### Expense Linking
- **ActivityExpense** junction table links Project Activities to Finance module Expenses
- Expenses are created and managed in the Finance module
- Project module only links existing expenses to activities
- Supports both percentage and fixed amount allocation
- One expense can be allocated to multiple activities (up to 100% total)

### Expense Flow
1. Expense is created in Finance module (via ExpenseController)
2. Expense can be linked to Project Activity via ActivityExpense
3. Project can track expenses through activities
4. Project spentAmount can be calculated from linked expenses

### Benefits
- Single source of truth for expenses (Finance module)
- Project module tracks which expenses relate to which activities
- No duplication of expense data
- Consistent expense management across the system

---

## Dashboard & Reporting

### Project Dashboard
- Overall progress (goals completion)
- Budget utilization (spentAmount / budget)
- Timeline status
- Team members count
- Beneficiaries count
- Active risks count
- Upcoming milestones
- Recent activities (by scale: tasks, activities, events)
- Recent expenses

### Beneficiary Statistics
- Total beneficiaries by type
- Active vs completed beneficiaries
- Beneficiaries by category
- Enrollment trends over time

### Risk Dashboard
- Risks by severity
- Risks by category
- Risks by status
- Risk mitigation progress

### Activity Dashboard
- Activities by scale (TASK, ACTIVITY, EVENT)
- Activities by status
- Activities by type
- Cost tracking (estimated vs actual)
- Hierarchical view (events with their child activities)

---

## Next Steps After Approval

1. Create Prisma schema models
2. Create domain models with business logic
3. Create repository interfaces and implementations
4. Create DTOs and mappers
5. Create use cases
6. Create application services
7. Create controllers
8. Register module and update Swagger config
9. Update Finance module Expense entity to add activityExpenses relation
