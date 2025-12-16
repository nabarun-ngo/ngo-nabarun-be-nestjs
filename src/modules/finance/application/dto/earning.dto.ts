import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsDate, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EarningCategory, EarningStatus } from '../../domain/model/earning.model';

/**
 * Earning Detail DTO
 */
export class EarningDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: EarningCategory })
  category: EarningCategory;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: EarningStatus })
  status: EarningStatus;

  @ApiProperty()
  description: string;

  @ApiProperty()
  source: string;

  @ApiPropertyOptional()
  referenceId?: string;

  @ApiPropertyOptional()
  referenceType?: string;

  @ApiPropertyOptional()
  accountId?: string;

  @ApiPropertyOptional()
  transactionId?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  earningDate: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  receivedDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  createdAt?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  updatedAt?: Date;
}

/**
 * Earning Detail Filter DTO
 */
export class EarningDetailFilterDto {
  @ApiPropertyOptional({ enum: EarningStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  status?: EarningStatus[];

  @ApiPropertyOptional({ enum: EarningCategory, isArray: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  category?: EarningCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

/**
 * Create Earning DTO
 */
export class CreateEarningDto {
  @ApiProperty({ enum: EarningCategory })
  @IsEnum(EarningCategory)
  category: EarningCategory;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsString()
  source: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceType?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  earningDate?: Date;
}

/**
 * Update Earning DTO
 */
export class UpdateEarningDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  earningDate?: Date;
}

