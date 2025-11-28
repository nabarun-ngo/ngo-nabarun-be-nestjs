import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense, ExpenseItem } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateExpenseDto, ExpenseItemDetailDto } from '../dto/expense.dto';

@Injectable()
export class CreateExpenseUseCase implements IUseCase<CreateExpenseDto, Expense> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateExpenseDto): Promise<Expense> {
    let expenseItems: ExpenseItem[] = [];
    if (request.expenseItems && request.expenseItems.length > 0) {
      expenseItems = request.expenseItems.map(item => 
        new ExpenseItem(
          crypto.randomUUID(),
          item.itemName,
          item.description,
          item.amount,
        )
      );
    }

    const expense = Expense.create({
      name: request.name,
      category: request.category as any,
      amount: request.amount,
      currency: request.currency,
      description: request.description,
      requestedBy: '', // TODO: Get from auth context
      referenceId: request.expenseRefId,
      referenceType: request.expenseRefType as any,
      receiptUrl: request.receiptUrl,
      expenseDate: request.expenseDate,
      expenseItems,
    });

    const savedExpense = await this.expenseRepository.create(expense);

    // Emit domain events
    for (const event of savedExpense.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedExpense.clearEvents();

    return savedExpense;
  }
}


