import { JournalEntryResponseDto } from '../journal-entry.dto';
import { JournalEntry } from '../../../domain/model/journal-entry.model';
import { LedgerEntryResponseDto } from '../ledger-entry.dto';
import { LedgerEntry } from '../../../domain/model/ledger-entry.model';

export class JournalEntryDtoMapper {
  static toResponseDto(entry: JournalEntry, lines?: LedgerEntry[]): JournalEntryResponseDto {
    const dto: JournalEntryResponseDto = {
      id: entry.id,
      fiscalPeriodId: entry.fiscalPeriodId,
      entryDate: entry.entryDate,
      description: entry.description,
      referenceType: entry.referenceType,
      referenceId: entry.referenceId,
      status: entry.status,
      createdById: entry.createdById,
      postedAt: entry.postedAt,
      postedById: entry.postedById,
      reversalOfId: entry.reversalOfId,
      version: entry.version,
      createdAt: entry.createdAt,
      updatedAt: entry.updatedAt,
    };
    if (lines && lines.length > 0) {
      dto.lines = lines.map(JournalEntryDtoMapper.ledgerEntryToDto);
    }
    return dto;
  }

  static ledgerEntryToDto(line: LedgerEntry): LedgerEntryResponseDto {
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
