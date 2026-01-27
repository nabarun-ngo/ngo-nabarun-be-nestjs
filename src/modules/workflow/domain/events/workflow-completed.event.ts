import { DomainEvent } from '../../../../shared/models/domain-event';

export class WorkflowCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
  ) {
    super(aggregateId);
  }
}

