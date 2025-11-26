import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Expense } from '../../domain/model/expense.model';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { ExpenseDetailFilterDto } from '../dto/expense.dto';

@Injectable()
export class ListExpensesUseCase implements IUseCase<BaseFilter<ExpenseDetailFilterDto>, PagedResult<Expense>> {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
  ) {}

  async execute(request: BaseFilter<ExpenseDetailFilterDto>): Promise<PagedResult<Expense>> {
    // TODO: Implement paged filtering in repository
    const allExpenses = await this.expenseRepository.findAll();
    
    let filtered = allExpenses;
    
    if (request.props?.expenseStatus && request.props.expenseStatus.length > 0) {
      filtered = filtered.filter(e => request.props?.expenseStatus?.includes(e.status));
    }
    if (request.props?.expenseRefId) {
      filtered = filtered.filter(e => e.referenceId === request.props?.expenseRefId);
    }
    if (request.props?.payerId) {
      filtered = filtered.filter(e => e.requestedBy === request.props?.payerId);
    }
    if (request.props?.expenseId) {
      filtered = filtered.filter(e => e.id === request.props?.expenseId);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}


