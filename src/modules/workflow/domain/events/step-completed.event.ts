import { DomainEvent } from '../../../../shared/models/domain-event';

export class StepCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly stepId: string,
  ) {
    super(aggregateId);
  }
}

