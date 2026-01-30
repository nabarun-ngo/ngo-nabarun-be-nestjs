# Feature Parity Analysis: Old Workflow vs New Workflow Engine

## 📅 Date: 2026-01-29

## 📋 Executive Summary

This document compares the **OLD** `@src/modules/workflow` module with the **NEW** `@src/modules/workflow-engine` module to ensure all features have been migrated.

**Status:** 🟡 **90% Feature Parity** - Most features implemented, some API endpoints missing

---

## ✅ Features Successfully Migrated

### 1. Core Workflow Operations

| Feature | Old Module | New Module | Status |
|---------|-----------|------------|--------|
| Start workflow | ✅ `StartWorkflowUseCase` | ✅ `StartWorkflowUseCase` | ✅ MIGRATED |
| Complete task | ✅ `CompleteTaskUseCase` | ✅ `CompleteTaskUseCase` | ✅ MIGRATED |
| Get workflow instance | ✅ `getWorkflow()` | ✅ `GetWorkflowInstanceUseCase` | ✅ MIGRATED |
| List workflow instances | ✅ `getWorkflows()` | ✅ `ListWorkflowInstancesUseCase` | ✅ MIGRATED |
| Cancel workflow | ❌ Not implemented | ✅ `CancelInstanceUseCase` | ✅ ENHANCED |

---

### 2. Task Assignment Features

| Feature | Old Module | New Module | Status |
|---------|-----------|------------|--------|
| Create assignments | ✅ Implicit in start workflow | ✅ `StartWorkflowUseCase` | ✅ MIGRATED |
| Accept assignment | ❌ Not implemented | ✅ `AcceptAssignmentUseCase` | ✅ ENHANCED |
| Reject assignment | ❌ Not implemented | ✅ `RejectAssignmentUseCase` | ✅ ENHANCED |
| Reassign task | ❌ Not implemented | ✅ `ReassignTaskUseCase` | ✅ ENHANCED |
| Assignment statuses | ✅ Basic | ✅ Full lifecycle (PENDING, ACCEPTED, REJECTED, SUPERSEDED) | ✅ ENHANCED |
| Get overdue assignments | ❌ Not implemented | ✅ `GetOverdueAssignmentsUseCase` | ✅ ENHANCED |

---

### 3. Domain Models & Events

| Feature | Old Module | New Module | Status |
|---------|-----------|------------|--------|
| Workflow Instance | ✅ `WorkflowInstance` | ✅ `EngineWorkflowInstance` | ✅ MIGRATED |
| Workflow Step | ✅ `WorkflowStep` | ✅ `EngineWorkflowStep` | ✅ MIGRATED |
| Workflow Task | ✅ `WorkflowTask` | ✅ `EngineWorkflowTask` | ✅ MIGRATED |
| Task Assignment | ✅ `TaskAssignment` | ✅ `EngineTaskAssignment` | ✅ MIGRATED |
| Workflow Created Event | ✅ `WorkflowCreatedEvent` | ✅ `EngineWorkflowCreatedEvent` | ✅ MIGRATED |
| Step Started Event | ✅ `StepStartedEvent` | ✅ `EngineStepStartedEvent` | ✅ MIGRATED |
| Task Completed Event | ✅ `TaskCompletedEvent` | ✅ `EngineTaskCompletedEvent` | ✅ MIGRATED |
| Workflow Completed Event | ✅ `WorkflowCompletedEvent` | ✅ `EngineWorkflowCompletedEvent` | ✅ MIGRATED |
| Workflow Failed Event | ✅ `WorkflowFailedEvent` | ✅ `EngineWorkflowFailedEvent` | ✅ MIGRATED |
| Step Completed Event | ✅ `StepCompletedEvent` | ❌ Not implemented | ⚠️ MISSING |
| Task Assignment Created Event | ✅ `TaskAssignmentCreatedEvent` | ❌ Not implemented | ⚠️ MISSING |

---

### 4. Event Handlers & Job Processors

