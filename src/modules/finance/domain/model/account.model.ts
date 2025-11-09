import { AggregateRoot } from 'src/shared/models/aggregate-root';

export enum AccountType {
  MAIN = 'MAIN',              // Main organization account
  PROJECT = 'PROJECT',        // Project-specific account
  EVENT = 'EVENT',            // Event-specific account
  RESERVE = 'RESERVE',        // Reserve/savings account
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  CLOSED = 'CLOSED',
}

/**
 * Account Domain Model (Aggregate Root)
 * Represents a financial account in the system
 */
export class Account extends AggregateRoot<string> {
  constructor(
    id: string,
    public name: string,
    public readonly type: AccountType,
    public balance: number,
    public currency: string,
    public status: AccountStatus,
    public description: string | undefined,
    createdAt?: Date,
    updatedAt?: Date,
    public readonly version: bigint = BigInt(0),
  ) {
    super(id,createdAt,updatedAt);
  }

  /**
   * Factory method to create a new Account
   */
  static create(props: {
    name: string;
    type: AccountType;
    currency: string;
    initialBalance?: number;
    description?: string;
  }): Account {
    return new Account(
      crypto.randomUUID(),
      props.name,
      props.type,
      props.initialBalance || 0,
      props.currency,
      AccountStatus.ACTIVE,
      props.description,
    );
  }

  /**
   * Credit amount to account (add money)
   */
  credit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive');
    }
    
    if (this.status !== AccountStatus.ACTIVE) {
      throw new Error('Cannot credit to inactive or closed account');
    }

    this.balance += amount;
  }

  /**
   * Debit amount from account (remove money)
   */
  debit(amount: number): void {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive');
    }
    
    if (this.status !== AccountStatus.ACTIVE) {
      throw new Error('Cannot debit from inactive or closed account');
    }

    if (this.balance < amount) {
      throw new Error('Insufficient balance');
    }

    this.balance -= amount;
  }

  /**
   * Deactivate account
   */
  deactivate(): void {
    if (this.status === AccountStatus.CLOSED) {
      throw new Error('Cannot deactivate a closed account');
    }
    this.status = AccountStatus.INACTIVE;
  }

  /**
   * Activate account
   */
  activate(): void {
    if (this.status === AccountStatus.CLOSED) {
      throw new Error('Cannot activate a closed account');
    }
    this.status = AccountStatus.ACTIVE;
  }

  /**
   * Close account (can only close if balance is zero)
   */
  close(): void {
    if (this.balance !== 0) {
      throw new Error('Can only close account with zero balance');
    }
    this.status = AccountStatus.CLOSED;
  }

  /**
   * Check if account has sufficient funds
   */
  hasSufficientFunds(amount: number): boolean {
    return this.balance >= amount;
  }
}
