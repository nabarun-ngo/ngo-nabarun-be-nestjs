import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { ExpenseRecordedEvent } from '../events/expense-recorded.event';


export enum ExpenseCategory {
  PROJECT = 'PROJECT',        // Expenses on projects
  EVENT = 'EVENT',            // Expenses on events
  ADHOC = 'ADHOC',            // Ad-hoc expenses
  OPERATIONAL = 'OPERATIONAL', // Operational expenses
  ADMINISTRATIVE = 'ADMINISTRATIVE', // Administrative expenses
}

export enum ExpenseStatus {
  PENDING = 'PENDING',        // Awaiting approval
  APPROVED = 'APPROVED',      // Approved, awaiting payment
  PAID = 'PAID',              // Payment completed
  REJECTED = 'REJECTED',      // Rejected
}

/**
 * Expense Domain Model (Aggregate Root)
 * Represents an expense in the system
 */
export class Expense extends AggregateRoot<string> {
  constructor(
    id: string,
    public readonly category: ExpenseCategory,
    public amount: number,
    public currency: string,
    public status: ExpenseStatus,
    public description: string,
    public referenceId: string | undefined,      // Project ID, Event ID, etc.
    public referenceType: string | undefined,    // 'Project', 'Event', etc.
    public requestedBy: string,                  // User ID who requested
    public approvedBy: string | undefined,       // User ID who approved
    public accountId: string | undefined,        // Account from which paid
    public transactionId: string | undefined,    // Transaction ID after payment
    public receiptUrl: string | undefined,       // URL to receipt/invoice
    public expenseDate: Date,
    public approvedDate: Date | undefined,
    public paidDate: Date | undefined,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  /**
   * Factory method to create a new Expense
   */
  static create(props: {
    category: ExpenseCategory;
    amount: number;
    currency: string;
    description: string;
    requestedBy: string;
    referenceId?: string;
    referenceType?: string;
    receiptUrl?: string;
    expenseDate?: Date;
  }): Expense {
    const expense = new Expense(
      crypto.randomUUID(),
      props.category,
      props.amount,
      props.currency,
      ExpenseStatus.PENDING,
      props.description,
      props.referenceId,
      props.referenceType,
      props.requestedBy,
      undefined,
      undefined,
      undefined,
      props.receiptUrl,
      props.expenseDate || new Date(),
      undefined,
      undefined,
      new Date(),
      new Date(),
    );

    expense.addDomainEvent(new ExpenseRecordedEvent(
      expense.id,
      expense.category,
      expense.amount,
      expense.requestedBy,
    ));

    return expense;
  }

  /**
   * Approve expense
   */
  approve(approvedBy: string): void {
    if (this.status !== ExpenseStatus.PENDING) {
      throw new Error('Can only approve pending expenses');
    }

    this.status = ExpenseStatus.APPROVED;
    this.approvedBy = approvedBy;
    this.approvedDate = new Date();
  }

  /**
   * Reject expense
   */
  reject(): void {
    if (this.status !== ExpenseStatus.PENDING) {
      throw new Error('Can only reject pending expenses');
    }

    this.status = ExpenseStatus.REJECTED;
  }

  /**
   * Mark expense as paid
   */
  markAsPaid(accountId: string, transactionId: string): void {
    if (this.status !== ExpenseStatus.APPROVED) {
      throw new Error('Can only pay approved expenses');
    }

    this.status = ExpenseStatus.PAID;
    this.accountId = accountId;
    this.transactionId = transactionId;
    this.paidDate = new Date();
  }

  /**
   * Check if expense needs approval
   */
  needsApproval(): boolean {
    return this.status === ExpenseStatus.PENDING;
  }

  /**
   * Check if expense is payable
   */
  isPayable(): boolean {
    return this.status === ExpenseStatus.APPROVED;
  }
}
