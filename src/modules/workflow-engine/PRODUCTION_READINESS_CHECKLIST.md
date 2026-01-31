# Workflow Engine - Production Readiness Checklist

## 📋 Executive Summary

**Current Status:** 🟡 **85% Ready** - Minor gaps prevent production deployment  
**Estimated Time to Complete:** 1-2 days  
**Blocking Issues:** 1 Critical, 3 Medium Priority

---

## 🔴 CRITICAL PRIORITY (Must Fix Before Production)

### 1. Add External User Support

**Business Impact:** 🔴 **BLOCKING** - Guest user workflows will fail

#### 1.1. Update Prisma Schema

**File:** `prisma/schema.prisma`

Add to `EngineWorkflowInstance` model (around line 327):

```prisma
model EngineWorkflowInstance {
  id                String   @id @default(uuid())
  // ... existing fields ...
  
  // ADD THESE TWO FIELDS:
  isExternalUser    Boolean  @default(false)
  externalUserEmail String?  @db.VarChar(100)
  
  // ... rest of model ...
  
  @@index([isExternalUser])  // ADD THIS INDEX
  @@map("engine_workflow_instances")
}
```

**Run Migration:**
```bash
npx prisma migrate dev --name add_external_user_support_to_workflow_engine
npx prisma generate
```

#### 1.2. Update Domain Model

**File:** `src/modules/workflow-engine/domain/model/engine-workflow-instance.model.ts`

**Add to interface (line 24):**
```typescript
export interface EngineWorkflowInstanceProps {
  // ... existing props ...
  isExternalUser?: boolean;
  externalUserEmail?: string | null;
}
```

**Add to class (line 42):**
```typescript
export class EngineWorkflowInstance extends AggregateRoot<string> {
  // ... existing fields ...
  #isExternalUser: boolean;
  #externalUserEmail: string | null;

  constructor(props: EngineWorkflowInstanceProps) {
    super(props.id, props.createdAt, props.updatedAt);
    // ... existing assignments ...
    this.#isExternalUser = props.isExternalUser ?? false;
    this.#externalUserEmail = props.externalUserEmail ?? null;
  }

  // ADD GETTERS (around line 320):
  get isExternalUser(): boolean {
    return this.#isExternalUser;
  }
  
  get externalUserEmail(): string | null {
    return this.#externalUserEmail;
  }
}
```

**Update `static create()` method (line 73):**
```typescript
static create(data: {
  type: string;
  definition: EngineWorkflowDefinition;
  requestedBy: string;
  data?: Record<string, unknown>;
  requestedFor?: string | null;
  isExternalUser?: boolean;        // ADD
  externalUserEmail?: string | null; // ADD
}): EngineWorkflowInstance {
  const instance = new EngineWorkflowInstance({
    // ... existing props ...
    initiatedById: data.isExternalUser ? null : data.requestedBy, // UPDATE
    initiatedForId: data.requestedFor ?? data.requestedBy,
    isExternalUser: data.isExternalUser ?? false,           // ADD
    externalUserEmail: data.externalUserEmail ?? null,      // ADD
  });
  return instance;
}
```

#### 1.3. Update Infrastructure Mapper

**File:** `src/modules/workflow-engine/infrastructure/engine-infra.mapper.ts`

**Update type (line 11):**
```typescript
type PrismaEngineInstance = {
  // ... existing fields ...
  isExternalUser: boolean;        // ADD
  externalUserEmail: string | null; // ADD
};
```

**Update `toDomain()` (line 86):**
```typescript
static toDomain(prisma: PrismaEngineInstance): EngineWorkflowInstance {
  const instance = new EngineWorkflowInstance({
    // ... existing props ...
    isExternalUser: prisma.isExternalUser,        // ADD
    externalUserEmail: prisma.externalUserEmail,  // ADD
  });
  return instance;
}
```

**Update `toPrismaInstanceCreate()` (line 231):**
```typescript
static toPrismaInstanceCreate(instance: EngineWorkflowInstance) {
  return {
    // ... existing fields ...
    isExternalUser: instance.isExternalUser,        // ADD
    externalUserEmail: instance.externalUserEmail,  // ADD
  };
}
```

#### 1.4. Update DTOs

**File:** `src/modules/workflow-engine/application/dto/workflow-engine.dto.ts`

**Add to `StartWorkflowDto`:**
```typescript
export class StartWorkflowDto {
  // ... existing fields ...
  
  @ApiPropertyOptional({ description: 'Is external user?' })
  isExternalUser?: boolean;

  @ApiPropertyOptional({ description: 'External user email' })
  externalUserEmail?: string;
}
```

