import { BaseDomain } from "./base-domain";
import { RootEvent } from "./root-event";

export abstract class DomainEvent extends RootEvent {
  public readonly occurredAt: Date;
  public readonly aggregateId: string;
  public readonly domain: BaseDomain<any>;

  constructor(aggregateId: string, domain: BaseDomain<any>) {
    super();
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.domain = domain;
  }
}