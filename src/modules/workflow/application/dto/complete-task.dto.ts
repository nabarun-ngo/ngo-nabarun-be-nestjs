import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowTaskStatus } from '../../domain/model/workflow-task.model';

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

