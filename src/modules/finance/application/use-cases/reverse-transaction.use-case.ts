import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction, TransactionType } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { CreateTransactionUseCase } from './create-transaction.use-case';

interface ReverseTransaction {
    accountId: string;
    txnId: string;
    reason: string;
}

@Injectable()
export class ReverseTransactionUseCase implements IUseCase<ReverseTransaction, Transaction> {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
        private readonly createTransactionUseCase: CreateTransactionUseCase,
    ) { }

    async execute(request: ReverseTransaction): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(request.txnId);
        if (!transaction) {
            throw new BusinessException(`Transaction not found with id: ${request.txnId}`);
        }
        if (!transaction.isEligibleForReverse(request.accountId)) {
            throw new BusinessException(`Transaction is not eligible for reverse.`);
        }

        const commonTransactionProps = {
            txnAmount: transaction.txnAmount,
            currency: transaction.currency,
            txnDescription: `Reversed transaction due to ${request.reason}`,
            txnRefId: transaction.id,
            txnRefType: transaction.referenceType,
            txnParticulars: `Reversed transaction ${transaction.id}`,
            txnDate: new Date(),
            comment: request.reason,
        };
        if (transaction.txnType === 'IN') {
            const newTransaction = await this.createTransactionUseCase.execute({
                ...commonTransactionProps,
                accountId: transaction.transferToAccountId!,
                txnType: TransactionType.OUT,
            });
            transaction.revert();
            await this.transactionRepository.update(transaction.id, transaction);
            return newTransaction;
        }
        if (transaction.txnType === 'OUT') {
            const newTransaction = await this.createTransactionUseCase.execute({
                ...commonTransactionProps,
                accountId: transaction.transferFromAccountId!,
                txnType: TransactionType.IN,
            });
            transaction.revert();
            await this.transactionRepository.update(transaction.id, transaction);
            return newTransaction;
        }
        if (transaction.txnType === 'TRANSFER') {
            const newTransaction = await this.createTransactionUseCase.execute({
                ...commonTransactionProps,
                accountId: transaction.transferToAccountId!,
                transferToAccountId: transaction.transferFromAccountId!,
                txnType: TransactionType.TRANSFER,
            })
            transaction.revert();
            await this.transactionRepository.update(transaction.id, transaction);
            return newTransaction;
        }
        throw new BusinessException(`Transaction type ${transaction.txnType} is not supported for reverse.`);
    }
}


