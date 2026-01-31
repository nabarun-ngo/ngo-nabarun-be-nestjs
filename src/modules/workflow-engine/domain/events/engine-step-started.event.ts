import { DomainEvent } from '../../../../shared/models/domain-event';

export class EngineStepStartedEvent extends DomainEvent {
  constructor(
    public readonly instanceId: string,
    public readonly stepId: string,
  ) {
    super(instanceId);
  }
}
