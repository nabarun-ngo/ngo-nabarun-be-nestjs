import {
  IsString,
  IsNotEmpty,
  IsObject,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { WorkflowInstanceDto } from './start-workflow.dto';

export class CompleteTaskDto {
  @ApiProperty({ description: 'Workflow instance ID' })
  @IsString()
  @IsNotEmpty()
  instanceId: string;

  @ApiProperty({ description: 'Task ID to complete' })
  @IsString()
  @IsNotEmpty()
  taskId: string;

  @ApiProperty({ description: 'Result data from task completion', required: false })
  @IsOptional()
  @IsObject()
  resultData?: Record<string, any>;

  @ApiProperty({ description: 'User ID who completed the task', required: false })
  @IsOptional()
  @IsString()
  completedBy?: string;
}

