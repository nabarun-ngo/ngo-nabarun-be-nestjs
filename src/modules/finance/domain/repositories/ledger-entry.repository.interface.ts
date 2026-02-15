import { BaseRepository } from 'src/shared/models/repository.base';
import { LedgerEntry, LedgerEntryFilter } from '../model/ledger-entry.model';

/**
 * Ledger lines are immutable once the journal is POSTED.
 * Account balance is derived from sum(creditAmount) - sum(debitAmount) per account.
 */
export interface ILedgerEntryRepository extends BaseRepository<LedgerEntry, string, LedgerEntryFilter> {
  createMany(entries: LedgerEntry[]): Promise<void>;

  findByJournalEntryId(journalEntryId: string): Promise<LedgerEntry[]>;

  findByAccountId(
    accountId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<LedgerEntry[]>;

  /**
   * Derived balance for an account as of a given date (inclusive).
   */
  getBalanceForAccount(accountId: string, asOfDate?: Date): Promise<number>;
}

export const LEDGER_ENTRY_REPOSITORY = Symbol('LEDGER_ENTRY_REPOSITORY');
