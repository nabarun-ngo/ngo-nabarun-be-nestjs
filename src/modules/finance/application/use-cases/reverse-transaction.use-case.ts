import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction, TransactionRefType, TransactionStatus, TransactionType } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { ACCOUNT_REPOSITORY, type IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

interface ReverseTransaction {
    accountId: string;
    transactionRef: string;
    reason: string;
}

@Injectable()
export class ReverseTransactionUseCase implements IUseCase<ReverseTransaction, void> {
    constructor(
        @Inject(TRANSACTION_REPOSITORY)
        private readonly transactionRepository: ITransactionRepository,
        @Inject(ACCOUNT_REPOSITORY)
        private readonly accountRepository: IAccountRepository,
        private readonly eventEmitter: EventEmitter2
    ) { }

    async execute(request: ReverseTransaction): Promise<void> {
        const transactions = await this.transactionRepository.findAll({
            transactionRef: request.transactionRef,
            status: [TransactionStatus.SUCCESS]
        });
        if (!transactions) {
            throw new BusinessException(`Transactions not found with Ref Id: ${request.transactionRef}`);
        }

        for (const transaction of transactions) {
            const account = await this.accountRepository.findById(transaction.accountId!);
            if (!account) {
                throw new BusinessException(`Account not found with id: ${transaction.accountId}`);
            }

            if (transaction.type == TransactionType.IN) {
                account.debit(transaction.amount, {
                    transactionRef: transaction.transactionRef,
                    particulars: `Reversed transaction ${transaction.id}`,
                    txnDate: new Date(),
                    referenceId: transaction.id,
                    referenceType: TransactionRefType.TXN_REVERSE,
                    refAccountId: transaction.refAccountId,
                });
            }
            else if (transaction.type == TransactionType.OUT) {
                account.credit(transaction.amount, {
                    transactionRef: transaction.transactionRef,
                    particulars: `Reversed transaction ${transaction.id}`,
                    txnDate: new Date(),
                    referenceId: transaction.id,
                    referenceType: TransactionRefType.TXN_REVERSE,
                    refAccountId: transaction.refAccountId,
                });
            }
            account.transactions.find(t => t.id == transaction.id)?.reverse();
            await this.accountRepository.update(account.id, account);
            for (const event of account.domainEvents) {
                this.eventEmitter.emit(event.constructor.name, event);
            }
            account.clearEvents();
        }

    }
}


