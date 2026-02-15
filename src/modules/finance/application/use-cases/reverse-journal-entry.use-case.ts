import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { JournalEntry } from '../../domain/model/journal-entry.model';
import { LedgerEntry } from '../../domain/model/ledger-entry.model';
import { JOURNAL_ENTRY_REPOSITORY } from '../../domain/repositories/journal-entry.repository.interface';
import type { IJournalEntryRepository } from '../../domain/repositories/journal-entry.repository.interface';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export interface ReverseJournalEntryRequest {
  journalEntryId: string;
  postedById: string;
  description?: string;
}

/**
 * Creates a reversal journal entry: same accounts, opposite debits/credits.
 * Links to original via reversalOfId.
 */
@Injectable()
export class ReverseJournalEntryUseCase
  implements IUseCase<ReverseJournalEntryRequest, JournalEntry> {
  constructor(
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepository: IJournalEntryRepository,
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
  ) { }

  async execute(request: ReverseJournalEntryRequest): Promise<JournalEntry> {
    const original = await this.journalEntryRepository.findById(request.journalEntryId);
    if (!original) {
      throw new BusinessException(`Journal entry not found: ${request.journalEntryId}`);
    }
    if (!original.isPosted()) {
      throw new BusinessException('Only posted journal entries can be reversed');
    }

    const lines = await this.ledgerEntryRepository.findByJournalEntryId(request.journalEntryId);
    if (lines.length === 0) {
      throw new BusinessException('Journal entry has no ledger lines to reverse');
    }

    const reversal = JournalEntry.create({
      entryDate: new Date(),
      description: request.description ?? `Reversal of ${request.journalEntryId}`,
      referenceType: original.referenceType,
      referenceId: original.referenceId,
      createdById: request.postedById,
      reversalOfId: request.journalEntryId,
    });

    lines.forEach((line, index) => {
      const reversedLine = LedgerEntry.create(
        {
          journalEntryId: reversal.id,
          accountId: line.accountId,
          lineNumber: index + 1,
          debitAmount: line.creditAmount,
          creditAmount: line.debitAmount,
          currency: line.currency,
          particulars: line.particulars ? `Reversal: ${line.particulars}` : 'Reversal',
        }
      );
      reversal.addLine(reversedLine);
    });

    reversal.post(request.postedById);
    return this.journalEntryRepository.create(reversal);
  }
}
