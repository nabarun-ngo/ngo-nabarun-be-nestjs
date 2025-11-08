import { WorkflowTaskType } from "../model/workflow-task.model";

// Base DTOs for reusability
export interface AssignedToDTO {
  userId: string;
  roleGroup?: string;
  roleNames: string[];
}

export interface TaskDetailDTO {
  assignedTo: AssignedToDTO;
  isAutoCloseable: boolean;
  checklist: string[];
}


export interface TaskDTO {
  taskId: string;
  name: string;
  description: string;
  type: WorkflowTaskType;
  handler?: string; // only for AUTOMATIC tasks
  taskDetail?: TaskDetailDTO; // only for VERIFICATION/APPROVAL tasks
}

export interface StepTransitionsDTO {
  onSuccess: string | null;
  onFailure: string | null;
}

export interface StepDTO {
  orderIndex: number;
  stepId: string;
  name: string;
  description: string;
  tasks: TaskDTO[];
  transitions: StepTransitionsDTO;
}

export interface PreCreationTaskDTO {
  taskId: string;
  type: "AUTOMATIC";
  handler: string;
  description: string;
}

// Root Workflow DTO
export interface WorkflowDefinition {
  name: string;
  description: string;
  fields: string[];
  preCreationTasks: PreCreationTaskDTO[];
  steps: StepDTO[];
}