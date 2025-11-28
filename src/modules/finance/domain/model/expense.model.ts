import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { ExpenseRecordedEvent } from '../events/expense-recorded.event';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum ExpenseCategory {
  PROJECT = 'PROJECT',        // Expenses on projects
  EVENT = 'EVENT',            // Expenses on events
  ADHOC = 'ADHOC',            // Ad-hoc expenses
  OPERATIONAL = 'OPERATIONAL', // Operational expenses
  ADMINISTRATIVE = 'ADMINISTRATIVE', // Administrative expenses
}

export enum ExpenseStatus {
  DRAFT = 'DRAFT',            // Legacy: Draft status
  SUBMITTED = 'SUBMITTED',    // Legacy: Submitted for approval
  FINALIZED = 'FINALIZED',    // Legacy: Finalized (approved)
  SETTLED = 'SETTLED',        // Legacy: Settled (paid)
  REJECTED = 'REJECTED',      // Rejected
}

/**
 * Expense Reference Type Enum
 */
export enum ExpenseRefType {
  EVENT = 'EVENT',
  OTHER = 'OTHER',
}

/**
 * Expense Item Value Object
 */
export class ExpenseItem {
  constructor(
    public id: string,
    public itemName: string,
    public description: string | undefined,
    public amount: number,
  ) {
    if (!itemName || itemName.trim().length === 0) {
      throw new BusinessException('Expense item name is required');
    }
    if (amount <= 0) {
      throw new BusinessException('Expense item amount must be positive');
    }
  }
}

export class ExpenseFilter {
  startDate?: Date;
  endDate?: Date;
  expenseRefId?: string;
  expenseId?: string;
  expenseStatus?: ExpenseStatus[];
  payerId?: string;
}

/**
 * Expense Domain Model (Aggregate Root)
 * Represents an expense in the system
 * All business logic and validations are in this domain model
 */
export class Expense extends AggregateRoot<string> {
  // Private fields for encapsulation
  #name: string;
  #category: ExpenseCategory;
  #amount: number;
  #currency: string;
  #status: ExpenseStatus;
  #description: string;
  #referenceId: string | undefined;
  #referenceType: string | undefined;
  #requestedBy: string;
  #approvedBy: string | undefined;
  #finalizedBy: string | undefined;
  #settledBy: string | undefined;
  #rejectedBy: string | undefined;
  #accountId: string | undefined;
  #transactionId: string | undefined;
  #receiptUrl: string | undefined;
  #expenseDate: Date;
  #approvedDate: Date | undefined;
  #finalizedDate: Date | undefined;
  #settledDate: Date | undefined;
  #rejectedDate: Date | undefined;
  #paidDate: Date | undefined;
  #expenseItems: ExpenseItem[];
  #finalAmount: number;
  #txnNumber: string | undefined;
  #remarks: string | undefined;
  #isAdmin: boolean;
  #isDelegated: boolean;

  constructor(
    id: string,
    name: string,
    category: ExpenseCategory,
    amount: number,
    currency: string,
    status: ExpenseStatus,
    description: string,
    referenceId: string | undefined,
    referenceType: string | undefined,
    requestedBy: string,
    approvedBy: string | undefined,
    finalizedBy: string | undefined,
    settledBy: string | undefined,
    rejectedBy: string | undefined,
    accountId: string | undefined,
    transactionId: string | undefined,
    receiptUrl: string | undefined,
    expenseDate: Date,
    approvedDate: Date | undefined,
    finalizedDate: Date | undefined,
    settledDate: Date | undefined,
    rejectedDate: Date | undefined,
    paidDate: Date | undefined,
    expenseItems: ExpenseItem[],
    finalAmount: number,
    txnNumber: string | undefined,
    remarks: string | undefined,
    isAdmin: boolean = false,
    isDelegated: boolean = false,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.#name = name;
    this.#category = category;
    this.#amount = amount;
    this.#currency = currency;
    this.#status = status;
    this.#description = description;
    this.#referenceId = referenceId;
    this.#referenceType = referenceType;
    this.#requestedBy = requestedBy;
    this.#approvedBy = approvedBy;
    this.#finalizedBy = finalizedBy;
    this.#settledBy = settledBy;
    this.#rejectedBy = rejectedBy;
    this.#accountId = accountId;
    this.#transactionId = transactionId;
    this.#receiptUrl = receiptUrl;
    this.#expenseDate = expenseDate;
    this.#approvedDate = approvedDate;
    this.#finalizedDate = finalizedDate;
    this.#settledDate = settledDate;
    this.#rejectedDate = rejectedDate;
    this.#paidDate = paidDate;
    this.#expenseItems = expenseItems;
    this.#finalAmount = finalAmount;
    this.#txnNumber = txnNumber;
    this.#remarks = remarks;
    this.#isAdmin = isAdmin;
    this.#isDelegated = isDelegated;
  }

