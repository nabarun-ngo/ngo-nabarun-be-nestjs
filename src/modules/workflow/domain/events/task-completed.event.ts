import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowTask } from '../model/workflow-task.model';

export class TaskCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly instanceId: string,
    public readonly stepId: string,
    public readonly taskId: string,
  ) {
    super(aggregateId);
  }
}