**Add to `EngineWorkflowInstanceDto`:**
```typescript
export class EngineWorkflowInstanceDto {
  // ... existing fields ...
  
  @ApiPropertyOptional()
  isExternalUser?: boolean;

  @ApiPropertyOptional()
  externalUserEmail?: string;
}
```

#### 1.5. Update Use Case

**File:** `src/modules/workflow-engine/application/use-cases/start-workflow.use-case.ts`

**Update interface (line 16):**
```typescript
export interface StartWorkflowInput {
  // ... existing fields ...
  isExternalUser?: boolean;        // ADD
  externalUserEmail?: string;      // ADD
}
```

**Update `execute()` (line 81):**
```typescript
const instance = EngineWorkflowInstance.create({
  type: input.type,
  definition: resolvedDef,
  requestedBy: input.requestedBy,
  data: input.data,
  requestedFor: input.requestedFor ?? undefined,
  isExternalUser: input.isExternalUser,        // ADD
  externalUserEmail: input.externalUserEmail,  // ADD
});
```

#### 1.6. Update Event Handler

**File:** `src/modules/workflow-engine/application/handlers/engine-workflow-event.handler.ts`

**Add imports:**
```typescript
import type { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
```

**Add to constructor (line 41):**
```typescript
constructor(
  private readonly jobProcessingService: JobProcessingService,
  @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
  private readonly workflowRepository: IEngineWorkflowInstanceRepository,
  private readonly correspondenceService: CorrespondenceService,
  @Inject(USER_REPOSITORY)                                    // ADD
  private readonly userRepository: IUserRepository,           // ADD
) {}
```

**Update `sendWorkflowUpdateEmail()` (line 235):**
```typescript
private async sendWorkflowUpdateEmail(
  workflow: EngineWorkflowInstance,
  action: string,
): Promise<void> {
  try {
    const activeSteps = workflow.getActiveSteps();
    const currentStepNames = activeSteps.map((s) => s.name).join(', ');

    const emailData = await this.correspondenceService.getEmailTemplateData(
      EmailTemplateName.WORKFLOW_UPDATE,
      {
        workflow: {
          id: workflow.id,
          type: workflow.type,
          name: workflow.name,
          status: workflow.status,
        },
        action,
        currentStepName: currentStepNames || 'N/A',
      },
    );

    if (emailData.body?.content?.table?.[0]?.data) {
      emailData.body.content.table[0].data = workflow.steps.map((s) => [
        s.name,
        s.status,
      ]);
    }

    const recipients: { to?: string; cc?: string } = {};
    
    // REPLACE THIS SECTION (CRITICAL FIX):
    if (workflow.isExternalUser && workflow.externalUserEmail) {
      recipients.to = workflow.externalUserEmail;
    } else {
      if (workflow.initiatedById) {
        const initiatedBy = await this.userRepository.findById(workflow.initiatedById);
        if (initiatedBy?.email) recipients.cc = initiatedBy.email;
      }
      if (workflow.initiatedForId) {
        const initiatedFor = await this.userRepository.findById(workflow.initiatedForId);
        if (initiatedFor?.email) recipients.to = initiatedFor.email;
      }
    }

    if (Object.keys(recipients).length > 0) {
      await this.correspondenceService.sendTemplatedEmail({
        templateData: emailData,
        options: { recipients },
      });
    }
  } catch (error) {
    this.logger.error(`Failed to send workflow update email`, error);
  }
}
```

#### ✅ Acceptance Criteria

- [ ] Prisma migration successful
- [ ] Domain model updated
- [ ] DTOs updated
- [ ] Use case accepts external user params
- [ ] Emails sent to external users
- [ ] Test: Create workflow with `isExternalUser=true`

---

## 🟡 MEDIUM PRIORITY

### 2. Add Static Data Endpoints (2-3 hours)

#### Create Service

**File:** `src/modules/workflow-engine/application/services/static-data.service.ts` (NEW)

