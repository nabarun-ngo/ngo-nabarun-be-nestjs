import { DomainEvent } from '../../../../shared/models/domain-event';

export class EngineWorkflowCompletedEvent extends DomainEvent {
  constructor(public readonly instanceId: string) {
    super(instanceId);
  }
}
