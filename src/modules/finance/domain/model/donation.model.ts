import { AggregateRoot } from 'src/shared/models/aggregate-root';
import { DonationRaisedEvent } from '../events/donation-raised.event';
import { DonationPaidEvent } from '../events/donation-paid.event';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export enum DonationType {
  REGULAR = 'REGULAR',        // Monthly subscription for internal users
  ONETIME = 'ONETIME',        // One-time donation from guests or members
}

export enum DonationStatus {
  RAISED = 'RAISED',          // Raised but not yet paid
  PAID = 'PAID',              // Payment completed
  PENDING = 'PENDING',        // Pending payment
  PAYMENT_FAILED = 'PAYMENT_FAILED', // Payment failed
  PAY_LATER = 'PAY_LATER',    // Payment deferred to later
  CANCELLED = 'CANCELLED',    // Cancelled before payment
  UPDATE_MISTAKE = 'UPDATE_MISTAKE', // Update mistake status
}

export enum PaymentMethod {
  CASH = 'CASH',
  NETBANKING = 'NETBANKING',
  UPI = 'UPI',
}

export enum UPIPaymentType {
  GPAY = 'GPAY',
  PAYTM = 'PAYTM',
  PHONEPE = 'PHONEPE',
  BHARATPAY = 'BHARATPAY',
  UPI_OTH = 'UPI_OTH',
}

/**
 * Donation Domain Model (Aggregate Root)
 * Represents a financial donation - either regular (monthly) or one-time
 * All business logic and validations are in this domain model
 */
export class Donation extends AggregateRoot<string> {
  // Private fields for encapsulation
  #type: DonationType;
  #amount: number;
  #currency: string;
  #status: DonationStatus;
  #donorId: string | undefined;
  #donorName: string | undefined;
  #donorEmail: string | undefined;
  #description: string | undefined;
  #raisedDate: Date;
  #paidDate: Date | undefined;
  #transactionId: string | undefined;
  
  // Legacy fields
  #isGuest: boolean;
  #startDate: Date | undefined;
  #endDate: Date | undefined;
  #raisedOn: Date; // Legacy alias
  #paidOn: Date | undefined; // Legacy alias
  #confirmedBy: string | undefined;
  #confirmedOn: Date | undefined;
  #paymentMethod: PaymentMethod | undefined;
  #paidToAccountId: string | undefined;
  #forEventId: string | undefined;
  #paidUsingUPI: UPIPaymentType | undefined;
  #isPaymentNotified: boolean;
  #transactionRef: string | undefined; // Legacy alias
  #remarks: string | undefined;
  #cancelletionReason: string | undefined; // Legacy typo preserved
  #laterPaymentReason: string | undefined;
  #paymentFailureDetail: string | undefined;
  #additionalFields: Record<string, any> | undefined;

  constructor(
    id: string,
    type: DonationType,
    amount: number,
    currency: string,
    status: DonationStatus,
    donorId: string | undefined,
    donorName: string | undefined,
    donorEmail: string | undefined,
    description: string | undefined,
    raisedDate: Date,
    paidDate: Date | undefined,
    transactionId: string | undefined,
    isGuest: boolean = false,
    startDate?: Date,
    endDate?: Date,
    confirmedBy?: string,
    confirmedOn?: Date,
    paymentMethod?: PaymentMethod,
    paidToAccountId?: string,
    forEventId?: string,
    paidUsingUPI?: UPIPaymentType,
    isPaymentNotified: boolean = false,
    remarks?: string,
    cancelletionReason?: string,
    laterPaymentReason?: string,
    paymentFailureDetail?: string,
    additionalFields?: Record<string, any>,
    createdAt?: Date,
    updatedAt?: Date,
  ) {
    super(id, createdAt, updatedAt);
    
    this.#type = type;
    this.#amount = amount;
    this.#currency = currency;
    this.#status = status;
    this.#donorId = donorId;
    this.#donorName = donorName;
    this.#donorEmail = donorEmail;
    this.#description = description;
    this.#raisedDate = raisedDate;
    this.#paidDate = paidDate;
    this.#transactionId = transactionId;
    this.#isGuest = isGuest;
    this.#startDate = startDate;
    this.#endDate = endDate;
    this.#raisedOn = raisedDate; // Legacy alias
    this.#paidOn = paidDate; // Legacy alias
    this.#confirmedBy = confirmedBy;
    this.#confirmedOn = confirmedOn;
    this.#paymentMethod = paymentMethod;
    this.#paidToAccountId = paidToAccountId;
    this.#forEventId = forEventId;
    this.#paidUsingUPI = paidUsingUPI;
    this.#isPaymentNotified = isPaymentNotified;
    this.#transactionRef = transactionId; // Legacy alias
    this.#remarks = remarks;
    this.#cancelletionReason = cancelletionReason;
    this.#laterPaymentReason = laterPaymentReason;
    this.#paymentFailureDetail = paymentFailureDetail;
    this.#additionalFields = additionalFields;
  }

