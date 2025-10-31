import { BaseDomain } from './base-domain';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> extends BaseDomain<T> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }
}
