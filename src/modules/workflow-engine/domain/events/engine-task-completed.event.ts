import { DomainEvent } from '../../../../shared/models/domain-event';

export class EngineTaskCompletedEvent extends DomainEvent {
  constructor(
    public readonly instanceId: string,
    public readonly stepId: string,
    public readonly taskId: string,
  ) {
    super(instanceId);
  }
}
