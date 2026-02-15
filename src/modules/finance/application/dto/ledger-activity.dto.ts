import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsDate, IsEnum, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * One ledger line for an account (account activity is served from ledger, not Transaction).
 */
export class LedgerActivityDto {
  @ApiProperty()
  journalEntryId: string;

  @ApiProperty()
  ledgerEntryId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  debitAmount: number;

  @ApiProperty()
  creditAmount: number;

  @ApiProperty({ description: 'Credit minus debit for this line' })
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  particulars?: string;

  @ApiPropertyOptional({ description: 'DEBIT or CREDIT' })
  type?: 'DEBIT' | 'CREDIT';
}

/**
 * Filter for listing ledger activity by account.
 */
export class LedgerActivityFilterDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  fromDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  toDate?: Date;
}

/**
 * Response for transfer / add fund / reverse (journal entry created).
 */
export class JournalEntryResponseDto {
  @ApiProperty()
  journalEntryId: string;

  @ApiPropertyOptional()
  message?: string;
}

export class ReverseJournalEntryDto {
  @ApiProperty({ description: 'ID of the journal entry to reverse' })
  @IsString()
  journalEntryId: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

/** Entity type for backfilling journal/ledger for existing donation or expense */
export enum BackfillEntityTypeEnum {
  DONATION = 'DONATION',
  EXPENSE = 'EXPENSE',
}

/**
 * Request to add a journal entry and ledger lines for an existing donation (PAID) or expense (SETTLED).
 * Use when the entity was created before journal/ledger was in place or link was missing.
 */
export class BackfillLedgerRequestDto {
  @ApiProperty({ enum: BackfillEntityTypeEnum, description: 'Donation or expense' })
  @IsEnum(BackfillEntityTypeEnum)
  entityType: BackfillEntityTypeEnum;

  @ApiProperty({ description: 'ID of the donation or expense' })
  @IsString()
  entityId: string;

  @ApiPropertyOptional({ description: 'User ID posting the entry (defaults to current user)' })
  @IsOptional()
  @IsString()
  postedById?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Entry date; default: donation paidOn / expense settledDate' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  entryDate?: Date;

  @ApiPropertyOptional({ description: 'If true, allow backfill even when entity already has a linked journal entry' })
  @IsOptional()
  @IsBoolean()
  allowOverwrite?: boolean;

  @ApiPropertyOptional({ description: 'Required for EXPENSE: account to debit (expense/cost account)' })
  @IsOptional()
  @IsString()
  expenseAccountId?: string;

  @ApiPropertyOptional({ description: 'Required for EXPENSE: account to credit (payment account). Omit to use expense.accountId.' })
  @IsOptional()
  @IsString()
  paymentAccountId?: string;
}

/** Response after backfilling ledger for a donation or expense */
export class BackfillLedgerResponseDto {
  @ApiProperty()
  journalEntryId: string;

  @ApiProperty({ enum: BackfillEntityTypeEnum })
  entityType: BackfillEntityTypeEnum;

  @ApiProperty()
  entityId: string;

  @ApiProperty({ description: 'Whether the entity was updated with the new journal entry id' })
  linked: boolean;
}
