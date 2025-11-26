import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { AccountDetailDto, AccountDetailFilterDto, CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { AccountDtoMapper } from '../dto/finance-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../use-cases/update-account.use-case';
import { ListAccountsUseCase } from '../use-cases/list-accounts.use-case';
import { GetAccountUseCase } from '../use-cases/get-account.use-case';
import { TransactionDetailDto, TransactionDetailFilterDto } from '../dto/transaction.dto';
import { ListTransactionsUseCase } from '../use-cases/list-transactions.use-case';
import { CreateTransactionUseCase } from '../use-cases/create-transaction.use-case';
import { TransactionDtoMapper } from '../dto/finance-dto.mapper';
import { ExpenseDetailDto, ExpenseDetailFilterDto } from '../dto/expense.dto';
import { ExpenseDtoMapper } from '../dto/finance-dto.mapper';
import { ListExpensesUseCase } from '../use-cases/list-expenses.use-case';
import { CreateExpenseUseCase } from '../use-cases/create-expense.use-case';
import { UpdateExpenseUseCase } from '../use-cases/update-expense.use-case';
import { SettleExpenseUseCase } from '../use-cases/settle-expense.use-case';
import { FinalizeExpenseUseCase } from '../use-cases/finalize-expense.use-case';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly listAccountsUseCase: ListAccountsUseCase,
    private readonly getAccountUseCase: GetAccountUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listExpensesUseCase: ListExpensesUseCase,
    private readonly createExpenseUseCase: CreateExpenseUseCase,
    private readonly updateExpenseUseCase: UpdateExpenseUseCase,
    private readonly settleExpenseUseCase: SettleExpenseUseCase,
    private readonly finalizeExpenseUseCase: FinalizeExpenseUseCase,
  ) {}

  async list(filter: BaseFilter<AccountDetailFilterDto>): Promise<PagedResult<AccountDetailDto>> {
    const result = await this.listAccountsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(a => AccountDtoMapper.toDto(a)),
      result.total,
      result.page,
      result.size,
    );
  }

  async getById(id: string): Promise<AccountDetailDto> {
    const account = await this.getAccountUseCase.execute(id);
    return AccountDtoMapper.toDto(account);
  }

  async create(dto: CreateAccountDto): Promise<AccountDetailDto> {
    const account = await this.createAccountUseCase.execute(dto);
    return AccountDtoMapper.toDto(account);
  }

  async update(id: string, dto: UpdateAccountDto): Promise<AccountDetailDto> {
    const account = await this.updateAccountUseCase.execute({ id, dto });
    return AccountDtoMapper.toDto(account);
  }

  async createTransaction(accountId: string, dto: any): Promise<TransactionDetailDto> {
    const transaction = await this.createTransactionUseCase.execute({
      ...dto,
      accountId,
    });
    return TransactionDtoMapper.toDto(transaction);
  }

  async listTransactions(accountId: string, filter: BaseFilter<TransactionDetailFilterDto>): Promise<PagedResult<TransactionDetailDto>> {
    // Add accountId to filter
    const result = await this.listTransactionsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(t => TransactionDtoMapper.toDto(t)),
      result.total,
      result.page,
      result.size,
    );
  }

  async createExpense(dto: any): Promise<ExpenseDetailDto> {
    const expense = await this.createExpenseUseCase.execute(dto);
    return ExpenseDtoMapper.toDto(expense);
  }

  async updateExpense(id: string, dto: any): Promise<ExpenseDetailDto> {
    const expense = await this.updateExpenseUseCase.execute({ id, dto });
    return ExpenseDtoMapper.toDto(expense);
  }

  async settleExpense(id: string, accountId: string, settledBy: string): Promise<ExpenseDetailDto> {
    const expense = await this.settleExpenseUseCase.execute({ id, accountId, settledBy });
    return ExpenseDtoMapper.toDto(expense);
  }

  async finalizeExpense(id: string, finalizedBy: string): Promise<ExpenseDetailDto> {
    const expense = await this.finalizeExpenseUseCase.execute({ id, finalizedBy });
    return ExpenseDtoMapper.toDto(expense);
  }

  async listExpenses(filter: BaseFilter<ExpenseDetailFilterDto>): Promise<PagedResult<ExpenseDetailDto>> {
    const result = await this.listExpensesUseCase.execute(filter);
    return new PagedResult(
      result.items.map(e => ExpenseDtoMapper.toDto(e)),
      result.total,
      result.page,
      result.size,
    );
  }
}


