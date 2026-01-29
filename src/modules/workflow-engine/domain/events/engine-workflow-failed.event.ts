import { DomainEvent } from '../../../../shared/models/domain-event';

export class EngineWorkflowFailedEvent extends DomainEvent {
  constructor(public readonly instanceId: string, public readonly reason: string) {
    super(instanceId);
  }
}
