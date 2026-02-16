import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowTask } from '../../domain/model/workflow-task.model';

export class TaskAssignmentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly task: WorkflowTask,
  ) {
    super(aggregateId);
  }
}

