import { DomainEvent } from '../../../../shared/models/domain-event';

export class EngineWorkflowCreatedEvent extends DomainEvent {
  constructor(public readonly instanceId: string, public readonly type: string) {
    super(instanceId);
  }
}
