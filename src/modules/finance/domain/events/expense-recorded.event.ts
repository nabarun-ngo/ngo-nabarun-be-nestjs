import { DomainEvent } from 'src/shared/models/domain-event';

export class ExpenseRecordedEvent extends DomainEvent {
  constructor(
    public readonly expenseId: string,
    public readonly amount: number,
    public readonly requestedBy: string,
  ) {
    super(expenseId);
  }
}