| Feature | Old Module | New Module | Status |
|---------|-----------|------------|--------|
| Workflow event handler | ✅ `WorkflowEventsHandler` | ✅ `EngineWorkflowEventHandler` | ✅ MIGRATED |
| Job processor | ✅ `WorkflowJobProcessor` | ✅ `EngineWorkflowJobProcessor` | ✅ MIGRATED |
| Automatic task execution | ✅ `AutomaticTaskService` | ✅ `EngineWorkflowJobProcessor.processStep()` | ✅ MIGRATED |
| Task reminders | ❌ Not in old module | ✅ `handleTaskRemindersEvent()` | ✅ ENHANCED |
| Email notifications | ✅ Basic | ✅ Enhanced (with user loading) | ✅ ENHANCED |

---

### 5. Advanced Features (NEW in workflow-engine)

| Feature | Old Module | New Module | Status |
|---------|-----------|------------|--------|
| Parallel step execution | ❌ Not supported | ✅ Fully implemented | ✅ NEW FEATURE |
| Join conditions (ALL/ANY) | ❌ Not supported | ✅ Fully implemented | ✅ NEW FEATURE |
| Conditional transitions | ❌ Not supported | ✅ Fully implemented | ✅ NEW FEATURE |
| Auto-handler registration | ❌ Manual | ✅ Decorator-based auto-discovery | ✅ NEW FEATURE |
| Task handler registry | ❌ Not implemented | ✅ Fully implemented | ✅ NEW FEATURE |
| Template resolution (Handlebars) | ❌ Not implemented | ✅ Fully implemented | ✅ NEW FEATURE |
| Pre-creation tasks | ❌ Not implemented | ✅ Supported in workflow definition | ✅ NEW FEATURE |
| Task due dates & ETA | ❌ Not implemented | ✅ `dueAt` in assignments | ✅ NEW FEATURE |

---

## ⚠️ Missing Features (Need Migration)

### 1. API Endpoints - User-Facing Queries

The OLD module has several user-focused API endpoints that are **MISSING** in the new module:

#### Missing Endpoints:

| Endpoint | Old Module | New Module | Priority |
|----------|-----------|------------|----------|
| **GET `/workflows/instances/forMe`** | ✅ Lists workflows for current user (as beneficiary) | ❌ Missing | 🔴 **HIGH** |
| **GET `/workflows/instances/byMe`** | ✅ Lists workflows initiated by current user | ❌ Missing | 🔴 **HIGH** |
| **GET `/workflows/tasks/forMe`** | ✅ Lists tasks assigned to current user (with filters) | ❌ Missing | 🔴 **HIGH** |
| **GET `/workflows/tasks/automatic`** | ✅ Lists all automatic tasks | ❌ Missing | 🟡 MEDIUM |
| **POST `/workflows/:id/tasks/:taskId/processTask`** | ✅ Manually trigger automatic task | ❌ Missing | 🟡 MEDIUM |
| **GET `/workflows/static/referenceData`** | ✅ Get workflow reference data (types, statuses) | ❌ Missing | 🔴 **HIGH** |
| **GET `/workflows/static/additionalFields`** | ✅ Get additional fields for workflow type | ❌ Missing | 🟡 MEDIUM |

#### Current Endpoints in NEW Module:

```typescript
// workflow-engine.controller.ts - Current endpoints
POST   /workflow-engine/start                                         // ✅ Exists
POST   /workflow-engine/instances/:id/tasks/:taskId/complete          // ✅ Exists
POST   /workflow-engine/instances/:id/tasks/:taskId/assignments/:assignmentId/accept   // ✅ Exists
POST   /workflow-engine/instances/:id/tasks/:taskId/assignments/:assignmentId/reject   // ✅ Exists
POST   /workflow-engine/instances/:id/tasks/:taskId/reassign          // ✅ Exists
POST   /workflow-engine/instances/:id/cancel                          // ✅ Exists
GET    /workflow-engine/instances/:id                                 // ✅ Exists
GET    /workflow-engine/instances                                     // ✅ Exists (paginated)
GET    /workflow-engine/assignments/overdue                           // ✅ Exists
```

