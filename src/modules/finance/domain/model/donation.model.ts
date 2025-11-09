import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { DonationRaisedEvent } from '../events/donation-raised.event';
import { DonationPaidEvent } from '../events/donation-paid.event';

export enum DonationType {
  REGULAR = 'REGULAR',        // Monthly subscription for internal users
  ONE_TIME = 'ONE_TIME',      // One-time donation from guests or members
}

export enum DonationStatus {
  RAISED = 'RAISED',          // Raised but not yet paid
  PAID = 'PAID',              // Payment completed
  CANCELLED = 'CANCELLED',    // Cancelled before payment
  FAILED = 'FAILED',          // Payment failed
}

/**
 * Donation Domain Model (Aggregate Root)
 * Represents a financial donation - either regular (monthly) or one-time
 */
export class Donation extends AggregateRoot<string> {
  constructor(
    id: string,
    public readonly type: DonationType,
    public amount: number,
    public currency: string,
    public status: DonationStatus,
    public donorId: string | undefined,  // UserId for internal members, undefined for guests
    public donorName: string | undefined, // Name for guest donations
    public donorEmail: string | undefined, // Email for guest donations
    public description: string | undefined,
    public raisedDate: Date,
    public paidDate: Date | undefined,
    public transactionId: string | undefined, // Reference to transaction after payment
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
  }

  /**
   * Factory method to create a new Regular Donation (for internal users)
   */
  static createRegular(props: {
    amount: number;
    currency: string;
    donorId: string;
    description?: string;
    raisedDate?: Date;
  }): Donation {
    const donation = new Donation(
      crypto.randomUUID(),
      DonationType.REGULAR,
      props.amount,
      props.currency,
      DonationStatus.RAISED,
      props.donorId,
      undefined,
      undefined,
      props.description,
      props.raisedDate || new Date(),
      undefined,
      undefined,
      new Date(),
      new Date(),
    );
    
    donation.addDomainEvent(new DonationRaisedEvent(
      donation.id,
      donation.type,
      donation.amount,
      donation.donorId!,
    ));
    
    return donation;
  }

  /**
   * Factory method to create a new One-Time Donation (for guests or members)
   */
  static createOneTime(props: {
    amount: number;
    currency: string;
    donorId?: string;      // Optional for internal members
    donorName?: string;    // Required for guests
    donorEmail?: string;   // Required for guests
    description?: string;
  }): Donation {
    if (!props.donorId && (!props.donorName || !props.donorEmail)) {
      throw new Error('Guest donations require donor name and email');
    }

    const donation = new Donation(
      crypto.randomUUID(),
      DonationType.ONE_TIME,
      props.amount,
      props.currency,
      DonationStatus.RAISED,
      props.donorId,
      props.donorName,
      props.donorEmail,
      props.description,
      new Date(),
      undefined,
      undefined,
      new Date(),
      new Date(),
    );
    
    donation.addDomainEvent(new DonationRaisedEvent(
      donation.id,
      donation.type,
      donation.amount,
      props.donorId || props.donorEmail!,
    ));
    
    return donation;
  }

  /**
   * Mark donation as paid and link to transaction
   */
  markAsPaid(transactionId: string): void {
    if (this.status === DonationStatus.PAID) {
      throw new Error('Donation is already paid');
    }
    
    if (this.status === DonationStatus.CANCELLED) {
      throw new Error('Cannot pay a cancelled donation');
    }

    this.status = DonationStatus.PAID;
    this.paidDate = new Date();
    this.transactionId = transactionId;

    this.addDomainEvent(new DonationPaidEvent(
      this.id,
      this.amount,
      transactionId,
      this.donorId,
    ));
  }

  /**
   * Cancel donation before payment
   */
  cancel(): void {
    if (this.status === DonationStatus.PAID) {
      throw new Error('Cannot cancel a paid donation');
    }
    
    if (this.status === DonationStatus.CANCELLED) {
      throw new Error('Donation is already cancelled');
    }

    this.status = DonationStatus.CANCELLED;
  }

  /**
   * Mark payment as failed
   */
  markAsFailed(): void {
    if (this.status === DonationStatus.PAID) {
      throw new Error('Cannot mark paid donation as failed');
    }

    this.status = DonationStatus.FAILED;
  }

  /**
   * Check if donation is from a guest (not an internal user)
   */
  isGuestDonation(): boolean {
    return !this.donorId;
  }

  /**
   * Check if donation is pending payment
   */
  isPending(): boolean {
    return this.status === DonationStatus.RAISED;
  }
}
