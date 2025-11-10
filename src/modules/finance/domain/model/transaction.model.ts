import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { TransactionCreatedEvent } from '../events/transaction-created.event';

export enum TransactionType {
  DONATION = 'DONATION',      // Money coming in from donations
  EXPENSE = 'EXPENSE',        // Money going out for expenses
  EARNING = 'EARNING',        // Money coming in from other sources
  TRANSFER = 'TRANSFER',      // Transfer between accounts
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REVERSED = 'REVERSED',
}

/**
 * Transaction Domain Model (Aggregate Root)
 * Represents a financial transaction in the system
 */
export class Transaction extends AggregateRoot<string> {
  constructor(
    id: string,
    public readonly type: TransactionType,
    public amount: number,
    public currency: string,
    public status: TransactionStatus,
    public accountId: string,                    // Account this transaction belongs to
    public referenceId: string | undefined,      // Reference to donation, expense, or earning
    public referenceType: string | undefined,    // Type of reference (Donation, Expense, Earning)
    public description: string,
    public metadata: Record<string, any> | undefined,
    public readonly transactionDate: Date,
    createdAt?: Date,
     updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  /**
   * Factory method to create a transaction from a donation
   */
  static createFromDonation(props: {
    amount: number;
    currency: string;
    accountId: string;
    donationId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Transaction {
    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.DONATION,
      props.amount,
      props.currency,
      TransactionStatus.COMPLETED,
      props.accountId,
      props.donationId,
      'Donation',
      props.description,
      props.metadata,
      new Date(),
      new Date(),
      new Date(),
    );

    transaction.addDomainEvent(new TransactionCreatedEvent(
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.accountId,
    ));

    return transaction;
  }

  /**
   * Factory method to create a transaction from an expense
   */
  static createFromExpense(props: {
    amount: number;
    currency: string;
    accountId: string;
    expenseId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Transaction {
    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.EXPENSE,
      props.amount,
      props.currency,
      TransactionStatus.COMPLETED,
      props.accountId,
      props.expenseId,
      'Expense',
      props.description,
      props.metadata,
      new Date(),
      new Date(),
      new Date(),
    );

    transaction.addDomainEvent(new TransactionCreatedEvent(
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.accountId,
    ));

    return transaction;
  }

  /**
   * Factory method to create a transaction from an earning
   */
  static createFromEarning(props: {
    amount: number;
    currency: string;
    accountId: string;
    earningId: string;
    description: string;
    metadata?: Record<string, any>;
  }): Transaction {
    const transaction = new Transaction(
      crypto.randomUUID(),
      TransactionType.EARNING,
      props.amount,
      props.currency,
      TransactionStatus.COMPLETED,
      props.accountId,
      props.earningId,
      'Earning',
      props.description,
      props.metadata,
      new Date(),
      new Date(),
      new Date(),
    );

    transaction.addDomainEvent(new TransactionCreatedEvent(
      transaction.id,
      transaction.type,
      transaction.amount,
      transaction.accountId,
    ));

    return transaction;
  }

  /**
   * Mark transaction as failed
   */
  markAsFailed(): void {
    if (this.status === TransactionStatus.COMPLETED) {
      throw new Error('Cannot mark completed transaction as failed');
    }
    this.status = TransactionStatus.FAILED;
  }

  /**
   * Reverse a transaction
   */
  reverse(): void {
    if (this.status !== TransactionStatus.COMPLETED) {
      throw new Error('Can only reverse completed transactions');
    }
    this.status = TransactionStatus.REVERSED;
  }
}