```typescript
import { Injectable, Inject } from '@nestjs/common';
import type { IWorkflowDefinitionSource } from '../../domain/repositories/workflow-definition-source.interface';
import { WORKFLOW_DEFINITION_SOURCE } from '../../domain/vo/engine-workflow-def.vo';

export interface WorkflowTypeInfo {
  type: string;
  name: string;
  description: string;
  isVisible: boolean;
}

export interface FieldAttribute {
  fieldName: string;
  fieldLabel: string;
  fieldType: 'TEXT' | 'NUMBER' | 'DATE' | 'SELECT';
  isRequired: boolean;
  options?: string[];
}

@Injectable()
export class StaticDataService {
  constructor(
    @Inject(WORKFLOW_DEFINITION_SOURCE)
    private readonly definitionSource: IWorkflowDefinitionSource,
  ) {}

  async getWorkflowTypes(): Promise<WorkflowTypeInfo[]> {
    const types = await this.definitionSource.listTypes();
    const workflowTypes: WorkflowTypeInfo[] = [];
    
    for (const type of types) {
      const definition = await this.definitionSource.findByType(type);
      if (definition) {
        workflowTypes.push({
          type,
          name: definition.name,
          description: definition.description,
          isVisible: true,
        });
      }
    }
    
    return workflowTypes;
  }

  async getAdditionalFields(workflowType: string): Promise<FieldAttribute[]> {
    const definition = await this.definitionSource.findByType(workflowType);
    if (!definition) return [];
    
    const requiredFields = definition.requiredFields ?? [];
    const optionalFields = definition.optionalFields ?? [];
    
    return [
      ...requiredFields.map(field => ({
        fieldName: field,
        fieldLabel: this.formatFieldLabel(field),
        fieldType: 'TEXT' as const,
        isRequired: true,
      })),
      ...optionalFields.map(field => ({
        fieldName: field,
        fieldLabel: this.formatFieldLabel(field),
        fieldType: 'TEXT' as const,
        isRequired: false,
      })),
    ];
  }

  private formatFieldLabel(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }
}
```

#### Create DTOs

**File:** `src/modules/workflow-engine/application/dto/static-data.dto.ts` (NEW)

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkflowTypeDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  isVisible: boolean;
}

export class FieldAttributeDto {
  @ApiProperty()
  fieldName: string;

  @ApiProperty()
  fieldLabel: string;

  @ApiProperty()
  fieldType: string;

  @ApiProperty()
  isRequired: boolean;

  @ApiPropertyOptional()
  options?: string[];
}

export class WorkflowReferenceDataDto {
  @ApiProperty({ type: [WorkflowTypeDto] })
  workflowTypes: WorkflowTypeDto[];

  @ApiProperty({ type: [WorkflowTypeDto] })
  visibleWorkflowTypes: WorkflowTypeDto[];
}
```

#### Update Controller

**File:** `src/modules/workflow-engine/presentation/controllers/workflow-engine.controller.ts`

**Add to constructor:**
```typescript
constructor(
  // ... existing use cases ...
  private readonly staticDataService: StaticDataService,  // ADD
) {}
```

**Add endpoints:**
```typescript
@Get('static/referenceData')
@ApiOperation({ summary: 'Get workflow reference data' })
async getWorkflowReferenceData(): Promise<SuccessResponse<WorkflowReferenceDataDto>> {
  const workflowTypes = await this.staticDataService.getWorkflowTypes();
  const visibleWorkflowTypes = workflowTypes.filter(wf => wf.isVisible);
  
  return new SuccessResponse<WorkflowReferenceDataDto>({
    workflowTypes,
    visibleWorkflowTypes,
  });
}

@Get('static/additionalFields')
@ApiOperation({ summary: 'Get additional fields for workflow type' })
@ApiQuery({ name: 'workflowType', required: true, type: String })
async getAdditionalFields(
  @Query('workflowType') workflowType: string,
): Promise<SuccessResponse<FieldAttributeDto[]>> {
  const fields = await this.staticDataService.getAdditionalFields(workflowType);
  return new SuccessResponse<FieldAttributeDto[]>(fields);
}
```

#### Update Module

**File:** `src/modules/workflow-engine/workflow-engine.module.ts`

```typescript
providers: [
  // ... existing providers ...
  StaticDataService,  // ADD
],
```

---

### 3. Add Task Query Endpoint (2 hours)

#### Create Use Case

**File:** `src/modules/workflow-engine/application/use-cases/list-my-tasks.use-case.ts` (NEW)

```typescript
import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';

export interface ListMyTasksInput {
  assigneeId: string;
  includeCompleted?: boolean;
  workflowType?: string;
}

@Injectable()
export class ListMyTasksUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: ListMyTasksInput): Promise<EngineWorkflowTask[]> {
    const instances = await this.instanceRepository.findPaged({
      pageIndex: 0,
      pageSize: 100,
      props: { type: input.workflowType },
    });

    const tasks: EngineWorkflowTask[] = [];

