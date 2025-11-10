import { DomainEvent } from '../../../../shared/models/domain-event';
import { TaskAssignment } from '../model/task-assignment.model';

export class TaskAssignmentCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly taskId: string,
    public readonly assignment: TaskAssignment,
  ) {
    super(aggregateId);
  }
}

