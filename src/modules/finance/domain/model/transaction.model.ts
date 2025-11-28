import { BusinessException } from 'src/shared/exceptions/business-exception';
import { BaseDomain } from 'src/shared/models/base-domain';

export enum TransactionType {
  IN = 'IN',                  // Legacy: Money coming in
  OUT = 'OUT',                // Legacy: Money going out
  TRANSFER = 'TRANSFER',      // Transfer between accounts
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',        // Legacy: SUCCESS instead of COMPLETED
  FAILURE = 'FAILURE',        // Legacy: FAILURE instead of FAILED
  REVERT = 'REVERT',         // Legacy: REVERT instead of REVERSED
}

export enum TransactionRefType {
  DONATION = 'DONATION',
  NONE = 'NONE',
  EXPENSE = 'EXPENSE',
  EARNING = 'EARNING',
}

export class TransactionFilter {
  type?: TransactionType[];
  status?: TransactionStatus[];
  referenceType?: TransactionRefType[];
  accountId?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Transaction Domain Model (Aggregate Root)
 * Represents a financial transaction in the system
 * All business logic and validations are in this domain model
 */
export class Transaction extends BaseDomain<string> {
  // Private fields for encapsulation
  #currency: string;
  #referenceId: string | undefined;
  #referenceType: TransactionRefType | undefined;
  #description: string;
  #metadata: Record<string, any> | undefined;
  #transactionDate: Date;

  // Legacy fields
  #txnId: string; // Legacy alias for id
  #txnNumber: string | undefined;
  #txnDate: Date; // Legacy alias for transactionDate
  #txnAmount: number; // Legacy alias for amount
  #txnType: TransactionType; // Legacy alias
  #txnStatus: TransactionStatus; // Legacy alias
  #txnDescription: string; // Legacy alias
  #txnParticulars: string | undefined;
  #txnRefId: string | undefined; // Legacy alias
  #txnRefType: TransactionRefType | undefined; // Legacy alias
  #transferFromAccountId: string | undefined;
  #transferToAccountId: string | undefined;
  #comment: string | undefined;
  #accBalance: number | undefined; // Account balance after transaction

  constructor(
    id: string,
    type: TransactionType,
    amount: number,
    currency: string,
    status: TransactionStatus,
    referenceId: string | undefined,
    referenceType: TransactionRefType | undefined,
    description: string,
    metadata: Record<string, any> | undefined,
    transactionDate: Date,
    txnNumber?: string,
    txnParticulars?: string,
    transferFromAccountId?: string,
    transferToAccountId?: string,
    comment?: string,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#currency = currency;
    this.#referenceId = referenceId;
    this.#referenceType = referenceType;
    this.#description = description;
    this.#metadata = metadata;
    this.#transactionDate = transactionDate;
    this.#txnId = id; // Legacy alias
    this.#txnNumber = txnNumber;
    this.#txnDate = transactionDate; // Legacy alias
    this.#txnAmount = amount; // Legacy alias
    this.#txnType = type; // Legacy alias
    this.#txnStatus = status; // Legacy alias
    this.#txnDescription = description; // Legacy alias
    this.#txnParticulars = txnParticulars;
    this.#txnRefId = referenceId; // Legacy alias
    this.#txnRefType = referenceType; // Legacy alias
    this.#transferFromAccountId = transferFromAccountId;
    this.#transferToAccountId = transferToAccountId;
    this.#comment = comment;
  }

  /**
   * Factory method to create a transaction (IN - money coming in)
   * Business validation: amount must be positive, accountId required
   */
  static createIn(props: {
    amount: number;
    currency: string;
    accountId: string;
    description: string;
    referenceId?: string;
    referenceType?: TransactionRefType;
    txnNumber?: string;
    txnParticulars?: string;
    comment?: string;
    transactionDate?: Date;
    metadata?: Record<string, any>;
  }): Transaction {
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Transaction amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    if (!props.accountId) {
      throw new BusinessException('Account ID is required');
    }
    if (!props.description) {
      throw new BusinessException('Transaction description is required');
    }

    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.IN,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      props.referenceId,
      props.referenceType,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnNumber,
      props.txnParticulars,
      undefined, // transferFromAccountId
      props.accountId, // transferToAccountId
      props.comment,
      new Date(),
      new Date(),
    );
    return transaction;
  }

