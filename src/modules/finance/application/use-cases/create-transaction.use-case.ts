import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateTransactionDto } from '../dto/transaction.dto';

@Injectable()
export class CreateTransactionUseCase implements IUseCase<CreateTransactionDto, Transaction> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateTransactionDto): Promise<Transaction> {
    const account = await this.accountRepository.findById(request.accountId);
    if (!account) {
      throw new BusinessException(`Account not found with id: ${request.accountId}`);
    }

    if (!account.isActive()) {
      throw new BusinessException('Cannot create transaction for inactive account');
    }

    let transaction: Transaction;

    if (request.txnType === 'IN') {
      transaction = Transaction.createIn({
        amount: request.txnAmount,
        currency: request.currency,
        accountId: request.accountId,
        description: request.txnDescription,
        referenceId: request.txnRefId,
        referenceType: request.txnRefType as any,
        txnParticulars: request.txnParticulars,
        transactionDate: request.txnDate,
      });

      // Credit account
      account.credit(request.txnAmount);
    } else if (request.txnType === 'OUT') {
      if (!account.hasSufficientFunds(request.txnAmount)) {
        throw new BusinessException('Insufficient account balance');
      }

      transaction = Transaction.createOut({
        amount: request.txnAmount,
        currency: request.currency,
        accountId: request.accountId,
        description: request.txnDescription,
        referenceId: request.txnRefId,
        referenceType: request.txnRefType as any,
        txnParticulars: request.txnParticulars,
        transactionDate: request.txnDate,
      });

      // Debit account
      account.debit(request.txnAmount);
    } else {
      throw new BusinessException('Transfer transactions must be created through transfer use case');
    }

    // Update account balance
    await this.accountRepository.update(account.id, account);

    // Set account balance in transaction
    transaction.setAccountBalance(account.balance);

    // Save transaction
    const savedTransaction = await this.transactionRepository.create(transaction);

    // Emit domain events
    for (const event of savedTransaction.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedTransaction.clearEvents();

    return savedTransaction;
  }
}


