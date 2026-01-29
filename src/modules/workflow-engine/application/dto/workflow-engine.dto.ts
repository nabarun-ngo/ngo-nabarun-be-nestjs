import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsObject, IsOptional, IsNumber, IsArray } from 'class-validator';

export class EngineStartWorkflowDto {
  @ApiProperty({ description: 'Workflow type (e.g. USER_ONBOARDING)' })
  @IsString()
  type: string;

  @ApiProperty({ description: 'Request data (initial payload)' })
  @IsObject()
  data: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'User ID who started the workflow' })
  @IsOptional()
  @IsString()
  requestedBy?: string;

  @ApiPropertyOptional({ description: 'User ID for whom the workflow is initiated (internal user)' })
  @IsOptional()
  @IsString()
  requestedFor?: string;

  @ApiPropertyOptional({ description: 'External user email (if requestedFor is external)' })
  @IsOptional()
  @IsString()
  requestedForEmail?: string;

  @ApiPropertyOptional({ description: 'External user name (if requestedFor is external)' })
  @IsOptional()
  @IsString()
  requestedForName?: string;

  @ApiPropertyOptional({ description: 'Definition version (optional)' })
  @IsOptional()
  @IsNumber()
  definitionVersion?: number;
}

export class CompleteTaskDto {
  @ApiProperty({ description: 'User ID who completed the task' })
  @IsString()
  completedBy: string;

  @ApiPropertyOptional({ description: 'Result data to merge into context' })
  @IsOptional()
  @IsObject()
  resultData?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class RejectAssignmentDto {
  @ApiPropertyOptional({ description: 'Rejection reason' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;
}

export class ReassignTaskDto {
  @ApiProperty({ description: 'New assignee user ID' })
  @IsString()
  newAssigneeId: string;

  @ApiPropertyOptional({ description: 'Remarks' })
  @IsOptional()
  @IsString()
  remarks?: string;
}

export class CancelInstanceDto {
  @ApiPropertyOptional({ description: 'Cancellation reason' })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class EngineTaskAssignmentDto {
  @ApiProperty() id: string;
  @ApiProperty() taskId: string;
  @ApiPropertyOptional() assigneeId?: string | null;
  @ApiPropertyOptional() assigneeEmail?: string | null;
  @ApiPropertyOptional() assigneeName?: string | null;
  @ApiProperty() assigneeType: string;
  @ApiPropertyOptional() roleName?: string | null;
  @ApiProperty() status: string;
  @ApiPropertyOptional() assignedById?: string | null;
  @ApiPropertyOptional() acceptedAt?: Date | null;
  @ApiPropertyOptional() rejectedAt?: Date | null;
  @ApiPropertyOptional() rejectionReason?: string | null;
  @ApiPropertyOptional() dueAt?: Date | null;
}

export class EngineWorkflowTaskDto {
  @ApiProperty() id: string;
  @ApiProperty() stepId: string;
  @ApiProperty() instanceId: string;
  @ApiProperty() taskId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() type: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() handler?: string | null;
  @ApiPropertyOptional() resultData?: Record<string, unknown> | null;
  @ApiPropertyOptional() completedById?: string | null;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiPropertyOptional() remarks?: string | null;
  @ApiProperty({ type: [EngineTaskAssignmentDto] }) assignments: EngineTaskAssignmentDto[];
}

export class EngineWorkflowStepDto {
  @ApiProperty() id: string;
  @ApiProperty() instanceId: string;
  @ApiProperty() stepId: string;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string | null;
  @ApiProperty() status: string;
  @ApiProperty() orderIndex: number;
  @ApiPropertyOptional() startedAt?: Date | null;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiProperty({ type: [EngineWorkflowTaskDto] }) tasks: EngineWorkflowTaskDto[];
}

export class EngineWorkflowInstanceDto {
  @ApiProperty() id: string;
  @ApiProperty() type: string;
  @ApiPropertyOptional() definitionVersion?: number | null;
  @ApiProperty() name: string;
  @ApiPropertyOptional() description?: string;
  @ApiProperty() status: string;
  @ApiPropertyOptional() contextData?: Record<string, unknown>;
  @ApiProperty() activeStepIds: string[];
  @ApiPropertyOptional() initiatedById?: string | null;
  @ApiPropertyOptional() initiatedForId?: string | null;
  @ApiPropertyOptional() requestData?: Record<string, unknown>;
  @ApiPropertyOptional() completedAt?: Date | null;
  @ApiPropertyOptional() remarks?: string | null;
  @ApiProperty({ type: [EngineWorkflowStepDto] }) steps: EngineWorkflowStepDto[];
}
