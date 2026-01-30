# Workflow Engine Module

Generic workflow engine: definitions, instances, steps, and tasks (MANUAL | AUTOMATIC).

## Independence

**This module has no dependency on `src/modules/workflow`.** Do not import from the workflow module. The workflow-engine is a separate, self-contained module with its own domain models, value objects, and types (e.g. `EngineWorkflowTaskType`, `EngineWorkflowDefinition`).

## Structure

- **domain/** – Models, events, value objects (engine-workflow-def.vo, engine-workflow-task.model, etc.)
- Task types: `MANUAL` | `AUTOMATIC` (see `EngineWorkflowTaskType` in `domain/vo/engine-workflow-def.vo.ts`).
