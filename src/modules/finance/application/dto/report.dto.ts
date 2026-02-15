import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsOptional } from 'class-validator';

export class ReportParamsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsEnum(['Y', 'N'])
  @IsOptional()
  uploadFile?: 'Y' | 'N';

  @ApiPropertyOptional({ enum: ['Y', 'N'] })
  @IsEnum(['Y', 'N'])
  @IsOptional()
  sendEmail?: 'Y' | 'N';
}

// ----- Ledger / Trial balance reporting (from LedgerEntry) -----

/**
 * One line in the trial balance: account + total debits and credits in the period
 */
export class TrialBalanceLineDto {
  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional({ description: 'Account name when available' })
  accountName?: string;

  @ApiPropertyOptional()
  currency?: string;

  @ApiProperty({ description: 'Sum of debit amounts in the period' })
  totalDebit: number;

  @ApiProperty({ description: 'Sum of credit amounts in the period' })
  totalCredit: number;

  @ApiProperty({ description: 'Net balance (totalCredit - totalDebit) for the period' })
  balance: number;
}

/**
 * Trial balance report response
 */
export class TrialBalanceReportDto {
  @ApiProperty({ type: String, format: 'date' })
  fromDate: Date;

  @ApiProperty({ type: String, format: 'date' })
  toDate: Date;

  @ApiProperty({ type: [TrialBalanceLineDto] })
  lines: TrialBalanceLineDto[];

  @ApiProperty({ description: 'Sum of all totalDebit (should equal sum of totalCredit)' })
  totalDebit: number;

  @ApiProperty({ description: 'Sum of all totalCredit' })
  totalCredit: number;
}

/**
 * Ledger line with optional running balance
 */
export class LedgerLineWithBalanceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  journalEntryId: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  lineNumber: number;

  @ApiProperty()
  debitAmount: number;

  @ApiProperty()
  creditAmount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  particulars?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Running balance after this line' })
  runningBalance?: number;
}

/**
 * Ledger by account report response
 */
export class LedgerByAccountReportDto {
  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional()
  accountName?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  fromDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date' })
  toDate?: Date;

  @ApiProperty({ description: 'Closing balance in the range' })
  closingBalance: number;

  @ApiProperty({ type: [LedgerLineWithBalanceDto] })
  lines: LedgerLineWithBalanceDto[];
}
