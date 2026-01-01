import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation, DonationStatus, PaymentMethod, UPIPaymentType } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { CreateTransactionUseCase } from './create-transaction.use-case';
import { TransactionRefType, TransactionType } from '../../domain/model/transaction.model';
import { ReverseTransactionUseCase } from './reverse-transaction.use-case';

interface UpdateDonation {
  paidOn: Date | undefined;
  confirmedById?: string | undefined;
  paidUsingUPI?: UPIPaymentType | undefined;
  paymentMethod?: PaymentMethod;
  paidToAccountId?: string;
  status?: DonationStatus;
  forEvent?: string;
  remarks?: string;
  amount?: number;
  id: string;

}

@Injectable()
export class UpdateDonationUseCase implements IUseCase<UpdateDonation, Donation> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    private readonly transactionUseCase: CreateTransactionUseCase,
    private readonly reverseTransactionUseCase: ReverseTransactionUseCase,

  ) { }

  async execute(request: UpdateDonation): Promise<Donation> {
    const donation = await this.donationRepository.findById(request.id);
    if (!donation) {
      throw new BusinessException(`Donation not found with id: ${request.id}`);
    }
    donation.update({
      amount: request.amount,
      remarks: request.remarks,
      forEventId: request.forEvent,
    });

    // Update status if provided
    if (request.status) {
      switch (request.status) {
        case DonationStatus.CANCELLED:
          donation.cancel(request.remarks);
          break;
        case DonationStatus.PAYMENT_FAILED:
          donation.markAsFailed(request.remarks);
          break;
        case DonationStatus.PAY_LATER:
          donation.markAsPayLater(request.remarks!);
          break;
        case DonationStatus.UPDATE_MISTAKE:
          donation.markForUpdateMistake();
          await this.reverseTransactionUseCase.execute({
            accountId: donation.paidToAccount?.id!,
            reason: request.remarks || 'Update mistake',
            txnId: donation.transactionRef!,
          });
          break;
        case DonationStatus.PENDING:
          donation.markAsPending();
          break;
        case DonationStatus.PAID:
          donation.markAsPaid({
            paidToAccountId: request.paidToAccountId!,
            paymentMethod: request.paymentMethod!,
            paidUsingUPI: request.paidUsingUPI!,
            confirmedById: request.confirmedById!,
            paidDate: request.paidOn!,
          });

          const transaction = await this.transactionUseCase.execute({
            accountId: donation.paidToAccount?.id!,
            txnAmount: donation.amount!,
            currency: 'INR',
            txnDescription: `Donation amount for ${donation.id}, Payment method: ${request.paymentMethod}, Paid using UPI: ${request.paidUsingUPI}`,
            txnType: TransactionType.IN,
            txnDate: donation.paidOn,
            txnRefId: donation.id,
            txnRefType: TransactionRefType.DONATION,
            txnParticulars: `Donation amount for ${donation.id}`,
          })
          donation.linkTransaction(transaction.id)
          break;
        default:
          break;
      }

    }
    console.log(donation.toJson());
    return await this.donationRepository.update(request.id, donation);
  }
}