  /**
   * Factory method to create a new Expense
   * Business validation: amount must be positive, name and description required
   */
  static create(props: {
    name: string;
    category: ExpenseCategory;
    amount: number;
    currency: string;
    description: string;
    requestedBy: string;
    referenceId?: string;
    referenceType?: string;
    receiptUrl?: string;
    expenseDate?: Date;
    expenseItems?: ExpenseItem[];
  }): Expense {
    if (!props.name || props.name.trim().length === 0) {
      throw new BusinessException('Expense name is required');
    }
    if (!props.description || props.description.trim().length === 0) {
      throw new BusinessException('Expense description is required');
    }
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Expense amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    if (!props.requestedBy) {
      throw new BusinessException('Requested by user ID is required');
    }

    // Calculate final amount from items if provided, otherwise use amount
    const expenseItems = props.expenseItems || [];
    const finalAmount = expenseItems.length > 0
      ? expenseItems.reduce((sum, item) => sum + item.amount, 0)
      : props.amount;

    const expense = new Expense(
      crypto.randomUUID(),
      props.name,
      props.category,
      props.amount,
      props.currency,
      ExpenseStatus.DRAFT,
      props.description,
      props.referenceId,
      props.referenceType,
      props.requestedBy,
      undefined, // approvedBy
      undefined, // finalizedBy
      undefined, // settledBy
      undefined, // rejectedBy
      undefined, // accountId
      undefined, // transactionId
      props.receiptUrl,
      props.expenseDate || new Date(),
      undefined, // approvedDate
      undefined, // finalizedDate
      undefined, // settledDate
      undefined, // rejectedDate
      undefined, // paidDate
      expenseItems,
      finalAmount,
      undefined, // txnNumber
      undefined, // remarks
      false, // isAdmin
      false, // isDelegated
      new Date(),
      new Date(),
    );

    expense.addDomainEvent(new ExpenseRecordedEvent(
      expense.id,
      expense.#category,
      expense.#amount,
      expense.#requestedBy,
    ));

    return expense;
  }

  /**
   * Submit expense for approval
   * Business validation: Can only submit draft expenses
   */
  submit(): void {
    if (this.#status !== ExpenseStatus.DRAFT) {
      throw new BusinessException('Can only submit draft expenses');
    }
    this.#status = ExpenseStatus.SUBMITTED;
    this.touch();
  }

  /**
   * Finalize expense (approve)
   * Business validation: Can only finalize submitted expenses
   */
  finalize(finalizedBy: string): void {
    if (this.#status !== ExpenseStatus.SUBMITTED) {
      throw new BusinessException('Can only finalize submitted expenses');
    }
    this.#status = ExpenseStatus.FINALIZED;
    this.#finalizedBy = finalizedBy;
    this.#finalizedDate = new Date();
    this.touch();
  }

  /**
   * Reject expense
   * Business validation: Can only reject submitted expenses
   */
  reject(rejectedBy: string, remarks?: string): void {
    if (this.#status !== ExpenseStatus.SUBMITTED) {
      throw new BusinessException('Can only reject submitted expenses');
    }
    this.#status = ExpenseStatus.REJECTED;
    this.#rejectedBy = rejectedBy;
    this.#rejectedDate = new Date();
    if (remarks) {
      this.#remarks = remarks;
    }
    this.touch();
  }

