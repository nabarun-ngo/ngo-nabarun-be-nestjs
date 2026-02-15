import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { JournalEntry, JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { LedgerEntry } from '../../domain/model/ledger-entry.model';
import { JOURNAL_ENTRY_REPOSITORY } from '../../domain/repositories/journal-entry.repository.interface';
import type { IJournalEntryRepository } from '../../domain/repositories/journal-entry.repository.interface';
import { FISCAL_PERIOD_REPOSITORY } from '../../domain/repositories/fiscal-period.repository.interface';
import type { IFiscalPeriodRepository } from '../../domain/repositories/fiscal-period.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export interface PostToLedgerLineDto {
  accountId: string;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  particulars?: string;
}

export interface PostToLedgerRequest {
  entryDate: Date;
  description: string;
  referenceType: JournalEntryReferenceType;
  referenceId?: string;
  createdById?: string;
  postedById: string;
  fiscalPeriodId?: string;
  lines: PostToLedgerLineDto[];
}

/**
 * Posts a journal entry and its ledger lines in one transaction.
 * Validates double-entry (sum debits = sum credits) and optional fiscal period is OPEN.
 * Once posted, the entry and lines are immutable.
 */
@Injectable()
export class PostToLedgerUseCase
  implements IUseCase<PostToLedgerRequest, JournalEntry> {
  constructor(
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepository: IJournalEntryRepository,
    @Inject(FISCAL_PERIOD_REPOSITORY)
    private readonly fiscalPeriodRepository: IFiscalPeriodRepository,
  ) { }

  async execute(request: PostToLedgerRequest): Promise<JournalEntry> {
    const { entryDate, description, referenceType, referenceId, createdById, postedById, fiscalPeriodId, lines } =
      request;

    if (!description?.trim()) {
      throw new BusinessException('Description is required');
    }
    if (!lines?.length) {
      throw new BusinessException('At least one ledger line is required');
    }

    const totalDebit = lines.reduce((sum, l) => sum + l.debitAmount, 0);
    const totalCredit = lines.reduce((sum, l) => sum + l.creditAmount, 0);
    if (Math.abs(totalDebit - totalCredit) > 1e-6) {
      throw new BusinessException(
        `Double-entry violation: total debits (${totalDebit}) must equal total credits (${totalCredit})`,
      );
    }

    if (fiscalPeriodId) {
      const period = await this.fiscalPeriodRepository.findById(fiscalPeriodId);
      if (!period) {
        throw new BusinessException(`Fiscal period not found: ${fiscalPeriodId}`);
      }
      if (!period.containsDate(entryDate)) {
        throw new BusinessException(
          `Entry date ${entryDate.toISOString()} is not within fiscal period ${period.code}`,
        );
      }
      if (period.isClosed()) {
        throw new BusinessException(`Cannot post to closed fiscal period: ${period.code}`);
      }
    }

    const entry = JournalEntry.create({
      entryDate,
      description,
      referenceType,
      referenceId,
      createdById,
      fiscalPeriodId,
    });

    lines.forEach((line, index) => {
      const ledgerLine = LedgerEntry.create(
        {
          journalEntryId: entry.id,
          accountId: line.accountId,
          lineNumber: index + 1,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount,
          currency: line.currency,
          particulars: line.particulars,
        },
      );
      entry.addLine(ledgerLine);
    });

    entry.post(postedById);
    return this.journalEntryRepository.create(entry);
  }
}
