import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Transaction, TransactionType } from '../model/transaction.model';

export interface ITransactionRepository extends IRepository<Transaction, string> {
  findById(id: string): Promise<Transaction | null>;
  findByAccountId(accountId: string): Promise<Transaction[]>;
  findByType(type: TransactionType): Promise<Transaction[]>;
  findByDateRange(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  create(transaction: Transaction): Promise<Transaction>;
  update(id: string, transaction: Transaction): Promise<Transaction>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Transaction[]>;
}

export const TRANSACTION_REPOSITORY = Symbol('TRANSACTION_REPOSITORY');
