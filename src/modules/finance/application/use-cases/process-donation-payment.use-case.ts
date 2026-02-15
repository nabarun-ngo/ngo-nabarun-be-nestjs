import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Donation } from '../../domain/model/donation.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProcessDonationPaymentDto } from '../dto/donation.dto';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { PaymentMethod } from '../../domain/model/donation.model';
import { AccountType, AccountStatus } from '../../domain/model/account.model';

@Injectable()
export class ProcessDonationPaymentUseCase implements IUseCase<ProcessDonationPaymentDto, Donation> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
  ) {}

  async execute(request: ProcessDonationPaymentDto): Promise<Donation> {
    const donation = await this.donationRepository.findById(request.donationId);
    if (!donation) {
      throw new BusinessException(`Donation not found with id: ${request.donationId}`);
    }

    if (!donation.canBePaid()) {
      throw new BusinessException(`Donation cannot be paid in current status: ${donation.status}`);
    }

    const paidToAccountId = typeof request.accountId === 'string' ? request.accountId : (request.accountId as any)?.id;
    if (!paidToAccountId) {
      throw new BusinessException('Account (paidToAccountId) is required to process payment');
    }

    const account = await this.accountRepository.findById(paidToAccountId);
    if (!account) {
      throw new BusinessException(`Account not found with id: ${paidToAccountId}`);
    }
    if (!account.isActive()) {
      throw new BusinessException('Cannot process payment to inactive account');
    }

    const paidOn = request.paidOn ?? new Date();
    const amount = Number(donation.amount);
    const currency = donation.currency ?? 'INR';

    // Get donation income account (PRINCIPAL account)
    const donationIncomeAccounts = await this.accountRepository.findAll({
      type: [AccountType.PRINCIPAL],
      status: [AccountStatus.ACTIVE],
    });
    
    if (donationIncomeAccounts.length === 0) {
      throw new BusinessException('No active PRINCIPAL account found for donation income. Please create a PRINCIPAL account first.');
    }
    
    const donationIncomeAccount = donationIncomeAccounts[0];

    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate: paidOn,
      description: `Donation payment: ${donation.id}`,
      referenceType: JournalEntryReferenceType.DONATION,
      referenceId: donation.id,
      postedById: (request.confirmedBy as any)?.id ?? 'system',
      lines: [
        {
          accountId: paidToAccountId,
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

    donation.markAsPaid({
      paidToAccountId,
      paymentMethod: request.paymentMethod ?? PaymentMethod.CASH,
      paidUsingUPI: request.paidUsingUPI,
      confirmedById: (request.confirmedBy as any)?.id,
      paidDate: paidOn,
    });
    donation.linkTransaction(journalEntry.id);

    if (request.isPaymentNotified) {
      donation.markPaymentNotified();
    }

    const updatedDonation = await this.donationRepository.update(donation.id, donation);

    for (const event of updatedDonation.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    updatedDonation.clearEvents();

    return updatedDonation;
  }
}
