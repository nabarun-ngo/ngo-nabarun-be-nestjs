import { Inject, Injectable } from '@nestjs/common';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { TransactionDetailDto, TransactionDetailFilterDto, CreateTransactionDto } from '../dto/transaction.dto';
import { TransactionDtoMapper } from '../dto/finance-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateTransactionUseCase } from '../use-cases/create-transaction.use-case';
import { ListTransactionsUseCase } from '../use-cases/list-transactions.use-case';
import { GetTransactionUseCase } from '../use-cases/get-transaction.use-case';

@Injectable()
export class TransactionService {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    private readonly createTransactionUseCase: CreateTransactionUseCase,
    private readonly listTransactionsUseCase: ListTransactionsUseCase,
    private readonly getTransactionUseCase: GetTransactionUseCase,
  ) {}

  async list(filter: BaseFilter<TransactionDetailFilterDto>): Promise<PagedResult<TransactionDetailDto>> {
    const result = await this.listTransactionsUseCase.execute(filter);
    return new PagedResult(
      result.items.map(t => TransactionDtoMapper.toDto(t)),
      result.total,
      result.page,
      result.size,
    );
  }

  async getById(id: string): Promise<TransactionDetailDto> {
    const transaction = await this.getTransactionUseCase.execute(id);
    return TransactionDtoMapper.toDto(transaction);
  }

  async create(dto: CreateTransactionDto): Promise<TransactionDetailDto> {
    const transaction = await this.createTransactionUseCase.execute(dto);
    return TransactionDtoMapper.toDto(transaction);
  }
}

