import { DomainEvent } from '../../../../shared/models/domain-event';
import { WorkflowStep } from '../model/workflow-step.model';

export class StepStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly instanceId: string,
    public readonly stepId: string,
  ) {
    super(aggregateId);
  }
}

