import { DomainEvent } from 'src/shared/models/domain-event';

export class DonationPaidEvent extends DomainEvent {
  constructor(
    public readonly donationId: string,
    public readonly amount: number,
    public readonly donorId: string | undefined,
  ) {
    super(donationId);
  }
}