  /**
   * Factory method to create a new Regular Donation (for internal users)
   * Business validation: amount must be positive, donorId required
   */
  static createRegular(props: {
    amount: number;
    currency: string;
    donorId: string;
    description?: string;
    raisedDate?: Date;
    startDate?: Date;
    endDate?: Date;
  }): Donation {
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Donation amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    if (!props.donorId) {
      throw new BusinessException('Donor ID is required for regular donations');
    }

    const raisedDate = props.raisedDate || new Date();
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
      raisedDate,
      undefined,
      undefined,
      false, // isGuest
      props.startDate,
      props.endDate,
      undefined, // confirmedBy
      undefined, // confirmedOn
      undefined, // paymentMethod
      undefined, // paidToAccountId
      undefined, // forEventId
      undefined, // paidUsingUPI
      false, // isPaymentNotified
      undefined, // remarks
      undefined, // cancelletionReason
      undefined, // laterPaymentReason
      undefined, // paymentFailureDetail
      undefined, // additionalFields
      new Date(),
      new Date(),
    );
    
    donation.addDomainEvent(new DonationRaisedEvent(
      donation.id,
      donation.#type,
      donation.#amount,
      donation.#donorId!,
    ));
    
    return donation;
  }

  /**
   * Factory method to create a new One-Time Donation (for guests or members)
   * Business validation: amount must be positive, guest donations require name and email
   */
  static createOneTime(props: {
    amount: number;
    currency: string;
    donorId?: string;      // Optional for internal members
    donorName?: string;    // Required for guests
    donorEmail?: string;   // Required for guests
    description?: string;
  }): Donation {
    if (!props.amount || props.amount <= 0) {
      throw new BusinessException('Donation amount must be greater than zero');
    }
    if (!props.currency) {
      throw new BusinessException('Currency is required');
    }
    
    const isGuest = !props.donorId;
    if (isGuest && (!props.donorName || !props.donorEmail)) {
      throw new BusinessException('Guest donations require donor name and email');
    }

    const raisedDate = new Date();
    const donation = new Donation(
      crypto.randomUUID(),
      DonationType.ONETIME,
      props.amount,
      props.currency,
      DonationStatus.RAISED,
      props.donorId,
      props.donorName,
      props.donorEmail,
      props.description,
      raisedDate,
      undefined,
      undefined,
      isGuest,
      undefined, // startDate (not applicable for one-time)
      undefined, // endDate (not applicable for one-time)
      undefined, // confirmedBy
      undefined, // confirmedOn
      undefined, // paymentMethod
      undefined, // paidToAccountId
      undefined, // forEventId
      undefined, // paidUsingUPI
      false, // isPaymentNotified
      undefined, // remarks
      undefined, // cancelletionReason
      undefined, // laterPaymentReason
      undefined, // paymentFailureDetail
      undefined, // additionalFields
      new Date(),
      new Date(),
    );
    
    donation.addDomainEvent(new DonationRaisedEvent(
      donation.id,
      donation.#type,
      donation.#amount,
      props.donorId || props.donorEmail!,
    ));
    
    return donation;
  }

  /**
   * Mark donation as paid and link to transaction
   * Business validation: Cannot pay if already paid or cancelled
   */
  markAsPaid(props: {
    transactionId: string;
    accountId?: string;
    paymentMethod?: PaymentMethod;
    paidUsingUPI?: UPIPaymentType;
    confirmedBy?: string;
  }): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Donation is already paid');
    }
    
    if (this.#status === DonationStatus.CANCELLED) {
      throw new BusinessException('Cannot pay a cancelled donation');
    }

    if (this.#status === DonationStatus.UPDATE_MISTAKE) {
      throw new BusinessException('Cannot pay a donation marked for update');
    }

    this.#status = DonationStatus.PAID;
    this.#paidDate = new Date();
    this.#paidOn = new Date(); // Legacy alias
    this.#transactionId = props.transactionId;
    this.#transactionRef = props.transactionId; // Legacy alias
    
    if (props.accountId) {
      this.#paidToAccountId = props.accountId;
    }
    if (props.paymentMethod) {
      this.#paymentMethod = props.paymentMethod;
    }
    if (props.paidUsingUPI) {
      this.#paidUsingUPI = props.paidUsingUPI;
    }
    if (props.confirmedBy) {
      this.#confirmedBy = props.confirmedBy;
      this.#confirmedOn = new Date();
    }

    this.touch();

    this.addDomainEvent(new DonationPaidEvent(
      this.id,
      this.#amount,
      props.transactionId,
      this.#donorId,
    ));
  }

  /**
   * Cancel donation before payment
   * Business validation: Cannot cancel if already paid
   */
  cancel(reason?: string): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Cannot cancel a paid donation');
    }
    
    if (this.#status === DonationStatus.CANCELLED) {
      throw new BusinessException('Donation is already cancelled');
    }

    this.#status = DonationStatus.CANCELLED;
    if (reason) {
      this.#cancelletionReason = reason;
    }
    this.touch();
  }

  /**
   * Mark payment as failed
   * Business validation: Cannot mark paid donation as failed
   */
  markAsFailed(failureDetail?: string): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Cannot mark paid donation as failed');
    }

    this.#status = DonationStatus.PAYMENT_FAILED;
    if (failureDetail) {
      this.#paymentFailureDetail = failureDetail;
    }
    this.touch();
  }

  /**
   * Mark as pending payment
   */
  markAsPending(): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Cannot mark paid donation as pending');
    }
    this.#status = DonationStatus.PENDING;
    this.touch();
  }

  /**
   * Mark as pay later with reason
   */
  markAsPayLater(reason: string): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Cannot mark paid donation as pay later');
    }
    this.#status = DonationStatus.PAY_LATER;
    this.#laterPaymentReason = reason;
    this.touch();
  }

  /**
   * Mark for update mistake
   */
  markForUpdateMistake(): void {
    if (this.#status === DonationStatus.PAID) {
      throw new BusinessException('Cannot mark paid donation for update');
    }
    this.#status = DonationStatus.UPDATE_MISTAKE;
    this.touch();
  }

  /**
   * Update donation details
   * Business validation: Cannot update paid donations (except through specific flows)
   */
  update(props: {
    amount?: number;
    description?: string;
    remarks?: string;
    startDate?: Date;
    endDate?: Date;
    forEventId?: string;
    additionalFields?: Record<string, any>;
  }): void {
    if (this.#status === DonationStatus.PAID && props.amount) {
      throw new BusinessException('Cannot change amount of paid donation');
    }

    if (props.amount && props.amount <= 0) {
      throw new BusinessException('Donation amount must be greater than zero');
    }

    if (props.amount) {
      this.#amount = props.amount;
    }
    if (props.description !== undefined) {
      this.#description = props.description;
    }
    if (props.remarks !== undefined) {
      this.#remarks = props.remarks;
    }
    if (props.startDate !== undefined) {
      this.#startDate = props.startDate;
    }
    if (props.endDate !== undefined) {
      this.#endDate = props.endDate;
    }
    if (props.forEventId !== undefined) {
      this.#forEventId = props.forEventId;
    }
    if (props.additionalFields !== undefined) {
      this.#additionalFields = props.additionalFields;
    }
    this.touch();
  }

  /**
   * Confirm donation
   */
  confirm(confirmedBy: string): void {
    this.#confirmedBy = confirmedBy;
    this.#confirmedOn = new Date();
    this.touch();
  }

  /**
   * Mark payment notification as sent
   */
  markPaymentNotified(): void {
    this.#isPaymentNotified = true;
    this.touch();
  }

  // Getters
  get type(): DonationType { return this.#type; }
  get amount(): number { return this.#amount; }
  get currency(): string { return this.#currency; }
  get status(): DonationStatus { return this.#status; }
  get donorId(): string | undefined { return this.#donorId; }
  get donorName(): string | undefined { return this.#donorName; }
  get donorEmail(): string | undefined { return this.#donorEmail; }
  get description(): string | undefined { return this.#description; }
  get raisedDate(): Date { return this.#raisedDate; }
  get paidDate(): Date | undefined { return this.#paidDate; }
  get transactionId(): string | undefined { return this.#transactionId; }
  get isGuest(): boolean { return this.#isGuest; }
  get startDate(): Date | undefined { return this.#startDate; }
  get endDate(): Date | undefined { return this.#endDate; }
  get raisedOn(): Date { return this.#raisedOn; }
  get paidOn(): Date | undefined { return this.#paidOn; }
  get confirmedBy(): string | undefined { return this.#confirmedBy; }
  get confirmedOn(): Date | undefined { return this.#confirmedOn; }
  get paymentMethod(): PaymentMethod | undefined { return this.#paymentMethod; }
  get paidToAccountId(): string | undefined { return this.#paidToAccountId; }
  get forEventId(): string | undefined { return this.#forEventId; }
  get paidUsingUPI(): UPIPaymentType | undefined { return this.#paidUsingUPI; }
  get isPaymentNotified(): boolean { return this.#isPaymentNotified; }
  get transactionRef(): string | undefined { return this.#transactionRef; }
  get remarks(): string | undefined { return this.#remarks; }
  get cancelletionReason(): string | undefined { return this.#cancelletionReason; }
  get laterPaymentReason(): string | undefined { return this.#laterPaymentReason; }
  get paymentFailureDetail(): string | undefined { return this.#paymentFailureDetail; }
  get additionalFields(): Record<string, any> | undefined { return this.#additionalFields; }

  /**
   * Check if donation is from a guest (not an internal user)
   */
  isGuestDonation(): boolean {
    return this.#isGuest || !this.#donorId;
  }

  /**
   * Check if donation is pending payment
   */
  isPending(): boolean {
    return this.#status === DonationStatus.RAISED || this.#status === DonationStatus.PENDING;
  }

  /**
   * Check if donation can be paid
   */
  canBePaid(): boolean {
    return this.#status === DonationStatus.RAISED || 
           this.#status === DonationStatus.PENDING ||
           this.#status === DonationStatus.PAY_LATER;
  }
}
