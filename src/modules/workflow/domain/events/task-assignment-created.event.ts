import { DomainEvent } from '../../../../shared/models/domain-event';

export class TaskAssignmentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly taskId: string,
    public readonly assignmentId: string,
  ) {
    super(aggregateId);
  }
}