    for (const instance of instances.content) {
      for (const step of instance.steps) {
        for (const task of step.tasks) {
          const hasAssignment = task.assignments.some(
            a => a.assigneeId === input.assigneeId && 
                 (a.status === 'PENDING' || a.status === 'ACCEPTED')
          );

          if (hasAssignment) {
            if (input.includeCompleted || 
                task.status === 'PENDING' || 
                task.status === 'IN_PROGRESS') {
              tasks.push(task);
            }
          }
        }
      }
    }

    return tasks;
  }
}
```

#### Update Controller

**File:** `src/modules/workflow-engine/presentation/controllers/workflow-engine.controller.ts`

**Add to constructor:**
```typescript
private readonly listMyTasksUseCase: ListMyTasksUseCase,  // ADD
```

**Add endpoint:**
```typescript
@Get('tasks/forMe')
@ApiOperation({ summary: 'List my tasks' })
@ApiQuery({ name: 'completed', required: false, enum: ['Y', 'N'] })
async listMyTasks(
  @Query('completed') completed?: string,
  @CurrentUser() user?: AuthUser,
): Promise<SuccessResponse<EngineWorkflowTaskDto[]>> {
  const tasks = await this.listMyTasksUseCase.execute({
    assigneeId: user?.profile_id!,
    includeCompleted: completed === 'Y',
  });
  
  const dtos = tasks.map(t => WorkflowEngineDtoMapper.toTaskDto(t));
  return new SuccessResponse(dtos);
}
```

#### Update Module

```typescript
providers: [
  // ... existing providers ...
  ListMyTasksUseCase,  // ADD
],
```

---

### 4. Add Alias Endpoints (1 hour)

**File:** `src/modules/workflow-engine/presentation/controllers/workflow-engine.controller.ts`

```typescript
@Get('instances/forMe')
@ApiOperation({ summary: 'Workflows where I am recipient' })
async listInstancesForMe(
  @Query('page') page?: number,
  @Query('size') size?: number,
  @CurrentUser() user?: AuthUser,
): Promise<SuccessResponse<PagedResult<EngineWorkflowInstanceDto>>> {
  return this.listInstances(page, size, undefined, undefined, undefined, user?.profile_id);
}

@Get('instances/byMe')
@ApiOperation({ summary: 'Workflows I initiated' })
async listInstancesByMe(
  @Query('page') page?: number,
  @Query('size') size?: number,
  @CurrentUser() user?: AuthUser,
): Promise<SuccessResponse<PagedResult<EngineWorkflowInstanceDto>>> {
  return this.listInstances(page, size, undefined, undefined, user?.profile_id, undefined);
}
```

---

## ✅ TESTING CHECKLIST

### External User Flow
- [ ] POST `/workflow-engine/start` with `isExternalUser=true`
- [ ] Verify email sent to `externalUserEmail`
- [ ] Verify workflow visible in list

### Static Data
- [ ] GET `/workflow-engine/static/referenceData`
- [ ] Verify types returned
- [ ] GET `/workflow-engine/static/additionalFields?workflowType=X`
- [ ] Verify fields returned

### Task Queries
- [ ] GET `/workflow-engine/tasks/forMe?completed=N`
- [ ] Verify only user's tasks returned

### Convenience
- [ ] GET `/workflow-engine/instances/forMe`
- [ ] GET `/workflow-engine/instances/byMe`

---

## 📦 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] Migrations run (`npx prisma migrate deploy`)
- [ ] Prisma generated (`npx prisma generate`)
- [ ] TypeScript compiles (`npm run build`)
- [ ] Tests passing

### Deployment
- [ ] Deploy with both modules enabled (parallel)
- [ ] Monitor logs for 24 hours
- [ ] Verify emails working

### Migration Strategy

**Phase 1: Parallel (Weeks 1-2)**
- Both modules enabled
- New workflows → new engine
- Existing → legacy

**Phase 2: Migration (Weeks 3-4)**
- Migrate definitions
- Update frontend

**Phase 3: Deprecation (Week 5+)**
- Remove legacy module

---

## ⏱️ ESTIMATED TIMELINE

| Task | Time |
|------|------|
| External User Support | 3-4 hours |
| Static Data Endpoints | 2-3 hours |
| Task Query Endpoints | 2 hours |
| Convenience Endpoints | 1 hour |
| Testing | 2-3 hours |
| **TOTAL** | **10-13 hours** |

---

## ✅ COMPLETION SIGN-OFF

- [ ] All code changes complete
- [ ] All tests passing
- [ ] Senior review approved
- [ ] Ready for production

**Completed By:** ___________________________  
**Date:** ___________________________

---

**Document Version:** 1.0  
**Last Updated:** 2026-01-29
