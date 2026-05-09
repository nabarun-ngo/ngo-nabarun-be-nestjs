# Workflow Template Guidelines

This document outlines the standard rules and schema for creating new workflow JSON templates in this directory (`src/modules/workflow/infrastructure/templates`).

## 1. File Naming
- Files should be named in `UPPER_SNAKE_CASE` with a `.json` extension (e.g., `SOCIAL_MEDIA_CAMPAIGN.json`, `JOIN_REQUEST.json`).

## 2. Root Structure
Every template must follow the `WorkflowDefinition` structure:
```json
{
  "name": "Human Readable Workflow Name",
  "description": "Short description of the workflow.",
  "fields": [],
  "preCreationTasks": [],
  "steps": []
}
```

## 3. Fields (`FieldDef`)
Fields define the data points collected during the workflow or within specific tasks.
- **`key`**: Unique camelCase identifier for the field.
- **`defKey`**: UI component type (e.g., `INPUT_TEXT_FIELD`, `INPUT_DATE_FIELD`, `INPUT_EMAIL_FIELD`, `SELECT_YES_NO_FIELD`, `SELECT_APPROVE_DECLINE_FIELD`).
- **`label`**: Human-readable question or label.
- **`mandatory`**: Boolean (`true` or `false`).

## 4. Pre-Creation Tasks
These are executed synchronously before the workflow is fully instantiated. They are typically `AUTOMATIC` tasks used for validation.
```json
{
  "taskId": "validateinputs",
  "type": "AUTOMATIC",
  "handler": "ValidateInputs",
  "description": ""
}
```

## 5. Steps (`StepDef`)
A workflow is composed of multiple steps.
- **`isDefault`**: Must be `true` for the **first** step, and `false` for all subsequent steps.
- **`stepId`**: Unique lowercase identifier (e.g., `"postercreation"`).
- **`name`**: Human-readable step name.
- **`description`**: What this step achieves.
- **`tasks`**: Array of tasks to be executed in this step.
- **`transitions`**: Array defining the conditional flow to the next steps.

## 6. Tasks (`TaskDef`)
Tasks within a step are typically `MANUAL`.
- **`taskId`**: Unique lowercase identifier.
- **`name`**: Name of the task (can use templating like `{{eventName}}`).
- **`description`**: Detailed instructions.
- **`type`**: `MANUAL` (requires human action) or `AUTOMATIC` (handled by system code).
- **`etaHours`**: Time expected to complete the task (e.g., `24`).
- **`taskDetail`**: Required for `MANUAL` tasks:
  - **`assignedTo`**: Defines who can action the task. Must include valid system roles.
    ```json
    "assignedTo": {
      "roleGroups": [],
      "roleNames": ["COMMUNITY_MANAGER"]
    }
    ```
  - **`isAutoCloseable`**: Boolean (usually `false`).
  - **`autoCloseCondition`**: String or `null`.
  - **`checklist`**: Array of strings (instructions/sub-tasks).
  - **`fields`**: Array of `FieldDef` (data to be collected when closing the task).

## 7. Transitions
Transitions define the logic to move between steps using expression evaluation.
- **`condition`**: The expression to evaluate. Format: `step_{stepId}_task_{taskId}.{fieldKey} == 'Value'`
- **`nextStepId`**: The `stepId` of the next step. If this is the end of the workflow, use `null`.
- **Default Transition**: Every step must end its transition array with a `"default"` fallback:
  ```json
  {
    "condition": "default",
    "nextStepId": "currentStepId" // usually loops back to itself if conditions aren't met, or null
  }
  ```

## 8. Available Roles
When assigning tasks (`assignedTo.roleNames`), use only the roles defined in the system (`role.model.ts`):
- `PRESIDENT`
- `VICE_PRESIDENT`
- `SECRETARY`
- `ASSISTANT_SECRETARY`
- `TREASURER`
- `CASHIER`
- `ASSISTANT_CASHIER`
- `GROUP_COORDINATOR`
- `ASST_GROUP_COORDINATOR`
- `TECHNICAL_SPECIALIST`
- `COMMUNITY_MANAGER`
- `ASST_COMMUNITY_MANAGER`
- `MEMBER`