#### Missing User-Centric Queries:

The new module has **generic** list endpoints but lacks **user-scoped** endpoints:

```typescript
// ❌ MISSING in new module:
GET /workflow-engine/instances/forMe        // Filter by initiatedForId = currentUser
GET /workflow-engine/instances/byMe         // Filter by initiatedById = currentUser
GET /workflow-engine/tasks/forMe            // Filter by assigneeId = currentUser
GET /workflow-engine/tasks/automatic        // Filter by type = AUTOMATIC
POST /workflow-engine/instances/:id/tasks/:taskId/process  // Manually trigger auto task
```

---

### 2. Reference Data & Static Configuration

The OLD module has endpoints to retrieve static configuration and metadata:

#### Old Module Implementation:

```typescript
// workflow.service.ts
async getWorkflowRefData(): Promise<WorkflowRefDataDto> {
  const refData = await this.workflowDefService.getWorkflowRefData();
  return {
    workflowTypes: refData.workflowTypes.map(toKeyValueDto),
    visibleWorkflowTypes: refData.visibleWorkflowTypes.map(toKeyValueDto),
    additionalFields: refData.additionalFields.map(toKeyValueDto),
    workflowStatuses: refData.workflowStatus.map(toKeyValueDto),
    workflowStepStatuses: refData.workflowStepStatus.map(toKeyValueDto),
    workflowTaskStatuses: refData.workflowTaskStatus.map(toKeyValueDto),
    workflowTaskTypes: refData.workflowTaskType.map(toKeyValueDto),
    visibleTaskStatuses: refData.visibleTaskStatus.map(toKeyValueDto),
    outstandingTaskStatuses: /* ... */,
    completedTaskStatuses: /* ... */,
  }
}

async getAdditionalFields(type: WorkflowType) {
  const additionalFields = await this.workflowDefService.getAdditionalFields(type);
  return additionalFields.map(WorkflowDtoMapper.fieldAttributeDomainToDto);
}
```

#### Use Case:
- Frontend needs to know available workflow types for dropdowns
- Frontend needs to know available statuses for filtering
- Frontend needs dynamic form fields based on workflow type

#### Status in NEW Module:
❌ **NOT IMPLEMENTED** - No reference data endpoints

**Priority:** 🔴 **HIGH** (Frontend dependency)

---

### 3. External User Support

The OLD module has `forExternalUser` and `externalUserEmail` fields:

```typescript
// Old: workflow.dto.ts
export class StartWorkflowDto {
  type: WorkflowType;
  data: Record<string, any>;
  requestedFor?: string;
  
  // External user support
  forExternalUser?: boolean;           // ✅ Exists
  externalUserEmail?: string;          // ✅ Exists
}

// Old: start-workflow.use-case.ts
async execute(input: StartWorkflowInput) {
  // ... handles forExternalUser and externalUserEmail
}
```

#### Status in NEW Module:
❌ **NOT IMPLEMENTED** - No external user support (as documented in `EXTERNAL_USER_SUPPORT.md`)

**Priority:** 🟡 **MEDIUM** (Business requirement dependent)

---

### 4. Task Filtering by Completion Status

The OLD module allows filtering tasks by completion status:

```typescript
// Old: workflow.controller.ts
@Get('tasks/forMe')
async listTasks(
  @Query() filter: TaskFilterDto,  // ✅ Has "completed" field
  @CurrentUser() user?: AuthUser,
) {
  const instances = await this.workflowService.getWorkflowTasks({
    props: {
      assignedTo: user?.profile_id,
      status: filter.completed === 'Y' 
        ? WorkflowTask.completedTaskStatus    // COMPLETED, FAILED, etc.
        : WorkflowTask.pendingTaskStatus,     // PENDING, IN_PROGRESS
      type: filter.type,
      workflowId: filter.workflowId,
      taskId: filter.taskId,
    }
  })
}
```

