import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetExpenseUseCase implements IUseCase<string, Expense> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(id: string): Promise<Expense> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new BusinessException(`Expense not found with id: ${id}`);
    }
    return expense;
  }
}


