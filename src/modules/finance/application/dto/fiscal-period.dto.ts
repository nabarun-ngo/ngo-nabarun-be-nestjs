import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { Transform } from 'class-transformer';
import { FiscalPeriodStatus } from '../../domain/model/fiscal-period.model';

/**
 * Fiscal period response DTO
 */
export class FiscalPeriodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, format: 'date' })
  startDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  endDate: Date;

  @ApiProperty({ enum: FiscalPeriodStatus })
  status: FiscalPeriodStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  closedAt?: Date;

  @ApiPropertyOptional()
  closedById?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}

/**
 * Filter for listing fiscal periods
 */
export class FiscalPeriodFilterDto {
  @ApiPropertyOptional({ enum: FiscalPeriodStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  status?: FiscalPeriodStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pageIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: number;
}

/**
 * Close fiscal period request
 */
export class CloseFiscalPeriodDto {
  @ApiPropertyOptional({ description: 'User ID who is closing the period' })
  @IsOptional()
  @IsString()
  closedById?: string;
}
