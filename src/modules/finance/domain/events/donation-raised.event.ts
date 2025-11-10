import { DomainEvent } from 'src/shared/models/domain-event';
import { DonationType } from '../model/donation.model';

export class DonationRaisedEvent extends DomainEvent {
  constructor(
    public readonly donationId: string,
    public readonly donationType: DonationType,
    public readonly amount: number,
    public readonly donorReference: string, // userId or email
  ) {
    super(donationId);
  }
}