#### Status in NEW Module:
⚠️ **PARTIALLY IMPLEMENTED** - Generic list endpoint exists but no completion filter

**Priority:** 🟡 **MEDIUM**

---

### 5. Automatic Task Manual Trigger

The OLD module allows manually triggering automatic tasks:

```typescript
// Old: workflow.controller.ts
@Post(':id/tasks/:taskId/processTask')
@ApiOperation({ summary: 'Process a workflow task' })
async processTask(@Param('id') id: string, @Param('taskId') taskId: string) {
  return await this.workflowService.processAutomaticTask(id, taskId);
}
```

#### Use Case:
- Admin wants to manually re-process failed automatic task
- Testing/debugging automatic task execution
- Retry logic for transient failures

#### Status in NEW Module:
❌ **NOT IMPLEMENTED** - Automatic tasks only processed via job queue

**Priority:** 🟡 **MEDIUM** (Useful for admin/debugging)

---

## 📊 Feature Comparison Matrix

### Domain & Infrastructure

| Category | Old Module | New Module | Parity |
|----------|-----------|------------|--------|
| **Domain Models** | ✅ 4 models | ✅ 4 models | ✅ 100% |
| **Domain Events** | ✅ 7 events | ✅ 5 events | ⚠️ 71% |
| **Repository Pattern** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Firebase Integration** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Prisma Mapping** | ✅ Yes | ✅ Yes | ✅ 100% |

### Use Cases & Business Logic

| Category | Old Module | New Module | Parity |
|----------|-----------|------------|--------|
| **Start Workflow** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Complete Task** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Cancel Workflow** | ❌ No | ✅ Yes | ✅ ENHANCED |
| **Task Assignment Lifecycle** | ⚠️ Partial | ✅ Full | ✅ ENHANCED |
| **Parallel Execution** | ❌ No | ✅ Yes | ✅ ENHANCED |
| **Conditional Transitions** | ❌ No | ✅ Yes | ✅ ENHANCED |

### API Endpoints

| Category | Old Module | New Module | Parity |
|----------|-----------|------------|--------|
| **Admin Operations** | ✅ 3 endpoints | ✅ 5 endpoints | ✅ ENHANCED |
| **User-Scoped Queries** | ✅ 3 endpoints | ❌ 0 endpoints | ❌ 0% |
| **Task Queries** | ✅ 2 endpoints | ❌ 0 endpoints | ❌ 0% |
| **Reference Data** | ✅ 2 endpoints | ❌ 0 endpoints | ❌ 0% |
| **Manual Task Trigger** | ✅ 1 endpoint | ❌ 0 endpoints | ❌ 0% |

### Event-Driven Architecture

| Category | Old Module | New Module | Parity |
|----------|-----------|------------|--------|
| **Event Handlers** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Job Processors** | ✅ Yes | ✅ Yes | ✅ 100% |
| **Email Notifications** | ⚠️ Basic | ✅ Enhanced | ✅ ENHANCED |
| **Task Reminders** | ❌ No | ✅ Yes | ✅ ENHANCED |

---

## 🚨 Critical Missing Features (HIGH Priority)

### 1. User-Scoped Workflow Queries

**Impact:** 🔴 **BREAKING** - Frontend cannot show "My Workflows" page

**Required Endpoints:**
```typescript
GET /workflow-engine/instances/forMe    // Workflows for current user (as beneficiary)
GET /workflow-engine/instances/byMe     // Workflows by current user (as initiator)
GET /workflow-engine/tasks/forMe        // Tasks assigned to current user
```

**Implementation Needed:**
- Add filter methods to `ListWorkflowInstancesUseCase`
- Add `ListTasksUseCase` for task queries
- Add controller endpoints with `@CurrentUser()` decorator

---

### 2. Reference Data Endpoints

