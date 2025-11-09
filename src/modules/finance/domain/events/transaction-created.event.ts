import { DomainEvent } from 'src/shared/models/domain-event';
import { TransactionType } from '../model/transaction.model';

export class TransactionCreatedEvent extends DomainEvent {
  constructor(
    public readonly transactionId: string,
    public readonly transactionType: TransactionType,
    public readonly amount: number,
    public readonly accountId: string,
  ) {
    super(transactionId);
  }
}
