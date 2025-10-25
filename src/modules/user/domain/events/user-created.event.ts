import { DomainEvent } from '../../../../shared/domain/domain-event';
import { User } from '../model/user.model';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly user: User,
  ) {
    super(aggregateId);
  }
}