import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation, DonationStatus, PaymentMethod, UPIPaymentType } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { ReverseJournalEntryUseCase } from './reverse-journal-entry.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { AccountType, AccountStatus } from '../../domain/model/account.model';

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
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
    private readonly reverseJournalEntryUseCase: ReverseJournalEntryUseCase,
    private readonly eventEmitter: EventEmitter2,
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
          if (donation.transactionRef) {
            await this.reverseJournalEntryUseCase.execute({
              journalEntryId: donation.transactionRef,
              postedById: request.confirmedById ?? 'system',
              description: request.remarks ?? 'Update mistake',
            });
          }
          break;
        case DonationStatus.PENDING:
          donation.markAsPending();
          break;
        case DonationStatus.PAID:
          if (!request.paidToAccountId) {
            throw new BusinessException('paidToAccountId is required when marking donation as paid');
          }
          donation.markAsPaid({
            paidToAccountId: request.paidToAccountId,
            paymentMethod: request.paymentMethod!,
            paidUsingUPI: request.paidUsingUPI,
            confirmedById: request.confirmedById,
            paidDate: request.paidOn!,
          });
          
          // Get donation income account (PRINCIPAL account)
          const donationIncomeAccounts = await this.accountRepository.findAll({
            type: [AccountType.PRINCIPAL],
            status: [AccountStatus.ACTIVE],
          });
          
          if (donationIncomeAccounts.length === 0) {
            throw new BusinessException('No active PRINCIPAL account found for donation income. Please create a PRINCIPAL account first.');
          }
          
          const donationIncomeAccount = donationIncomeAccounts[0];
          const amount = Number(donation.amount);
          const currency = donation.currency ?? 'INR';
          
          const journalEntry = await this.postToLedgerUseCase.execute({
            entryDate: request.paidOn ?? new Date(),
            description: `Donation payment: ${donation.id}`,
            referenceType: JournalEntryReferenceType.DONATION,
            referenceId: donation.id,
            postedById: request.confirmedById ?? 'system',
            lines: [
              {
                accountId: request.paidToAccountId,
                debitAmount: 0,
                creditAmount: amount,
                currency,
                particulars: request.remarks ?? `Donation ${donation.id}`,
              },
              {
                accountId: donationIncomeAccount.id,
                debitAmount: amount,
                creditAmount: 0,
                currency,
                particulars: request.remarks ?? `Donation income ${donation.id}`,
              },
            ],
          });
          donation.linkTransaction(journalEntry.id);
          break;
        default:
          break;
      }
    }

    const updatedDonation = await this.donationRepository.update(request.id, donation);
    for (const event of donation.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    donation.clearEvents();
    return updatedDonation;
  }
}
