import { Inject, Injectable } from '@nestjs/common';
import { EXPENSE_REPOSITORY } from '../../domain/repositories/expense.repository.interface';
import type { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { ExpenseDetailDto, ExpenseDetailFilterDto, CreateExpenseDto, UpdateExpenseDto } from '../dto/expense.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateExpenseUseCase } from '../use-cases/create-expense.use-case';
import { UpdateExpenseUseCase } from '../use-cases/update-expense.use-case';
import { SettleExpenseUseCase } from '../use-cases/settle-expense.use-case';
import { FinalizeExpenseUseCase } from '../use-cases/finalize-expense.use-case';
import { ExpenseDtoMapper } from '../dto/mapper/expense-dto.mapper';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@Injectable()
export class ExpenseService {
  constructor(
    @Inject(EXPENSE_REPOSITORY)
    private readonly expenseRepository: IExpenseRepository,
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly settleExpenseUseCase: SettleExpenseUseCase,
    private readonly finalizeExpenseUseCase: FinalizeExpenseUseCase,
  ) { }

  async list(filter: BaseFilter<ExpenseDetailFilterDto>): Promise<PagedResult<ExpenseDetailDto>> {
    const result = await this.expenseRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: filter.props,
    });
    return new PagedResult(
      result.items.map(e => ExpenseDtoMapper.toDto(e)),
      result.total,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<ExpenseDetailDto> {
    const expense = await this.expenseRepository.findById(id);
    if (!expense) {
      throw new BusinessException('Expense not found with id: ' + id);
    }
    return ExpenseDtoMapper.toDto(expense);
  }

  async create(dto: CreateExpenseDto): Promise<ExpenseDetailDto> {
    const expense = await this.createExpenseUseCase.execute(dto);
    return ExpenseDtoMapper.toDto(expense);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<ExpenseDetailDto> {
    const expense = await this.updateExpenseUseCase.execute({ id, dto });
    return ExpenseDtoMapper.toDto(expense);
  }

  async settle(id: string, accountId: string, settledBy: string): Promise<ExpenseDetailDto> {
    const expense = await this.settleExpenseUseCase.execute({ id, accountId, settledBy });
    return ExpenseDtoMapper.toDto(expense);
  }

  async finalize(id: string, finalizedBy: string): Promise<ExpenseDetailDto> {
    const expense = await this.finalizeExpenseUseCase.execute({ id, finalizedBy });
    return ExpenseDtoMapper.toDto(expense);
  }
}

