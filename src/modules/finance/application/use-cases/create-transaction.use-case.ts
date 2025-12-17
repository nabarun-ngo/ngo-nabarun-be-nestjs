import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Transaction, TransactionRefType, TransactionType } from '../../domain/model/transaction.model';
import { TRANSACTION_REPOSITORY } from '../../domain/repositories/transaction.repository.interface';
import type { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

interface CreateTeansaction {
  txnType: TransactionType;
  txnAmount: number;
  currency: string;
  accountId: string;// from Account Id
  transferToAccountId?: string;// to Account Id
  txnDescription: string;
  txnParticulars?: string;
  txnRefId?: string;
  txnRefType?: TransactionRefType;
  txnDate?: Date;
  comment?: string;
}

@Injectable()
export class CreateTransactionUseCase implements IUseCase<CreateTeansaction, Transaction> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) { }

  async execute(request: CreateTeansaction): Promise<Transaction> {
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
        comment: request.comment,
      });

      // Credit account
      account.credit(request.txnAmount);
      // Set account balance in transaction
      transaction.setToAccountBalance(account.balance);

      // Save transaction
      await this.transactionRepository.create(transaction);
      // Update account balance
      await this.accountRepository.update(account.id, account);
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
        comment: request.comment,
      });

      // Debit account
      account.debit(request.txnAmount);
      // Set account balance in transaction
      transaction.setFromAccountBalance(account.balance);

      // Save transaction
      await this.transactionRepository.create(transaction);
      // Update account balance
      await this.accountRepository.update(account.id, account);
    } else if (request.txnType === 'TRANSFER') {

      if (!account.hasSufficientFunds(request.txnAmount)) {
        throw new BusinessException('Insufficient account balance');
      }
      if (!request.transferToAccountId) {
        throw new BusinessException('Transfer to account id is required');
      }
      const toAccount = await this.accountRepository.findById(request.transferToAccountId);
      if (!toAccount) {
        throw new BusinessException('Account not found with id ' + request.transferToAccountId);
      }

      transaction = Transaction.createTransfer({
        amount: request.txnAmount,
        currency: request.currency,
        fromAccountId: request.accountId,
        toAccountId: request.transferToAccountId,
        description: request.txnDescription,
        transactionDate: request.txnDate,
        txnParticulars: request.txnParticulars,
        comment: request.comment,
      });
      // Debit account
      account.debit(request.txnAmount);
      // Set account balance in transaction
      transaction.setFromAccountBalance(account.balance);

      // Credit to account
      toAccount.credit(request.txnAmount);
      // Set account balance in transaction
      transaction.setToAccountBalance(toAccount.balance);

      // Save transaction
      await this.transactionRepository.create(transaction);
      // Update account balance
      await this.accountRepository.update(account.id, account);
      await this.accountRepository.update(toAccount.id, toAccount);
    } else {
      throw new BusinessException('Invalid transaction type');
    }



    // Emit domain events
    // for (const event of savedTransaction.domainEvents) {
    //   this.eventEmitter.emit(event.constructor.name, event);
    // }
    // savedTransaction.clearEvents();

    return transaction;
  }
}


