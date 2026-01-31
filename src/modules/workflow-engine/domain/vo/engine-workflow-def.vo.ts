export type EngineWorkflowTaskType = 'MANUAL' | 'AUTOMATIC';

export interface AssignedToDef {
  userId: string;
  roleGroup?: string;
  roleNames: string[];
}

export interface TaskDetailDef {
  assignedTo?: AssignedToDef;
  isAutoCloseable?: boolean;
  checklist?: string[];
  data?: Record<string, unknown>;
}

export interface TaskDef {
  taskId: string;
  name: string;
  description: string;
  type: EngineWorkflowTaskType;
  handler?: string;
  taskDetail?: TaskDetailDef;
  requireAcceptance?: boolean;
  etaHours?: number;
  dueInDays?: number;
  inputMapping?: Record<string, string>;
  outputKey?: string;
}

export interface ConditionDef {
  expression: string;
  nextStepId: string;
}

export interface StepTransitionsDef {
  onSuccess: string | null;
  onFailure: string | null;
  conditions?: ConditionDef[];
}

export interface JoinStepDef {
  stepId: string;
  joinType: 'ALL' | 'ANY';
  requiredStepIds: string[];
}

export interface StepDef {
  orderIndex: number;
  stepId: string;
  name: string;
  description: string;
  tasks: TaskDef[];
  transitions: StepTransitionsDef;
  parallelGroup?: string;
  joinStep?: JoinStepDef;
}

export interface EngineWorkflowDefinition {
  name: string;
  description: string;
  version?: number;
  fields?: string[];
  requiredFields?: string[];
  optionalFields?: string[];
  preCreationTasks: TaskDef[];
  steps: StepDef[];
}

export const WORKFLOW_DEFINITION_SOURCE = Symbol('WORKFLOW_DEFINITION_SOURCE');
