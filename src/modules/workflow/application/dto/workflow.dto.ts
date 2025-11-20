import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowInstanceStatus, WorkflowType } from '../../domain/model/workflow-instance.model';
import { WorkflowTaskType, WorkflowTaskStatus } from '../../domain/model/workflow-task.model';
import { WorkflowStepStatus } from '../../domain/model/workflow-step.model';
import { TaskAssignmentStatus as TaskAssignmentStatusEnum } from '../../domain/model/task-assignment.model';

export class StartWorkflowDto {
  @ApiProperty({ description: 'Workflow type (e.g., JOIN_REQUEST)' })
  @IsString()
  @IsNotEmpty()
  type: WorkflowType;

  @ApiProperty({ description: 'Request data for the workflow' })
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiProperty({ description: 'User ID for whom the workflow is initiated', required: false })
  @IsOptional()
  @IsString()
  requestedFor?: string;
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Workflow instance ID' })
  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @ApiProperty({ description: 'Task ID to complete' })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  status: WorkflowTaskStatus;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ description: 'Result data from task completion', required: false })
  @IsOptional()
  @IsObject()
  resultData?: Record<string, string>;

}


export class TaskAssignmentDto {
  id: string;
  taskId: string;
  assignedToId: string;
  assignedToName: string;
  roleName: string | null;
  status: TaskAssignmentStatusEnum;
  acceptedAt?: Date;
  completedAt?: Date;
  notes?: string;
}

export class WorkflowTaskDto {
  id: string;
  stepId: string;
  taskId: string;
  name: string;
  description?: string | null;
  type: WorkflowTaskType;
  status: WorkflowTaskStatus;
  checklist?: string[];
  createdAt: Date;
  updatedAt: Date;
  assignedToId?: string;
  assignedToName?: string;
  handler?: string;
  jobId?: string;
  resultData?: Record<string, any>;
  completedAt?: Date;
  completedBy?: string;
  failureReason?: string;
  assignments: TaskAssignmentDto[];
}

export class WorkflowStepDto {
  id: string;
  stepId: string;
  name: string;
  description?: string | null;
  status: WorkflowStepStatus;
  orderIndex: number;
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  tasks: WorkflowTaskDto[];
}

export class WorkflowInstanceDto {
  id: string;
  type: string;
  status: WorkflowInstanceStatus;
  currentStepId: string | null;
  requestData: Record<string, any>;
  resultData?: Record<string, any>;
  initiatedById?: string;
  initiatedByName?: string;
  initiatedForId?: string;
  initiatedForName?: string;
  completedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
  steps: WorkflowStepDto[];
}

