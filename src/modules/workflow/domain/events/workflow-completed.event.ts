import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowInstance } from '../model/workflow-instance.model';

export class WorkflowCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
  ) {
    super(aggregateId);
  }
}

