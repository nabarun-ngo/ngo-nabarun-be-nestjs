import { BaseDomain } from 'src/shared/models/base-domain';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { randomUUID } from 'crypto';

export interface LedgerEntryFilter {
  accountId?: string;
  journalEntryId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface CreateLedgerEntryProps {
  journalEntryId: string;
  accountId: string;
  lineNumber: number;
  debitAmount: number;
  creditAmount: number;
  currency: string;
  particulars?: string;
  balanceAfter?: number;
}

/**
 * LedgerEntry Domain Model
 * One line per account in a journal entry. Immutable once the journal is POSTED.
 * Account balance is derived from sum(creditAmount) - sum(debitAmount) for the account, not stored here.
 */
export class LedgerEntry extends BaseDomain<string> {
  #journalEntryId: string;
  #accountId: string;
  #lineNumber: number;
  #debitAmount: number;
  #creditAmount: number;
  #currency: string;
  #particulars: string | undefined;
  #balanceAfter: number | undefined;

  constructor(
    id: string,
    journalEntryId: string,
    accountId: string,
    lineNumber: number,
    debitAmount: number,
    creditAmount: number,
    currency: string,
    particulars?: string,
    balanceAfter?: number,
    createdAt?: Date,
  ) {
    super(id, createdAt, createdAt);
    this.#journalEntryId = journalEntryId;
    this.#accountId = accountId;
    this.#lineNumber = lineNumber;
    this.#debitAmount = debitAmount;
    this.#creditAmount = creditAmount;
    this.#currency = currency;
    this.#particulars = particulars;
    this.#balanceAfter = balanceAfter;
  }

  static create(props: CreateLedgerEntryProps): LedgerEntry {
    if (!props.journalEntryId?.trim()) {
      throw new BusinessException('Journal entry id is required');
    }
    if (!props.accountId?.trim()) {
      throw new BusinessException('Account id is required');
    }
    if (props.lineNumber < 1) {
      throw new BusinessException('Line number must be at least 1');
    }
    if (props.debitAmount < 0 || props.creditAmount < 0) {
      throw new BusinessException('Debit and credit amounts must be non-negative');
    }
    if (props.debitAmount > 0 && props.creditAmount > 0) {
      throw new BusinessException('A line cannot have both debit and credit');
    }
    if (!props.currency?.trim()) {
      throw new BusinessException('Currency is required');
    }
    return new LedgerEntry(
      randomUUID(),
      props.journalEntryId,
      props.accountId,
      props.lineNumber,
      props.debitAmount,
      props.creditAmount,
      props.currency,
      props.particulars,
      props.balanceAfter,
      new Date(),
    );
  }

  get journalEntryId(): string {
    return this.#journalEntryId;
  }
  get accountId(): string {
    return this.#accountId;
  }
  get lineNumber(): number {
    return this.#lineNumber;
  }
  get debitAmount(): number {
    return this.#debitAmount;
  }
  get creditAmount(): number {
    return this.#creditAmount;
  }
  get currency(): string {
    return this.#currency;
  }
  get particulars(): string | undefined {
    return this.#particulars;
  }
  get balanceAfter(): number | undefined {
    return this.#balanceAfter;
  }
}
