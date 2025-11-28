import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { AccountCreatedEvent } from '../events/account-created.event';

export enum AccountType {
  PRINCIPAL = 'PRINCIPAL',    // Legacy: Principal account
  GENERAL = 'GENERAL',        // Legacy: General account
  DONATION = 'DONATION',      // Legacy: Donation account
  PUBLIC_DONATION = 'PUBLIC_DONATION', // Legacy: Public donation account
}

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',        // Legacy: BLOCKED instead of CLOSED
}

/**
 * Bank Detail Value Object
 */
export class BankDetail {
  constructor(
    public bankAccountHolderName?: string,
    public bankName?: string,
    public bankBranch?: string,
    public bankAccountNumber?: string,
    public bankAccountType?: string,
    public IFSCNumber?: string,
  ) { }
}

/**
 * UPI Detail Value Object
 */
export class UPIDetail {
  constructor(
    public payeeName?: string,
    public upiId?: string,
    public mobileNumber?: string,
    public qrData?: string,
  ) { }
}

export interface AccountFilter {
  id?: string;
  type?: AccountType[];
  status?: AccountStatus[];
  accountHolderName?: string;
  accountHolderId?: string;
}

/**
 * Account Domain Model (Aggregate Root)
 * Represents a financial account in the system
 * All business logic and validations are in this domain model
 */
export class Account extends AggregateRoot<string> {
  // Private fields for encapsulation
  #name: string;
  #type: AccountType;
  #balance: number;
  #currency: string;
  #status: AccountStatus;
  #description: string | undefined;
  #accountHolderName: string | undefined;
  #accountHolderId: string | undefined;
  #activatedOn: Date | undefined;
  #bankDetail: BankDetail | undefined;
  #upiDetail: UPIDetail | undefined;

  constructor(
    id: string,
    name: string,
    type: AccountType,
    balance: number,
    currency: string,
    status: AccountStatus,
    description: string | undefined,
    accountHolderName?: string,
    accountHolderId?: string,
    activatedOn?: Date,
    bankDetail?: BankDetail,
    upiDetail?: UPIDetail,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#name = name;
    this.#type = type;
    this.#balance = balance;
    this.#currency = currency;
    this.#status = status;
    this.#description = description;
    this.#accountHolderName = accountHolderName;
    this.#accountHolderId = accountHolderId;
    this.#activatedOn = activatedOn;
    this.#bankDetail = bankDetail;
    this.#upiDetail = upiDetail;
  }

  /**
   * Factory method to create a new Account
   * Business validation: name and currency required, initialBalance must be non-negative
   */
  static create(props: {
    name: string;
    type: AccountType;
    currency: string;
    initialBalance?: number;
    description?: string;
    accountHolderId?: string;
    accountHolderName?: string;
    bankDetail?: BankDetail;
    upiDetail?: UPIDetail;
  }): Account {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessException('Account name is required');
    }
    if (!props.currency || props.currency.trim().length === 0) {
      throw new BusinessException('Currency is required');
    }
    if (props.initialBalance !== undefined && props.initialBalance < 0) {
      throw new BusinessException('Initial balance cannot be negative');
    }

    const now = new Date();
    const account = new Account(
      crypto.randomUUID(),
      props.name,
      props.type,
      props.initialBalance || 0,
      props.currency,
      AccountStatus.ACTIVE,
      props.description,
      props.accountHolderName,
      props.accountHolderId,
      now, // activatedOn
      props.bankDetail,
      props.upiDetail,
      now,
      now,
    );
    account.addDomainEvent(new AccountCreatedEvent(account));
    return account;
  }

  /**
   * Credit amount to account (add money)
   * Business validation: amount must be positive, account must be active
   */
  credit(amount: number): void {
    if (amount <= 0) {
      throw new BusinessException('Credit amount must be positive');
    }

    if (this.#status !== AccountStatus.ACTIVE) {
      throw new BusinessException('Cannot credit to inactive or blocked account');
    }

    this.#balance += amount;
    this.touch();
  }

  /**
   * Debit amount from account (remove money)
   * Business validation: amount must be positive, account must be active, sufficient balance
   */
  debit(amount: number): void {
    if (amount <= 0) {
      throw new BusinessException('Debit amount must be positive');
    }

    if (this.#status !== AccountStatus.ACTIVE) {
      throw new BusinessException('Cannot debit from inactive or blocked account');
    }

    if (this.#balance < amount) {
      throw new BusinessException('Insufficient balance');
    }

    this.#balance -= amount;
    this.touch();
  }

  /**
   * Deactivate account
   * Business validation: Cannot deactivate blocked account
   */
  deactivate(): void {
    if (this.#status === AccountStatus.BLOCKED) {
      throw new BusinessException('Cannot deactivate a blocked account');
    }
    this.#status = AccountStatus.INACTIVE;
    this.touch();
  }

  /**
   * Activate account
   * Business validation: Cannot activate blocked account
   */
  activate(): void {
    if (this.#status === AccountStatus.BLOCKED) {
      throw new BusinessException('Cannot activate a blocked account');
    }
    this.#status = AccountStatus.ACTIVE;
    if (!this.#activatedOn) {
      this.#activatedOn = new Date();
    }
    this.touch();
  }

  /**
   * Block account
   * Business validation: Can block any account
   */
  block(): void {
    this.#status = AccountStatus.BLOCKED;
    this.touch();
  }

  /**
   * Update account details
   * Business validation: Cannot change type, can update name, description, bank/UPI details
   */
  update(props: {
    name?: string;
    description?: string;
    bankDetail?: BankDetail;
    upiDetail?: UPIDetail;
    accountHolderName?: string;
  }): void {
    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new BusinessException('Account name cannot be empty');
      }
      this.#name = props.name;
    }
    if (props.description !== undefined) {
      this.#description = props.description;
    }
    if (props.bankDetail !== undefined) {
      this.#bankDetail = props.bankDetail;
    }
    if (props.upiDetail !== undefined) {
      this.#upiDetail = props.upiDetail;
    }
    if (props.accountHolderName !== undefined) {
      this.#accountHolderName = props.accountHolderName;
    }
    this.touch();
  }

  // Getters
  get name(): string { return this.#name; }
  get type(): AccountType { return this.#type; }
  get balance(): number { return this.#balance; }
  get currency(): string { return this.#currency; }
  get status(): AccountStatus { return this.#status; }
  get description(): string | undefined { return this.#description; }
  get accountHolderName(): string | undefined { return this.#accountHolderName; }
  get accountHolderId(): string | undefined { return this.#accountHolderId; }
  get activatedOn(): Date | undefined { return this.#activatedOn; }
  get bankDetail(): BankDetail | undefined { return this.#bankDetail; }
  get upiDetail(): UPIDetail | undefined { return this.#upiDetail; }

  /**
   * Check if account has sufficient funds
   */
  hasSufficientFunds(amount: number): boolean {
    return this.#balance >= amount;
  }

  /**
   * Check if account is active
   */
  isActive(): boolean {
    return this.#status === AccountStatus.ACTIVE;
  }
}
