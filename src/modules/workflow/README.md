# Workflow Module

A comprehensive workflow management module for NestJS applications that supports complex multi-step workflows with manual and automatic tasks.

## Features

- **Workflow Definitions**: Define reusable workflow templates with steps and tasks
- **Workflow Instances**: Create and manage running workflow instances
- **Step Management**: Multi-step workflows with transitions
- **Task Types**: 
  - **VERIFICATION**: Manual tasks requiring verification
  - **APPROVAL**: Manual tasks requiring approval
  - **AUTOMATIC**: Tasks executed automatically via job processing
- **Task Assignments**: Assign tasks to users individually or by role
- **Job Processing Integration**: Automatic tasks executed asynchronously using BullMQ
- **Domain Events**: Event-driven architecture for workflow state changes

## Architecture

The module follows Domain-Driven Design (DDD) principles:

- **Domain Layer**: Models, events, and repository interfaces
- **Application Layer**: Use cases, services, and DTOs
- **Infrastructure Layer**: Repository implementations and mappers
- **Presentation Layer**: Controllers and API endpoints

## Database Schema

The module uses Prisma with the following entities:

- `WorkflowDefinition`: Workflow templates
- `WorkflowInstance`: Running workflow instances
- `WorkflowStep`: Steps within a workflow
- `WorkflowTask`: Tasks within a step
- `WorkflowTaskAssignment`: Task assignments to users

## Usage

### 1. Start a Workflow

```typescript
POST /workflows/start
{
  "type": "JOIN_REQUEST",
  "data": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    ...
  },
  "initiatedBy": "user-id-123"
}
```

### 2. Complete a Task

```typescript
POST /workflows/tasks/complete
{
  "instanceId": "instance-id",
  "taskId": "task-id",
  "resultData": {
    "approved": true,
    "notes": "All checks passed"
  },
  "completedBy": "user-id-123"
}
```

### 3. Get Workflow Instance

```typescript
GET /workflows/instances/:id
```

## Workflow Definition Structure

A workflow definition follows this structure (matching `workflow.json`):

```json
{
  "type": "JOIN_REQUEST",
  "name": "User Onboarding Workflow",
  "description": "Workflow description",
  "fields": ["firstName", "lastName", "email"],
  "preCreationTasks": [
    {
      "taskId": "check-duplicate-user",
      "type": "AUTOMATIC",
      "handler": "UserNotRegisteredTaskHandler",
      "description": "Check for duplicate users"
    }
  ],
  "steps": [
    {
      "stepId": "verification",
      "name": "Verification Step",
      "description": "Verify details",
      "tasks": [
        {
          "taskId": "verify-info",
          "name": "Verify Information",
          "type": "MANUAL",
          "taskDetail": {
            "assignedTo": {
              "roleNames": ["GROUP_COORDINATOR"]
            },
            "isAutoCloseable": false,
            "checklist": ["Check email", "Check name"]
          }
        }
      ],
      "transitions": {
        "onSuccess": "next-step-id",
        "onFailure": null
      }
    }
  ]
}
```

## Task Handlers

Automatic tasks use handlers registered in `WorkflowHandlerRegistry`. To add a new handler:

```typescript
// In your handler service
constructor(
  private readonly handlerRegistry: WorkflowHandlerRegistry,
) {
  this.handlerRegistry.registerHandler('MyHandler', {
    handle: async (requestData: Record<string, any>) => {
      // Your handler logic
      return { success: true, data: ... };
    },
  });
}
```

## Pre-Creation Tasks

Tasks defined in `preCreationTasks` are executed before creating the workflow instance. These are useful for validation or pre-processing.

## Manual Tasks

Manual tasks (VERIFICATION, APPROVAL) require user interaction:

1. Tasks are assigned to users based on:
   - Role names: All users with specified roles
   - Individual user IDs: Specific users
2. Users receive assignments that can be:
   - Accepted
   - Rejected
   - Completed

## Automatic Tasks

Automatic tasks are executed via the job processing module:

1. Task handler is registered in `WorkflowHandlerRegistry`
2. A job is created and queued
3. Job processor executes the handler
4. Task is marked as completed/failed based on result

## Domain Events

The module emits the following domain events:

- `WorkflowStartedEvent`: When a workflow instance starts
- `WorkflowCompletedEvent`: When a workflow completes
- `WorkflowFailedEvent`: When a workflow fails
- `StepCompletedEvent`: When a step completes
- `TaskCompletedEvent`: When a task completes
- `TaskAssignmentCreatedEvent`: When a task is assigned

Listen to events using NestJS EventEmitter:

```typescript
@OnEvent('WorkflowCompletedEvent')
async handleWorkflowCompleted(event: WorkflowCompletedEvent) {
  // Handle workflow completion
}
```

## Migration

After adding the workflow models to Prisma schema, run:

```bash
npx prisma migrate dev --name add_workflow_module
```

## Example: User Onboarding Workflow

Based on `workflow.json`, this workflow:

1. **Pre-Creation**: Checks for duplicate users
2. **Step 1 - Verification**: Verifies user details and policy acceptance
3. **Step 2 - Approval**: Gets approval from leadership
4. **Step 3 - Account Creation**: Automatically creates Auth0 user

## Extending the Module

### Adding New Task Handlers

1. Create a handler class implementing `WorkflowTaskHandler`
2. Register it in `WorkflowHandlerRegistry`
3. Reference the handler name in workflow definitions

### Custom Assignment Logic

Modify `WorkflowService.createTaskAssignments()` to implement custom assignment logic, such as:
- Finding users by roles from user repository
- Load balancing assignments
- Priority-based assignments

## Notes

- Workflow definitions should be loaded from database or configuration
- Task assignments by role require integration with user repository to find users
- Automatic task handlers should be registered during module initialization
- Failed automatic tasks will mark the task and potentially the workflow as failed

