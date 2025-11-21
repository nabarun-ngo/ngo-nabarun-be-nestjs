import { WorkflowTaskType } from "../model/workflow-task.model";

// Base DTOs for reusability
export interface AssignedToDef {
  userId: string;
  roleGroup?: string;
  roleNames: string[];
}

export interface TaskDetailDef {
  assignedTo?: AssignedToDef;
  isAutoCloseable?: boolean;
  checklist?: string[];
  data?: Record<string, any>;
}


export interface TaskDef {
  taskId: string;
  name: string;
  description: string;
  type: WorkflowTaskType;
  handler?: string; // only for AUTOMATIC tasks
  taskDetail?: TaskDetailDef; // only for VERIFICATION/APPROVAL tasks
}

export interface StepTransitionsDef {
  onSuccess: string | null;
  onFailure: string | null;
}

export interface StepDef {
  orderIndex: number;
  stepId: string;
  name: string;
  description: string;
  tasks: TaskDef[];
  transitions: StepTransitionsDef;
}

// Root Workflow DTO
export interface WorkflowDefinition {
  name: string;
  description: string;
  fields: string[];
  preCreationTasks: TaskDef[];
  steps: StepDef[];
}