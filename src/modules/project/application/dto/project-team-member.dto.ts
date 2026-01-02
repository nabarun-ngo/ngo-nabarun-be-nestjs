import { IsString, IsOptional, IsNumber, IsDate, IsEnum, Min, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProjectTeamMemberRole } from '../../domain/model/project-team-member.model';

export class AddTeamMemberDto {
  @IsString()
  @ApiProperty()
  projectId: string;

  @IsString()
  @ApiProperty()
  userId: string;

  @IsEnum(ProjectTeamMemberRole)
  @ApiProperty({ enum: ProjectTeamMemberRole })
  role: ProjectTeamMemberRole;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  responsibilities?: string;

  @IsDate()
  @Type(() => Date)
  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ minimum: 0.01 })
  hoursAllocated?: number;
}

export class UpdateTeamMemberDto {
  @IsOptional()
  @IsEnum(ProjectTeamMemberRole)
  @ApiPropertyOptional({ enum: ProjectTeamMemberRole })
  role?: ProjectTeamMemberRole;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  responsibilities?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @ApiPropertyOptional({ minimum: 0.01 })
  hoursAllocated?: number;
}

export class ProjectTeamMemberDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ enum: ProjectTeamMemberRole })
  role: ProjectTeamMemberRole;

  @ApiPropertyOptional()
  responsibilities?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  startDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  endDate?: Date;

  @ApiPropertyOptional()
  hoursAllocated?: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

export class ProjectTeamMemberDetailFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  projectId?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  userId?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  isActive?: boolean;

  @IsOptional()
  @IsEnum(ProjectTeamMemberRole)
  @ApiPropertyOptional({ enum: ProjectTeamMemberRole })
  role?: ProjectTeamMemberRole;
}

