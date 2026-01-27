import { DomainEvent } from '../../../../shared/models/domain-event';

export class WorkflowFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly reason: string,
  ) {
    super(aggregateId);
  }
}

