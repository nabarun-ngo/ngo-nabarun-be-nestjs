import { WorkflowStepStatus } from '../../domain/model/workflow-step.model';

export class StepHistoryEntryDto {
  stepId: string;
  name: string;
  status: WorkflowStepStatus;
  orderIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class WorkflowStepHistoryDto {
  instanceId: string;
  currentStepId: string | null;
  steps: StepHistoryEntryDto[];
}