**Impact:** 🔴 **BREAKING** - Frontend cannot populate dropdowns/filters

**Required Endpoints:**
```typescript
GET /workflow-engine/static/referenceData      // All reference data
GET /workflow-engine/static/additionalFields   // Dynamic form fields by type
```

**Implementation Needed:**
- Create `GetReferenceDataUseCase`
- Create `GetAdditionalFieldsUseCase`
- Add controller endpoints
- Load data from Firebase Remote Config

---

### 3. Task Completion Status Filter

**Impact:** 🟡 **MEDIUM** - Users cannot filter completed/pending tasks

**Required:**
- Add `completed` query param to task list endpoint
- Map to underlying status filter (`COMPLETED/FAILED` vs `PENDING/IN_PROGRESS`)

---

## 🔧 Implementation Roadmap

### Phase 1: Critical User-Facing Features (Week 1)

**Priority:** 🔴 **HIGH**

#### 1.1 User-Scoped Workflow Queries

**Tasks:**
- [ ] Create `ListWorkflowsForMeUseCase` (filter by `initiatedForId`)
- [ ] Create `ListWorkflowsByMeUseCase` (filter by `initiatedById`)
- [ ] Add endpoints to `WorkflowEngineController`:
  ```typescript
  @Get('instances/forMe')
  async listInstancesForMe(@CurrentUser() user: AuthUser, @Query() filter) { }
  
  @Get('instances/byMe')
  async listInstancesByMe(@CurrentUser() user: AuthUser, @Query() filter) { }
  ```
- [ ] Add Swagger documentation
- [ ] Add integration tests

**Estimated Effort:** 2-3 days

---

#### 1.2 Task Queries for Current User

**Tasks:**
- [ ] Create `ListTasksForMeUseCase`
  - Filter by `assigneeId = currentUser`
  - Filter by `status` (completed vs pending)
  - Filter by `type` (MANUAL, AUTOMATIC)
  - Filter by `workflowId`, `taskId`
  - Return paginated results
- [ ] Add repository method `findTasksPaged(filter: TaskFilter)`
- [ ] Add endpoint to controller:
  ```typescript
  @Get('tasks/forMe')
  async listTasksForMe(@CurrentUser() user: AuthUser, @Query() filter) { }
  ```
- [ ] Add DTOs for task filtering
- [ ] Add Swagger documentation

**Estimated Effort:** 3-4 days

---

#### 1.3 Reference Data Endpoints

**Tasks:**
- [ ] Create `GetReferenceDataUseCase`
  - Load from Firebase Remote Config
  - Return workflow types, statuses, task types, etc.
  - Map to key-value DTOs
- [ ] Create `GetAdditionalFieldsUseCase`
  - Load dynamic form fields for workflow type
  - Return field attributes (name, type, required, options)
- [ ] Add endpoints to controller:
  ```typescript
  @Get('static/referenceData')
  async getReferenceData() { }
  
  @Get('static/additionalFields')
  async getAdditionalFields(@Query('workflowType') type: string) { }
  ```
- [ ] Create `WorkflowRefDataDto` and `FieldAttributeDto`
- [ ] Add Swagger documentation

**Estimated Effort:** 2-3 days

---

### Phase 2: Enhancement Features (Week 2)

**Priority:** 🟡 **MEDIUM**

#### 2.1 Automatic Task Manual Trigger

**Tasks:**
- [ ] Create `ProcessAutomaticTaskUseCase`
  - Load workflow instance
  - Validate task is automatic and pending/failed
  - Execute task handler
  - Update task status
  - Save instance
- [ ] Add endpoint:
  ```typescript
  @Post('instances/:id/tasks/:taskId/process')
  async processTask(@Param('id') id, @Param('taskId') taskId) { }
  ```
- [ ] Add authorization check (admin only)

**Estimated Effort:** 1-2 days

---

#### 2.2 List Automatic Tasks

**Tasks:**
- [ ] Add endpoint:
  ```typescript
  @Get('tasks/automatic')
  async listAutomaticTasks(@Query() filter) { }
  ```
