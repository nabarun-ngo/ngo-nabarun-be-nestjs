import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { LedgerEntry } from './ledger-entry.model';
import { randomUUID } from 'crypto';

export enum JournalEntryStatus {
  DRAFT = 'DRAFT',
  POSTED = 'POSTED',
}

export enum JournalEntryReferenceType {
  DONATION = 'DONATION',
  EXPENSE = 'EXPENSE',
  EARNING = 'EARNING',
  TRANSFER = 'TRANSFER',
  ADD_FUND = 'ADD_FUND',
  INITIAL_BALANCE = 'INITIAL_BALANCE',
  LEGACY_TRANSACTION = 'LEGACY_TRANSACTION',
}

export interface JournalEntryFilter {
  referenceType?: JournalEntryReferenceType;
  referenceId?: string;
  status?: JournalEntryStatus[];
  entryDateFrom?: Date;
  entryDateTo?: Date;
  fiscalPeriodId?: string;
}

export interface CreateJournalEntryProps {
  entryDate: Date;
  description: string;
  referenceType?: JournalEntryReferenceType;
  referenceId?: string;
  createdById?: string;
  fiscalPeriodId?: string;
  reversalOfId?: string;
}

/**
 * JournalEntry Domain Model (Aggregate Root)
 * Represents one accounting event (header). Once POSTED, immutable.
 * Balance is derived from LedgerEntry; no balance stored on Account in this model.
 */
export class JournalEntry extends AggregateRoot<string> {
  #entryDate: Date;
  #description: string;
  #referenceType: JournalEntryReferenceType | undefined;
  #referenceId: string | undefined;
  #status: JournalEntryStatus;
  #createdById: string | undefined;
  #postedAt: Date | undefined;
  #postedById: string | undefined;
  #fiscalPeriodId: string | undefined;
  #reversalOfId: string | undefined;
  #version: number;
  #lines: LedgerEntry[] = [];

  constructor(
    id: string,
    entryDate: Date,
    description: string,
    status: JournalEntryStatus,
    referenceType?: JournalEntryReferenceType,
    referenceId?: string,
    createdById?: string,
    postedAt?: Date,
    postedById?: string,
    fiscalPeriodId?: string,
    reversalOfId?: string,
    version?: number,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#entryDate = entryDate;
    this.#description = description;
    this.#referenceType = referenceType;
    this.#referenceId = referenceId;
    this.#status = status;
    this.#createdById = createdById;
    this.#postedAt = postedAt;
    this.#postedById = postedById;
    this.#fiscalPeriodId = fiscalPeriodId;
    this.#reversalOfId = reversalOfId;
    this.#version = version ?? 0;
  }

  static create(props: CreateJournalEntryProps): JournalEntry {
    if (!props.entryDate) {
      throw new BusinessException('Entry date is required');
    }
    if (!props.description?.trim()) {
      throw new BusinessException('Description is required');
    }
    return new JournalEntry(
      randomUUID(),
      props.entryDate,
      props.description,
      JournalEntryStatus.DRAFT,
      props.referenceType,
      props.referenceId,
      props.createdById,
      undefined,
      undefined,
      props.fiscalPeriodId,
      props.reversalOfId,
      0,
      new Date(),
      new Date(),
    );
  }

  /** Add a ledger line (only when DRAFT). Repository uses getLines() when persisting. */
  addLine(line: LedgerEntry): void {
    if (this.#status !== JournalEntryStatus.DRAFT) {
      throw new BusinessException('Cannot add lines to a posted journal entry');
    }
    this.#lines.push(line);
  }

  getLines(): ReadonlyArray<LedgerEntry> {
    return this.#lines;
  }

  /**
   * Post the entry. Once posted, the entry and its ledger lines are immutable.
   */
  post(postedById: string): void {
    if (this.#status !== JournalEntryStatus.DRAFT) {
      throw new BusinessException('Only DRAFT journal entries can be posted');
    }
    this.#status = JournalEntryStatus.POSTED;
    this.#postedAt = new Date();
    this.#postedById = postedById;
  }

  get entryDate(): Date {
    return this.#entryDate;
  }
  get description(): string {
    return this.#description;
  }
  get referenceType(): JournalEntryReferenceType | undefined {
    return this.#referenceType;
  }
  get referenceId(): string | undefined {
    return this.#referenceId;
  }
  get status(): JournalEntryStatus {
    return this.#status;
  }
  get createdById(): string | undefined {
    return this.#createdById;
  }
  get postedAt(): Date | undefined {
    return this.#postedAt;
  }
  get postedById(): string | undefined {
    return this.#postedById;
  }
  get fiscalPeriodId(): string | undefined {
    return this.#fiscalPeriodId;
  }
  get reversalOfId(): string | undefined {
    return this.#reversalOfId;
  }
  get version(): number {
    return this.#version;
  }

  isDraft(): boolean {
    return this.#status === JournalEntryStatus.DRAFT;
  }

  isPosted(): boolean {
    return this.#status === JournalEntryStatus.POSTED;
  }
}
