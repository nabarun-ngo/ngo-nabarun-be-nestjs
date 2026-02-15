import { LedgerEntryResponseDto } from '../ledger-entry.dto';
import { LedgerEntry } from '../../../domain/model/ledger-entry.model';

export class LedgerEntryDtoMapper {
  static toResponseDto(line: LedgerEntry): LedgerEntryResponseDto {
    return {
      id: line.id,
      journalEntryId: line.journalEntryId,
      accountId: line.accountId,
      lineNumber: line.lineNumber,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      currency: line.currency,
      particulars: line.particulars,
      balanceAfter: line.balanceAfter,
      createdAt: line.createdAt,
    };
  }
}
