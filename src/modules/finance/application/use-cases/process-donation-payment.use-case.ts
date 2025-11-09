import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { Transaction } from '../../domain/model/transaction.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { ProcessDonationPaymentDto } from '../dto/donation.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class ProcessDonationPaymentUseCase implements IUseCase<ProcessDonationPaymentDto, void> {
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: ProcessDonationPaymentDto): Promise<void> {
    // Get donation
    const donation = await this.donationRepository.findById(request.donationId);
    if (!donation) {
      throw new BusinessException('Donation not found');
    }

    if (!donation.isPending()) {
      throw new BusinessException('Donation is not pending payment');
    }

    // Get account
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new BusinessException('Account not found');
    }

    // Create transaction
    const transaction = Transaction.createFromDonation({
      amount: donation.amount,
      currency: donation.currency,
      accountId: account.id,
      donationId: donation.id,
      description: `Donation payment from ${donation.donorName || donation.donorId || 'guest'}`,
      metadata: {
        donationType: donation.type,
        donorId: donation.donorId,
        donorEmail: donation.donorEmail,
      },
    });

    // Credit account
    account.credit(donation.amount);

    // Mark donation as paid
    donation.markAsPaid(transaction.id);

    // Save all changes
    await this.transactionRepository.create(transaction);
    await this.accountRepository.update(account.id, account);
    await this.donationRepository.update(donation.id, donation);

    // Emit domain events
    for (const event of [...donation.domainEvents, ...transaction.domainEvents, ...account.domainEvents]) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    
    donation.clearEvents();
    transaction.clearEvents();
    account.clearEvents();
  }
}
