import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsObject,
  IsArray,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkflowDefinitionDto {
  @ApiProperty({ description: 'Workflow type (e.g., JOIN_REQUEST)' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Workflow name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Workflow description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Required fields for the workflow' })
  @IsArray()
  @IsString({ each: true })
  fields: string[];

  @ApiProperty({ description: 'Full workflow definition JSON' })
  @IsObject()
  @IsNotEmpty()
  definition: Record<string, any>;

  @ApiProperty({ description: 'Version number', default: 1, required: false })
  @IsOptional()
  @IsInt()
  @Min(1)
  version?: number;

  @ApiProperty({ description: 'Whether the workflow is active', default: true, required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ description: 'User ID who created the workflow', required: false })
  @IsOptional()
  @IsString()
  createdBy?: string;
}

