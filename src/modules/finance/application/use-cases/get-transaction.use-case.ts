import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetTransactionUseCase implements IUseCase<string, Transaction> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(id: string): Promise<Transaction> {
    const transaction = await this.transactionRepository.findById(id);
    if (!transaction) {
      throw new BusinessException(`Transaction not found with id: ${id}`);
    }
    return transaction;
  }
}


