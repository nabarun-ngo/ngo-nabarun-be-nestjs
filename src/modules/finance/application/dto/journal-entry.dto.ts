import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import {
  JournalEntryStatus,
  JournalEntryReferenceType,
} from '../../domain/model/journal-entry.model';
import { LedgerEntryResponseDto } from './ledger-entry.dto';

/**
 * Journal entry response DTO (read-only)
 */
export class JournalEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  fiscalPeriodId?: string;

  @ApiProperty({ type: String, format: 'date' })
  entryDate: Date;

  @ApiProperty()
  description: string;

  @ApiPropertyOptional({ enum: JournalEntryReferenceType })
  referenceType?: JournalEntryReferenceType;

  @ApiPropertyOptional()
  referenceId?: string;

  @ApiProperty({ enum: JournalEntryStatus })
  status: JournalEntryStatus;

  @ApiPropertyOptional()
  createdById?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  postedAt?: Date;

  @ApiPropertyOptional()
  postedById?: string;

  @ApiPropertyOptional()
  reversalOfId?: string;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ type: [LedgerEntryResponseDto], description: 'Ledger lines (when included)' })
  lines?: LedgerEntryResponseDto[];
}

/**
 * Query/filter for listing journal entries
 */
export class JournalEntryFilterDto {
  @ApiPropertyOptional({ enum: JournalEntryReferenceType })
  @IsOptional()
  @IsEnum(JournalEntryReferenceType)
  referenceType?: JournalEntryReferenceType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  referenceId?: string;

  @ApiPropertyOptional({ enum: JournalEntryStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : undefined))
  status?: JournalEntryStatus[];

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  entryDateFrom?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDateString()
  entryDateTo?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fiscalPeriodId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pageIndex?: number;

  @ApiPropertyOptional()
  @IsOptional()
  pageSize?: number;
}
