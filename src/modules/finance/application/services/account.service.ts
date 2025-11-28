import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { AccountDetailDto, AccountDetailFilterDto, CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../use-cases/update-account.use-case';
import { TransactionDetailDto, TransactionDetailFilterDto } from '../dto/transaction.dto';
import { CreateTransactionUseCase } from '../use-cases/create-transaction.use-case';
import { AccountDtoMapper } from '../dto/mapper/account-dto.mapper';
import { TransactionDtoMapper } from '../dto/mapper/transaction-dto.mapper';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { type ITransactionRepository, TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly createTransactionUseCase: CreateTransactionUseCase,

  ) { }

  async list(filter: BaseFilter<AccountDetailFilterDto>, userId?: string): Promise<PagedResult<AccountDetailDto>> {
    const result = await this.accountRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        accountHolderId: userId ?? filter.props?.accountHolderId,
        id: filter.props?.accountId,
        status: filter.props?.status,
        type: filter.props?.type,
      }
    });
    return new PagedResult(
      result.items.map(a => AccountDtoMapper.toDto(a)),
      result.total,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<AccountDetailDto> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BusinessException('Account not found with id ' + id);
    }
    return AccountDtoMapper.toDto(account);
  }

  async create(dto: CreateAccountDto): Promise<AccountDetailDto> {
    const account = await this.createAccountUseCase.execute(dto);
    return AccountDtoMapper.toDto(account);
  }

  async update(id: string, dto: UpdateAccountDto, userId?: string): Promise<AccountDetailDto> {
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

  async listTransactions(accountId: string, filter: BaseFilter<TransactionDetailFilterDto>, userId?: string): Promise<PagedResult<TransactionDetailDto>> {
    // Add accountId to filter
    const result = await this.transactionRepository.findPaged(filter);
    return new PagedResult(
      result.items.map(t => TransactionDtoMapper.toDto(t)),
      result.total,
      result.pageIndex,
      result.pageSize,
    );
  }

}


