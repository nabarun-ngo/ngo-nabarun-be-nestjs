import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowInstance } from '../model/workflow-instance.model';

export class WorkflowCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly instance: WorkflowInstance,
  ) {
    super(aggregateId);
  }
}

