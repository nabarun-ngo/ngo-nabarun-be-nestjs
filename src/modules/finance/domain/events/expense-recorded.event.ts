import { DomainEvent } from 'src/shared/models/domain-event';
import { ExpenseCategory } from '../model/expense.model';

export class ExpenseRecordedEvent extends DomainEvent {
  constructor(
    public readonly expenseId: string,
    public readonly category: ExpenseCategory,
    public readonly amount: number,
    public readonly requestedBy: string,
  ) {
    super(expenseId);
  }
}
