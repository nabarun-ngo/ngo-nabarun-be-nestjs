import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { TransactionDetailFilterDto } from '../dto/transaction.dto';

@Injectable()
export class ListTransactionsUseCase implements IUseCase<BaseFilter<TransactionDetailFilterDto>, PagedResult<Transaction>> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(request: BaseFilter<TransactionDetailFilterDto>): Promise<PagedResult<Transaction>> {
    // TODO: Implement paged filtering in repository
    const allTransactions = await this.transactionRepository.findAll();
    
    let filtered = allTransactions;
    
    if (request.props?.txnId) {
      filtered = filtered.filter(t => t.id === request.props?.txnId);
    }
    if (request.props?.txnType && request.props.txnType.length > 0) {
      filtered = filtered.filter(t => request.props?.txnType?.includes(t.type));
    }
    if (request.props?.txnStatus && request.props.txnStatus.length > 0) {
      filtered = filtered.filter(t => request.props?.txnStatus?.includes(t.status));
    }
    if (request.props?.txnRefId) {
      filtered = filtered.filter(t => t.referenceId === request.props?.txnRefId);
    }
    if (request.props?.txnRefType) {
      filtered = filtered.filter(t => t.referenceType === request.props?.txnRefType);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}


