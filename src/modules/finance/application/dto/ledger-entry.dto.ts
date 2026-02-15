import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ledger entry response DTO (read-only, immutable)
 */
export class LedgerEntryResponseDto {
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

  @ApiPropertyOptional({ description: 'Running balance after this line (if stored)' })
  balanceAfter?: number;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}

/**
 * Query for ledger by account
 */
export class LedgerByAccountQueryDto {
  @ApiPropertyOptional({ type: String, format: 'date' })
  fromDate?: string;

  @ApiPropertyOptional({ type: String, format: 'date' })
  toDate?: string;
}