  /**
   * Settle expense (mark as paid)
   * Business validation: Can only settle finalized expenses
   */
  settle(props: {
    settledBy: string;
    accountId: string;
    transactionId: string;
    txnNumber?: string;
  }): void {
    if (this.#status !== ExpenseStatus.FINALIZED) {
      throw new BusinessException('Can only settle finalized expenses');
    }

    this.#status = ExpenseStatus.SETTLED;
    this.#settledBy = props.settledBy;
    this.#settledDate = new Date();
    this.#paidDate = new Date();
    this.#accountId = props.accountId;
    this.#transactionId = props.transactionId;
    if (props.txnNumber) {
      this.#txnNumber = props.txnNumber;
    }
    this.touch();
  }

  /**
   * Update expense details
   * Business validation: Can only update draft expenses
   */
  update(props: {
    name?: string;
    description?: string;
    amount?: number;
    expenseDate?: Date;
    receiptUrl?: string;
    expenseItems?: ExpenseItem[];
    remarks?: string;
  }): void {
    if (this.#status !== ExpenseStatus.DRAFT) {
      throw new BusinessException('Can only update draft expenses');
    }

    if (props.name !== undefined) {
      if (!props.name || props.name.trim().length === 0) {
        throw new BusinessException('Expense name cannot be empty');
      }
      this.#name = props.name;
    }
    if (props.description !== undefined) {
      this.#description = props.description;
    }
    if (props.amount !== undefined) {
      if (props.amount <= 0) {
        throw new BusinessException('Expense amount must be greater than zero');
      }
      this.#amount = props.amount;
    }
    if (props.expenseDate !== undefined) {
      this.#expenseDate = props.expenseDate;
    }
    if (props.receiptUrl !== undefined) {
      this.#receiptUrl = props.receiptUrl;
    }
    if (props.expenseItems !== undefined) {
      this.#expenseItems = props.expenseItems;
      // Recalculate final amount
      this.#finalAmount = props.expenseItems.length > 0
        ? props.expenseItems.reduce((sum, item) => sum + item.amount, 0)
        : this.#amount;
    }
    if (props.remarks !== undefined) {
      this.#remarks = props.remarks;
    }
    this.touch();
  }

  // Getters
  get name(): string { return this.#name; }
  get category(): ExpenseCategory { return this.#category; }
  get amount(): number { return this.#amount; }
  get currency(): string { return this.#currency; }
  get status(): ExpenseStatus { return this.#status; }
  get description(): string { return this.#description; }
  get referenceId(): string | undefined { return this.#referenceId; }
  get referenceType(): string | undefined { return this.#referenceType; }
  get requestedBy(): string { return this.#requestedBy; }
  get approvedBy(): string | undefined { return this.#approvedBy; }
  get finalizedBy(): string | undefined { return this.#finalizedBy; }
  get settledBy(): string | undefined { return this.#settledBy; }
  get rejectedBy(): string | undefined { return this.#rejectedBy; }
  get accountId(): string | undefined { return this.#accountId; }
  get transactionId(): string | undefined { return this.#transactionId; }
  get receiptUrl(): string | undefined { return this.#receiptUrl; }
  get expenseDate(): Date { return this.#expenseDate; }
  get approvedDate(): Date | undefined { return this.#approvedDate; }
  get finalizedDate(): Date | undefined { return this.#finalizedDate; }
  get settledDate(): Date | undefined { return this.#settledDate; }
  get rejectedDate(): Date | undefined { return this.#rejectedDate; }
  get paidDate(): Date | undefined { return this.#paidDate; }
  get expenseItems(): ExpenseItem[] { return [...this.#expenseItems]; }
  get finalAmount(): number { return this.#finalAmount; }
  get txnNumber(): string | undefined { return this.#txnNumber; }
  get remarks(): string | undefined { return this.#remarks; }
  get isAdmin(): boolean { return this.#isAdmin; }
  get isDelegated(): boolean { return this.#isDelegated; }

  /**
   * Check if expense needs approval
   */
  needsApproval(): boolean {
    return this.#status === ExpenseStatus.SUBMITTED;
  }

  /**
   * Check if expense is payable
   */
  isPayable(): boolean {
    return this.#status === ExpenseStatus.FINALIZED;
  }

  /**
   * Check if expense can be updated
   */
  canBeUpdated(): boolean {
    return this.#status === ExpenseStatus.DRAFT;
  }
}
