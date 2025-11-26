import { IsString, IsOptional, IsDate, IsArray, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MilestoneStatus, MilestoneImportance } from '../../domain/model/milestone.model';

export class CreateMilestoneDto {
  @IsString()
  @ApiProperty()
  projectId: string;

  @IsString()
  @ApiProperty()
  name: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ type: String, format: 'date-time' })
  targetDate: Date;

  @IsEnum(MilestoneImportance)
  @ApiProperty({ enum: MilestoneImportance })
  importance: MilestoneImportance;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  dependencies?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class UpdateMilestoneDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  targetDate?: Date;

  @IsOptional()
  @IsEnum(MilestoneImportance)
  @ApiPropertyOptional({ enum: MilestoneImportance })
  importance?: MilestoneImportance;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  dependencies?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class CompleteMilestoneDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  actualDate?: Date;
}

export class MilestoneDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  name: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  targetDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  actualDate?: Date;

  @ApiProperty({ enum: MilestoneStatus })
  status: MilestoneStatus;

  @ApiProperty({ enum: MilestoneImportance })
  importance: MilestoneImportance;

  @ApiProperty({ type: [String] })
  dependencies: string[];

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class MilestoneDetailFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  projectId?: string;

  @IsOptional()
  @IsEnum(MilestoneStatus)
  @ApiPropertyOptional({ enum: MilestoneStatus })
  status?: MilestoneStatus;

  @IsOptional()
  @IsEnum(MilestoneImportance)
  @ApiPropertyOptional({ enum: MilestoneImportance })
  importance?: MilestoneImportance;
}

