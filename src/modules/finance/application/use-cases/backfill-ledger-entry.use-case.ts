import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { JournalEntry } from '../../domain/model/journal-entry.model';
import { DONATION_REPOSITORY } from '../../domain/repositories/donation.repository.interface';
import type { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { DonationStatus } from '../../domain/model/donation.model';
import { ExpenseStatus } from '../../domain/model/expense.model';
import { AccountType, AccountStatus } from '../../domain/model/account.model';

export type BackfillEntityType = 'DONATION' | 'EXPENSE';

export interface BackfillLedgerEntryRequest {
  entityType: BackfillEntityType;
  entityId: string;
  postedById: string;
  /** Optional; for donation defaults to paidOn, for expense to settledDate or now */
  entryDate?: Date;
  /** If true, allow creating a new journal entry even when entity already has one (and link it) */
  allowOverwrite?: boolean;
  /** Required for EXPENSE: the account to debit (expense/cost account) */
  expenseAccountId?: string;
  /** Required for EXPENSE: the account to credit (payment account). If omitted, uses expense.accountId when set. */
  paymentAccountId?: string;
}

export interface BackfillLedgerEntryResult {
  journalEntry: JournalEntry;
  entityType: BackfillEntityType;
  entityId: string;
  linked: boolean;
}

/**
 * Adds a journal entry and ledger lines for an existing donation (PAID) or expense (SETTLED)
 * that does not yet have a linked journal entry. Used for backfilling or data correction.
 */
@Injectable()
export class BackfillLedgerEntryUseCase
  implements IUseCase<BackfillLedgerEntryRequest, BackfillLedgerEntryResult>
{
  constructor(
    @Inject(DONATION_REPOSITORY)
    private readonly donationRepository: IDonationRepository,
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
  ) {}

  async execute(request: BackfillLedgerEntryRequest): Promise<BackfillLedgerEntryResult> {
    if (request.entityType === 'DONATION') {
      return this.backfillDonation(request);
    }
    if (request.entityType === 'EXPENSE') {
      return this.backfillExpense(request);
    }
    throw new BusinessException(`Unsupported entity type: ${request.entityType}`);
  }

  private async backfillDonation(request: BackfillLedgerEntryRequest): Promise<BackfillLedgerEntryResult> {
    const donation = await this.donationRepository.findById(request.entityId);
    if (!donation) {
      throw new BusinessException(`Donation not found: ${request.entityId}`);
    }
    if (donation.status !== DonationStatus.PAID) {
      throw new BusinessException(
        `Donation must be PAID to backfill ledger. Current status: ${donation.status}`,
      );
    }

    const paidToAccountId = donation.paidToAccount?.id;
    if (!paidToAccountId) {
      throw new BusinessException(
        'Donation has no paid-to account. Set paidToAccountId before backfilling.',
      );
    }

    if (donation.transactionRef && !request.allowOverwrite) {
      throw new BusinessException(
        `Donation already has a linked journal entry (${donation.transactionRef}). Use allowOverwrite to add another.`,
      );
    }

    const account = await this.accountRepository.findById(paidToAccountId);
    if (!account) {
      throw new BusinessException(`Account not found: ${paidToAccountId}`);
    }
    if (!account.isActive()) {
      throw new BusinessException('Cannot post to inactive account');
    }

    const amount = Number(donation.amount);
    const currency = donation.currency ?? 'INR';
    const entryDate = request.entryDate ?? donation.paidOn ?? new Date();

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
      entryDate,
      description: `Donation payment (backfill): ${donation.id}`,
      referenceType: JournalEntryReferenceType.DONATION,
      referenceId: donation.id,
      postedById: request.postedById,
      lines: [
        {
          accountId: paidToAccountId,
          debitAmount: 0,
          creditAmount: amount,
          currency,
          particulars: `Donation ${donation.id}`,
        },
        {
          accountId: donationIncomeAccount.id,
          debitAmount: amount,
          creditAmount: 0,
          currency,
          particulars: `Donation income ${donation.id}`,
        },
      ],
    });

    donation.linkTransaction(journalEntry.id);
    await this.donationRepository.update(donation.id, donation);

    return {
      journalEntry,
      entityType: 'DONATION',
      entityId: donation.id,
      linked: true,
    };
  }

  private async backfillExpense(request: BackfillLedgerEntryRequest): Promise<BackfillLedgerEntryResult> {
    const expense = await this.expenseRepository.findById(request.entityId);
    if (!expense) {
      throw new BusinessException(`Expense not found: ${request.entityId}`);
    }
    if (expense.status !== ExpenseStatus.SETTLED) {
      throw new BusinessException(
        `Expense must be SETTLED to backfill ledger. Current status: ${expense.status}`,
      );
    }

    if (expense.transactionId && !request.allowOverwrite) {
      throw new BusinessException(
        `Expense already has a linked journal entry (${expense.transactionId}). Use allowOverwrite to add another.`,
      );
    }

    const expenseAccountId = request.expenseAccountId;
    const paymentAccountId = request.paymentAccountId ?? expense.accountId;
    if (!expenseAccountId || !paymentAccountId) {
      throw new BusinessException(
        'For expense backfill, provide expenseAccountId (debit) and paymentAccountId (credit, or set on expense).',
      );
    }
    if (expenseAccountId === paymentAccountId) {
      throw new BusinessException('Expense account and payment account must be different');
    }

    const [expenseAccount, paymentAccount] = await Promise.all([
      this.accountRepository.findById(expenseAccountId),
      this.accountRepository.findById(paymentAccountId),
    ]);
    if (!expenseAccount) {
      throw new BusinessException(`Expense account not found: ${expenseAccountId}`);
    }
    if (!paymentAccount) {
      throw new BusinessException(`Payment account not found: ${paymentAccountId}`);
    }
    if (!expenseAccount.isActive() || !paymentAccount.isActive()) {
      throw new BusinessException('Both accounts must be active');
    }

    const amount = expense.amount;
    const currency = expense.currency ?? 'INR';
    const entryDate = request.entryDate ?? expense.settledDate ?? new Date();

    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate,
      description: `Expense settlement (backfill): ${expense.name}`,
      referenceType: JournalEntryReferenceType.EXPENSE,
      referenceId: expense.id,
      postedById: request.postedById,
      lines: [
        {
          accountId: expenseAccountId,
          debitAmount: amount,
          creditAmount: 0,
          currency,
          particulars: 'Expense settlement (backfill)',
        },
        {
          accountId: paymentAccountId,
          debitAmount: 0,
          creditAmount: amount,
          currency,
          particulars: 'Expense settlement (backfill)',
        },
      ],
    });

    expense.linkTransaction(journalEntry.id);
    await this.expenseRepository.update(expense.id, expense);

    return {
      journalEntry,
      entityType: 'EXPENSE',
      entityId: expense.id,
      linked: true,
    };
  }
}
