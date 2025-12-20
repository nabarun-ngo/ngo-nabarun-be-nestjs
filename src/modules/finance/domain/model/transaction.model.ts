import { BusinessException } from 'src/shared/exceptions/business-exception';
import { BaseDomain } from 'src/shared/models/base-domain';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';

export enum TransactionType {
  IN = 'IN',                  // Legacy: Money coming in
  OUT = 'OUT',                // Legacy: Money going out
  TRANSFER = 'TRANSFER',      // Transfer between accounts
}

export enum TransactionStatus {
  SUCCESS = 'SUCCESS',        // Legacy: SUCCESS instead of COMPLETED
  FAILURE = 'FAILURE',        // Legacy: FAILURE instead of FAILED
  REVERSED = 'REVERSED',         // Legacy: REVERT instead of REVERSED
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
  referenceId?: string;
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
  #toAccBalance: number | undefined; // Account balance after transaction
  #fromAccBalance: number | undefined; // Account balance after transaction

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
    txnParticulars?: string,
    transferFromAccountId?: string,
    transferToAccountId?: string,
    toAccountBalance?: number,
    fromAccountBalance?: number,
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
    this.#toAccBalance = toAccountBalance;
    this.#fromAccBalance = fromAccountBalance;
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
      `NTXN${generateUniqueNDigitNumber(10)}IN`,
      TransactionType.IN,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      props.referenceId,
      props.referenceType,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnParticulars,
      undefined, // transferFromAccountId
      props.accountId, // transferToAccountId
      undefined,
      undefined,
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
      `NTXN${generateUniqueNDigitNumber(10)}OU`,
      TransactionType.OUT,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      props.referenceId,
      props.referenceType,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnParticulars,
      props.accountId, // transferFromAccountId
      undefined, // transferToAccountId
      undefined,
      undefined,
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
    referenceId?: string;
    referenceType?: TransactionRefType;
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
      `NTXN${generateUniqueNDigitNumber(10)}TR`,
      TransactionType.TRANSFER,
      props.amount,
      props.currency,
      TransactionStatus.SUCCESS,
      undefined, // referenceId
      TransactionRefType.NONE,
      props.description,
      props.metadata,
      props.transactionDate || new Date(),
      props.txnParticulars,
      props.fromAccountId,
      props.toAccountId,
      undefined,
      undefined,
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
    this.#txnStatus = TransactionStatus.REVERSED;
    this.touch();
  }

  /**
   * Set account balance after transaction
   */
  setToAccountBalance(balance: number): void {
    this.#toAccBalance = balance;
  }

  setFromAccountBalance(balance: number): void {
    this.#fromAccBalance = balance;
  }

  isEligibleForReverse(accountId: string) {
    return this.#txnStatus === TransactionStatus.SUCCESS
      && this.getTxnTypeForAccount(accountId) === 'DEBIT'
      && this.txnDate >= new Date(new Date().setDate(new Date().getDate() - 10));
  }

  // Getters
  get currency(): string { return this.#currency; }
  get referenceId(): string | undefined { return this.#referenceId; }
  get referenceType(): TransactionRefType | undefined { return this.#referenceType; }
  get description(): string { return this.#description; }
  get metadata(): Record<string, any> | undefined { return this.#metadata; }
  get transactionDate(): Date { return this.#transactionDate; }
  get txnId(): string { return this.#txnId; }
  get txnDate(): Date { return this.#txnDate; }
  get txnAmount(): number { return this.#txnAmount; }
  get txnType(): TransactionType { return this.#txnType; }
  get txnStatus(): TransactionStatus { return this.#txnStatus; }
  get txnDescription(): string { return this.#txnDescription; }
  get txnParticulars(): string | undefined { return this.#txnParticulars; }
  get txnRefId(): string | undefined { return this.#txnRefId; }
  get txnRefType(): TransactionRefType | undefined { return this.#txnRefType; }
  get transferFromAccountId(): string | undefined {
    return this.#txnType == TransactionType.IN ? undefined : this.#transferFromAccountId;
  }
  get transferToAccountId(): string | undefined {
    return this.#txnType == TransactionType.OUT ? undefined : this.#transferToAccountId;
  }
  get comment(): string | undefined { return this.#comment; }
  get toAccBalance(): number | undefined { return this.#toAccBalance; }
  get fromAccBalance(): number | undefined { return this.#fromAccBalance; }

  getAccountBalance(accId?: string): number | undefined {
    if (this.txnType === TransactionType.IN) return this.toAccBalance;
    if (this.txnType === TransactionType.OUT) return this.fromAccBalance;
    if (accId === this.transferFromAccountId) return this.#fromAccBalance;
    if (accId === this.transferToAccountId) return this.#toAccBalance;
    return undefined;
  }

  getTxnTypeForAccount(accId?: string): 'DEBIT' | 'CREDIT' | undefined {
    if (this.txnType === TransactionType.IN) return 'CREDIT';
    if (this.txnType === TransactionType.OUT) return 'DEBIT';
    if (accId === this.transferFromAccountId) return 'DEBIT';
    if (accId === this.transferToAccountId) return 'CREDIT';
    return undefined;
  }


}
