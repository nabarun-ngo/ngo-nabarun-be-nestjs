import { BaseRepository } from 'src/shared/models/repository.base';
import { JournalEntry, JournalEntryFilter } from '../model/journal-entry.model';

/**
 * Journal entry is created with lines via create(entry); entry.getLines() provides ledger lines.
 * Balance is derived from LedgerEntry; no balance stored on Account.
 */
export interface IJournalEntryRepository extends BaseRepository<JournalEntry, string, JournalEntryFilter> {
  findByReference(referenceType: string, referenceId: string): Promise<JournalEntry | null>;
}

export const JOURNAL_ENTRY_REPOSITORY = Symbol('JOURNAL_ENTRY_REPOSITORY');
