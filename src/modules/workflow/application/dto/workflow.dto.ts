import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsDefined,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  WorkflowInstanceStatus,
  WorkflowType,
} from '../../domain/model/workflow-instance.model';
import {
  WorkflowTaskType,
  WorkflowTaskStatus,
} from '../../domain/model/workflow-task.model';
import { WorkflowStepStatus } from '../../domain/model/workflow-step.model';
import { TaskAssignmentStatus as TaskAssignmentStatusEnum } from '../../domain/model/task-assignment.model';
import { KeyValueDto } from 'src/shared/dto/KeyValue.dto';

export class StartWorkflowDto {
  @ApiProperty({ description: 'Workflow type (e.g., JOIN_REQUEST)', required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  type: WorkflowType;

  @ApiProperty({ description: 'Request data for the workflow', required: true })
  @IsDefined()
  @IsObject()
  @IsNotEmpty()
  data: Record<string, any>;

  @ApiProperty({ description: 'User ID for whom the workflow is initiated', required: false })
  @IsOptional()
  @IsString()
  requestedFor?: string;

  @ApiProperty({ description: 'Is external user (use only when requestedFor id is not available)', required: false })
  @IsOptional()
  @IsBoolean()
  forExternalUser?: boolean;
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Task status', required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  status: WorkflowTaskStatus;

  @ApiProperty({ description: 'Remarks for task update', required: true })
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  remarks: string;

  @ApiProperty({ description: 'Result data from task completion', required: false })
  @IsOptional()
  @IsObject()
  resultData?: Record<string, string>;
}

export class TaskAssignmentDto {
  @ApiProperty({ required: true })
  @IsDefined()
  id: string;

  @ApiProperty({ required: true })
  @IsDefined()
  taskId: string;

  @ApiProperty({ required: true })
  @IsDefined()
  assignedToId: string;

  @ApiProperty({ required: true })
  @IsDefined()
  assignedToName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  roleName: string | null;

  @ApiProperty({ required: true })
  @IsDefined()
  status: TaskAssignmentStatusEnum;

  @ApiProperty({ required: false })
  @IsOptional()
  acceptedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  notes?: string;
}

export class WorkflowTaskDto {
  @ApiProperty({ required: true })
  @IsDefined()
  id: string;

  @ApiProperty({ required: true })
  @IsDefined()
  stepId: string;

  @ApiProperty({ required: true })
  @IsDefined()
  taskId: string;

  @ApiPropertyOptional({ required: false })
  @IsOptional()
  workflowId?: string;

  @ApiProperty({ required: true })
  @IsDefined()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string | null;

  @ApiProperty({ required: true })
  @IsDefined()
  type: WorkflowTaskType;

  @ApiProperty({ required: true })
  @IsDefined()
  status: WorkflowTaskStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  checklist?: string[];

  @ApiProperty({ required: true })
  @IsDefined()
  createdAt: Date;

  @ApiProperty({ required: true })
  @IsDefined()
  updatedAt: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  assignedToId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  assignedToName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  handler?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  jobId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  resultData?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  completedById?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  completedByName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  failureReason?: string;

  @ApiProperty({ type: [TaskAssignmentDto], required: true })
  @IsDefined()
  assignments: TaskAssignmentDto[];
}

export class WorkflowStepDto {
  @ApiProperty({ required: true })
  @IsDefined()
  id: string;

  @ApiProperty({ required: true })
  @IsDefined()
  stepId: string;

  @ApiProperty({ required: true })
  @IsDefined()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  description?: string | null;

  @ApiProperty({ required: true })
  @IsDefined()
  status: WorkflowStepStatus;

  @ApiProperty({ required: true })
  @IsDefined()
  orderIndex: number;

  @ApiProperty({ required: false })
  @IsOptional()
  startedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  failureReason?: string;

  @ApiProperty({ required: true })
  @IsDefined()
  createdAt: Date;

  @ApiProperty({ required: true })
  @IsDefined()
  updatedAt: Date;

  @ApiProperty({ type: [WorkflowTaskDto], required: true })
  @IsDefined()
  tasks: WorkflowTaskDto[];
}

export class WorkflowInstanceDto {
  @ApiProperty({ required: true })
  @IsDefined()
  id: string;

  @ApiProperty({ required: true })
  @IsDefined()
  type: string;

  description: string;

  @ApiProperty({ required: true })
  @IsDefined()
  status: WorkflowInstanceStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  currentStepId: string | null;

  @ApiProperty({ required: true })
  @IsDefined()
  requestData: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  resultData?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsOptional()
  initiatedById?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  initiatedByName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  initiatedForId?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  initiatedForName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  completedAt?: Date;

  @ApiProperty({ required: false })
  @IsOptional()
  failureReason?: string;

  @ApiProperty({ required: true })
  @IsDefined()
  createdAt: Date;

  @ApiProperty({ required: true })
  @IsDefined()
  updatedAt: Date;

  @ApiProperty({ type: [WorkflowStepDto], required: true })
  @IsDefined()
  steps: WorkflowStepDto[];
}


export class WorkflowRefDataDto {
  @ApiProperty()
  workflowTypes?: KeyValueDto[];
  @ApiProperty()
  additionalFields?: KeyValueDto[];
  @ApiProperty()
  visibleWorkflowTypes?: KeyValueDto[];
  @ApiProperty()
  workflowStatuses?: KeyValueDto[];
  @ApiProperty()
  workflowTaskStatuses?: KeyValueDto[];
}

export class FieldAttributeDto {
  @ApiProperty()
  key: string;
  @ApiProperty()
  value: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  isMandatory: boolean;
  @ApiProperty()
  fieldOptions: string[];
  @ApiProperty()
  fieldType: string;
  @ApiProperty()
  isHidden: boolean;
  @ApiProperty()
  isEncrypted: boolean;
}