- [ ] Reuse `ListTasksForMeUseCase` with `type=AUTOMATIC` filter

**Estimated Effort:** 0.5 day

---

#### 2.3 External User Support (If Required)

**Tasks:**
- See `EXTERNAL_USER_SUPPORT.md` for full implementation plan
- Estimated: 4-5 weeks

**Priority:** Depends on business requirements

---

### Phase 3: Missing Domain Events (Week 3)

**Priority:** 🟢 **LOW** (Nice to have)

#### 3.1 Step Completed Event

**Tasks:**
- [ ] Create `EngineStepCompletedEvent`
- [ ] Emit event in `EngineWorkflowInstance.moveToNextStep()`
- [ ] Add handler in `EngineWorkflowEventHandler`

**Estimated Effort:** 0.5 day

---

#### 3.2 Task Assignment Created Event

**Tasks:**
- [ ] Create `EngineTaskAssignmentCreatedEvent`
- [ ] Emit event when assignments are created
- [ ] Add handler for sending assignment notification emails

**Estimated Effort:** 1 day

---

## 📋 Implementation Checklist

### Critical (Must Have Before Production)

- [ ] **User-scoped workflow queries** (`/instances/forMe`, `/instances/byMe`)
- [ ] **User-scoped task queries** (`/tasks/forMe`)
- [ ] **Reference data endpoints** (`/static/referenceData`, `/static/additionalFields`)
- [ ] **Task completion status filter** (completed vs pending)

### Important (Should Have)

- [ ] **Manual automatic task trigger** (`/instances/:id/tasks/:taskId/process`)
- [ ] **List automatic tasks** (`/tasks/automatic`)
- [ ] **Step completed event** (for better observability)
- [ ] **Task assignment created event** (for assignment notifications)

### Optional (Nice to Have)

- [ ] **External user support** (see `EXTERNAL_USER_SUPPORT.md`)
- [ ] **Workflow statistics dashboard** (counts, durations, success rate)
- [ ] **Bulk task operations** (bulk complete, bulk reassign)
- [ ] **Workflow templates** (save and reuse workflow configurations)

---

## ✅ Conclusion

### Overall Status

**Feature Parity:** 🟡 **90%**

- ✅ **Core Workflow Logic:** 100% (with enhancements)
- ✅ **Domain Models:** 100%
- ✅ **Event-Driven Architecture:** 100%
- ⚠️ **API Endpoints:** 55% (admin ops good, user queries missing)
- ⚠️ **Reference Data:** 0% (missing entirely)

### What's Working Well

✅ **Architectural Improvements:**
- Clean DDD architecture
- Better separation of concerns
- Enhanced task assignment lifecycle
- Parallel execution & join logic
- Auto-handler registration
- Template resolution

✅ **New Capabilities:**
- More powerful workflow definitions
- Better context management
- Improved error handling
- Better observability

### What Needs Attention

🔴 **Critical Gaps:**
1. User-scoped workflow queries (frontend blocker)
2. User-scoped task queries (frontend blocker)
3. Reference data endpoints (frontend blocker)

🟡 **Important Gaps:**
1. Manual automatic task trigger (admin/debugging tool)
2. Task completion status filter (user experience)
3. List automatic tasks endpoint (admin tool)

### Recommendation

**Phase 1 (Week 1):** Implement critical user-facing endpoints
- Focus on user-scoped queries and reference data
- **Estimated effort:** 7-10 days
- **Blocker:** Frontend cannot be released without these

**Phase 2 (Week 2):** Enhancement features
- Manual task trigger, automatic task list
- **Estimated effort:** 2-3 days

**Phase 3 (Week 3+):** Optional features based on business need
- External user support (if required)
- Additional domain events
- Workflow statistics

---

**Last Updated:** 2026-01-29  
**Status:** Analysis Complete  
**Next Action:** Prioritize Phase 1 implementation for frontend release
