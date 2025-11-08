import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowInstance } from '../model/workflow-instance.model';

export class WorkflowFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly instance: WorkflowInstance,
    public readonly reason: string,
  ) {
    super(aggregateId);
  }
}

