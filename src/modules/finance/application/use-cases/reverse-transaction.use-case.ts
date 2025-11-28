import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction, TransactionRefType, TransactionType } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

interface ReverseTransaction {
    id: string;
    reason: string;
}

@Injectable()
export class ReverseTransactionUseCase implements IUseCase<ReverseTransaction, Transaction> {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
    ) { }

    async execute(request: ReverseTransaction): Promise<Transaction> {
        const transaction = await this.transactionRepository.findById(request.id);
        if (!transaction) {
            throw new BusinessException(`Transaction not found with id: ${request.id}`);
        }

        let accountId = transaction.txnType == 'IN' ? transaction.transferToAccountId : transaction.transferFromAccountId;
        const account = await this.accountRepository.findById(accountId!);
        if (!account) {
            throw new BusinessException(`Account not found with id: ${accountId}`);
        }
        let newTxn: Transaction | null = null;
        if (transaction.txnType === 'IN') {
            newTxn = Transaction.createOut({
                amount: transaction.txnAmount,
                currency: transaction.currency,
                accountId: transaction.transferToAccountId!,
                description: `Reversed transaction due to ${request.reason}`,
                referenceId: transaction.id,
                referenceType: transaction.referenceType,
                txnParticulars: `Reversed transaction ${transaction.id}`,
                transactionDate: new Date(),
            });

            account.debit(transaction.txnAmount);
        } else if (transaction.txnType === 'OUT') {
            newTxn = Transaction.createIn({
                amount: transaction.txnAmount,
                currency: transaction.currency,
                accountId: transaction.transferFromAccountId!,
                description: `Reversed transaction due to ${request.reason}`,
                referenceId: transaction.id,
                referenceType: transaction.referenceType,
                txnParticulars: `Reversed transaction ${transaction.id}`,
                transactionDate: new Date(),
            });

            account.credit(transaction.txnAmount);
        } else {

        }

        await this.accountRepository.update(account.id, account);
        newTxn?.setAccountBalance(account.balance);
        const savedTransaction = await this.transactionRepository.create(newTxn!);

        return savedTransaction;
    }
}


