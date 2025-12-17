import { IsString, IsOptional, IsNumber, IsDate, IsArray, IsEnum, Min, IsBoolean, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectCategory, ProjectStatus, ProjectPhase } from '../../domain/model/project.model';

export class CreateProjectDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @ApiProperty()
  description: string;

  @IsString()
  @ApiProperty()
  code: string;

  @IsEnum(ProjectCategory)
  @ApiProperty({ enum: ProjectCategory })
  category: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiPropertyOptional({ enum: ProjectStatus, default: ProjectStatus.PLANNING })
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPhase)
  @ApiPropertyOptional({ enum: ProjectPhase, default: ProjectPhase.INITIATION })
  phase?: ProjectPhase;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @IsNumber()
  @Min(0.01)
  @ApiProperty({ minimum: 0.01 })
  budget: number;

  @IsString()
  @ApiProperty()
  currency: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0 })
  targetBeneficiaryCount?: number;

  @IsString()
  @ApiProperty()
  managerId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sponsorId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String], default: [] })
  tags?: string[];

  @IsOptional()
  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  name?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectCategory)
  @ApiPropertyOptional({ enum: ProjectCategory })
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiPropertyOptional({ enum: ProjectStatus })
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectPhase)
  @ApiPropertyOptional({ enum: ProjectPhase })
  phase?: ProjectPhase;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ minimum: 0.01 })
  budget?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  location?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @ApiPropertyOptional({ minimum: 0 })
  targetBeneficiaryCount?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sponsorId?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  tags?: string[];

  @IsOptional()
  @ApiPropertyOptional()
  metadata?: Record<string, any>;
}

export class ProjectDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ enum: ProjectCategory })
  category: ProjectCategory;

  @ApiProperty({ enum: ProjectStatus })
  status: ProjectStatus;

  @ApiProperty({ enum: ProjectPhase })
  phase: ProjectPhase;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  actualEndDate?: Date;

  @ApiProperty()
  budget: number;

  @ApiProperty()
  spentAmount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  location?: string;

  @ApiPropertyOptional()
  targetBeneficiaryCount?: number;

  @ApiPropertyOptional()
  actualBeneficiaryCount?: number;

  @ApiProperty()
  managerId: string;

  @ApiPropertyOptional()
  sponsorId?: string;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  metadata?: Record<string, any>;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ProjectDetailFilterDto {
  @IsOptional()
  @IsEnum(ProjectStatus)
  @ApiPropertyOptional({ enum: ProjectStatus })
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(ProjectCategory)
  @ApiPropertyOptional({ enum: ProjectCategory })
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectPhase)
  @ApiPropertyOptional({ enum: ProjectPhase })
  phase?: ProjectPhase;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  managerId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  sponsorId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  location?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  tags?: string[];
}

