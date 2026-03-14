export class DomainEventPayload {
    aggregateId: string;
    eventName: string;
    occurredAt: Date;
    data: any;
}