  /**
   * Factory method to create a transaction (OUT - money going out)
   * Business validation: amount must be positive, accountId required
   */
  static createOut(props: {
    amount: number;
    currency: string;
    accountId: string;
    description: string;
    referenceId?: string;
    referenceType?: TransactionRefType;
    txnNumber?: string;
    txnParticulars?: string;
    comment?: string;
    transactionDate?: Date;
    metadata?: Record<string, any>;
  }): Transaction {
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Transaction amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    if (!props.accountId) {
      throw new BusinessException('Account ID is required');
    }
    if (!props.description) {
      throw new BusinessException('Transaction description is required');
    }

    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.OUT,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      props.referenceId,
      props.referenceType,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnNumber,
      props.txnParticulars,
      props.accountId, // transferFromAccountId
      undefined, // transferToAccountId
      props.comment
    );

    return transaction;
  }

  /**
   * Factory method to create a transfer transaction
   * Business validation: amount must be positive, both accounts required
   */
  static createTransfer(props: {
    amount: number;
    currency: string;
    fromAccountId: string;
    toAccountId: string;
    description: string;
    txnNumber?: string;
    txnParticulars?: string;
    comment?: string;
    transactionDate?: Date;
    metadata?: Record<string, any>;
  }): Transaction {
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Transaction amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    if (!props.fromAccountId || !props.toAccountId) {
      throw new BusinessException('Both from and to account IDs are required for transfer');
    }
    if (props.fromAccountId === props.toAccountId) {
      throw new BusinessException('Cannot transfer to the same account');
    }

    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.TRANSFER,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      props.fromAccountId, // Primary account (from)
      TransactionRefType.NONE,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnNumber,
      props.txnParticulars,
      props.fromAccountId,
      props.toAccountId,
      props.comment,
    );

    return transaction;
  }

  /**
   * Mark transaction as failed
   * Business validation: Cannot mark successful transaction as failed
   */
  markAsFailed(): void {
    if (this.#txnStatus === TransactionStatus.SUCCESS) {
      throw new BusinessException('Cannot mark successful transaction as failed');
    }
    this.#txnStatus = TransactionStatus.FAILURE;
    this.touch();
  }

  /**
   * Revert a transaction
   * Business validation: Can only revert successful transactions
   */
  revert(): void {
    if (this.#txnStatus !== TransactionStatus.SUCCESS) {
      throw new BusinessException('Can only revert successful transactions');
    }
    this.#txnStatus = TransactionStatus.REVERT;
    this.touch();
  }

  /**
   * Set account balance after transaction
   */
  setAccountBalance(balance: number): void {
    this.#accBalance = balance;
  }

  // Getters
  get currency(): string { return this.#currency; }
  get referenceId(): string | undefined { return this.#referenceId; }
  get referenceType(): TransactionRefType | undefined { return this.#referenceType; }
  get description(): string { return this.#description; }
  get metadata(): Record<string, any> | undefined { return this.#metadata; }
  get transactionDate(): Date { return this.#transactionDate; }
  get txnId(): string { return this.#txnId; }
  get txnNumber(): string | undefined { return this.#txnNumber; }
  get txnDate(): Date { return this.#txnDate; }
  get txnAmount(): number { return this.#txnAmount; }
  get txnType(): TransactionType { return this.#txnType; }
  get txnStatus(): TransactionStatus { return this.#txnStatus; }
  get txnDescription(): string { return this.#txnDescription; }
  get txnParticulars(): string | undefined { return this.#txnParticulars; }
  get txnRefId(): string | undefined { return this.#txnRefId; }
  get txnRefType(): TransactionRefType | undefined { return this.#txnRefType; }
  get transferFromAccountId(): string | undefined { return this.#transferFromAccountId; }
  get transferToAccountId(): string | undefined { return this.#transferToAccountId; }
  get comment(): string | undefined { return this.#comment; }
  get accBalance(): number | undefined { return this.#accBalance; }
}
