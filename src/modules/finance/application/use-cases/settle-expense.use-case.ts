import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { Transaction } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class SettleExpenseUseCase implements IUseCase<{ id: string; accountId: string; settledBy: string }, Expense> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: { id: string; accountId: string; settledBy: string }): Promise<Expense> {
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

    if (!account.hasSufficientFunds(expense.finalAmount)) {
      throw new BusinessException('Insufficient account balance');
    }

    // Create transaction
    const transaction = Transaction.createOut({
      amount: expense.finalAmount,
      currency: expense.currency,
      accountId: request.accountId,
      description: `Expense settlement: ${expense.name}`,
      referenceId: expense.id,
      referenceType: 'EXPENSE' as any,
    });

    // Debit account
    account.debit(expense.finalAmount);
    await this.accountRepository.update(account.id, account);

    // Save transaction
    const savedTransaction = await this.transactionRepository.create(transaction);

    // Settle expense
    expense.settle({
      settledBy: request.settledBy,
      accountId: request.accountId,
      transactionId: savedTransaction.id,
    });

    const updatedExpense = await this.expenseRepository.update(expense.id, expense);

    // Emit domain events
    for (const event of updatedExpense.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    updatedExpense.clearEvents();

    return updatedExpense;
  }
}


