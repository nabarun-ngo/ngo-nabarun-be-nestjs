import { IsString, IsOptional, IsNumber, IsDate, IsArray, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GoalPriority, GoalStatus } from '../../domain/model/goal.model';

export class CreateGoalDto {
  @IsString()
  @ApiProperty()
  projectId: string;

  @IsString()
  @ApiProperty()
  title: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ minimum: 0.01 })
  targetValue?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  targetUnit?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  deadline?: Date;

  @IsEnum(GoalPriority)
  @ApiProperty({ enum: GoalPriority })
  priority: GoalPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  weight?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  dependencies?: string[];
}

export class UpdateGoalDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ minimum: 0.01 })
  targetValue?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  targetUnit?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  deadline?: Date;

  @IsOptional()
  @IsEnum(GoalPriority)
  @ApiPropertyOptional({ enum: GoalPriority })
  priority?: GoalPriority;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0, maximum: 1 })
  weight?: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  dependencies?: string[];
}

export class UpdateGoalProgressDto {
  @IsNumber()
  @Min(0)
  @ApiProperty({ minimum: 0 })
  currentValue: number;
}

export class GoalDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  targetValue?: number;

  @ApiPropertyOptional()
  targetUnit?: string;

  @ApiProperty()
  currentValue: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  deadline?: Date;

  @ApiProperty({ enum: GoalPriority })
  priority: GoalPriority;

  @ApiProperty({ enum: GoalStatus })
  status: GoalStatus;

  @ApiPropertyOptional()
  weight?: number;

  @ApiProperty({ type: [String] })
  dependencies: string[];

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class GoalDetailFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  projectId?: string;

  @IsOptional()
  @IsEnum(GoalStatus)
  @ApiPropertyOptional({ enum: GoalStatus })
  status?: GoalStatus;

  @IsOptional()
  @IsEnum(GoalPriority)
  @ApiPropertyOptional({ enum: GoalPriority })
  priority?: GoalPriority;
}

