import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense, ExpenseItem } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { UpdateExpenseDto } from '../dto/expense.dto';

@Injectable()
export class UpdateExpenseUseCase implements IUseCase<{ id: string; dto: UpdateExpenseDto }, Expense> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
  ) { }

  async execute(request: { id: string; dto: UpdateExpenseDto }): Promise<Expense> {
    const expense = await this.expenseRepository.findById(request.id);
    if (!expense) {
      throw new BusinessException(`Expense not found with id: ${request.id}`);
    }

    let expenseItems: ExpenseItem[] | undefined;
    if (request.dto.expenseItems) {
      expenseItems = request.dto.expenseItems.map(item =>
        new ExpenseItem(
          item.id || crypto.randomUUID(),
          item.itemName,
          item.description,
          item.amount,
        )
      );
    }

    expense.update({
      name: request.dto.name,
      description: request.dto.description,
      amount: request.dto.amount,
      expenseDate: request.dto.expenseDate,
      receiptUrl: request.dto.receiptUrl,
      expenseItems,
    });

    const updatedExpense = await this.expenseRepository.update(request.id, expense);
    return updatedExpense;
  }
}


