import { RootEvent } from "./root-event";

export abstract class DomainEvent extends RootEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;

  constructor(aggregateId: string) {
    super();
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
  }
}