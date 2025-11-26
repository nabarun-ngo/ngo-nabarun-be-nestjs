import { IsString, IsOptional, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RiskCategory, RiskSeverity, RiskProbability, RiskStatus } from '../../domain/model/project-risk.model';

export class CreateProjectRiskDto {
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

  @IsEnum(RiskCategory)
  @ApiProperty({ enum: RiskCategory })
  category: RiskCategory;

  @IsEnum(RiskSeverity)
  @ApiProperty({ enum: RiskSeverity })
  severity: RiskSeverity;

  @IsEnum(RiskProbability)
  @ApiProperty({ enum: RiskProbability })
  probability: RiskProbability;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  impact?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  mitigationPlan?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  ownerId?: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ type: String, format: 'date-time' })
  identifiedDate: Date;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class UpdateProjectRiskDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  title?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;

  @IsOptional()
  @IsEnum(RiskCategory)
  @ApiPropertyOptional({ enum: RiskCategory })
  category?: RiskCategory;

  @IsOptional()
  @IsEnum(RiskSeverity)
  @ApiPropertyOptional({ enum: RiskSeverity })
  severity?: RiskSeverity;

  @IsOptional()
  @IsEnum(RiskProbability)
  @ApiPropertyOptional({ enum: RiskProbability })
  probability?: RiskProbability;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  impact?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  mitigationPlan?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  ownerId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  notes?: string;
}

export class UpdateRiskStatusDto {
  @IsEnum(RiskStatus)
  @ApiProperty({ enum: RiskStatus })
  status: RiskStatus;
}

export class ResolveRiskDto {
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  resolvedDate?: Date;
}

export class ProjectRiskDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  title: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty({ enum: RiskCategory })
  category: RiskCategory;

  @ApiProperty({ enum: RiskSeverity })
  severity: RiskSeverity;

  @ApiProperty({ enum: RiskProbability })
  probability: RiskProbability;

  @ApiProperty({ enum: RiskStatus })
  status: RiskStatus;

  @ApiPropertyOptional()
  impact?: string;

  @ApiPropertyOptional()
  mitigationPlan?: string;

  @ApiPropertyOptional()
  ownerId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  identifiedDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  resolvedDate?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ProjectRiskDetailFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  projectId?: string;

  @IsOptional()
  @IsEnum(RiskStatus)
  @ApiPropertyOptional({ enum: RiskStatus })
  status?: RiskStatus;

  @IsOptional()
  @IsEnum(RiskSeverity)
  @ApiPropertyOptional({ enum: RiskSeverity })
  severity?: RiskSeverity;

  @IsOptional()
  @IsEnum(RiskCategory)
  @ApiPropertyOptional({ enum: RiskCategory })
  category?: RiskCategory;
}

