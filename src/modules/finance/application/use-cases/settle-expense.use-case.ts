import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';

@Injectable()
export class SettleExpenseUseCase implements IUseCase<{ id: string; accountId: string; settledById: string }, Expense> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
  ) {}

  async execute(request: { id: string; accountId: string; settledById: string }): Promise<Expense> {
    const expense = await this.expenseRepository.findById(request.id);
    if (!expense) {
      throw new BusinessException(`Expense not found with id: ${request.id}`);
    }

    if (!expense.isPayable()) {
      throw new BusinessException(`Expense cannot be settled in current status: ${expense.status}`);
    }

    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new BusinessException(`Account not found with id: ${request.accountId}`);
    }

    if (!account.hasSufficientFunds(expense.amount)) {
      throw new BusinessException('Insufficient account balance');
    }

    const expenseAccountId = expense.accountId;
    if (!expenseAccountId) {
      throw new BusinessException('Expense account is required for settlement (set expense.accountId)');
    }

    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate: new Date(),
      description: `Expense settlement: ${expense.name}`,
      referenceType: JournalEntryReferenceType.EXPENSE,
      referenceId: expense.id,
      postedById: request.settledById,
      lines: [
        {
          accountId: expenseAccountId,
          debitAmount: expense.amount,
          creditAmount: 0,
          currency: expense.currency,
          particulars: 'Expense settlement',
        },
        {
          accountId: request.accountId,
          debitAmount: 0,
          creditAmount: expense.amount,
          currency: expense.currency,
          particulars: 'Expense settlement',
        },
      ],
    });

    expense.settle({
      settledBy: { id: request.settledById },
      accountId: request.accountId,
      transactionId: journalEntry.id,
    });

    const updatedExpense = await this.expenseRepository.update(expense.id, expense);

    for (const event of updatedExpense.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    updatedExpense.clearEvents();

    return updatedExpense;
  }
}
