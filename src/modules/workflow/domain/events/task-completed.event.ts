import { DomainEvent } from '../../../../shared/models/domain-event';

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly stepId: string,
    public readonly taskId: string,
  ) {
    super(aggregateId);
  }
}

