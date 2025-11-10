import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Account, AccountType } from '../model/account.model';

export interface IAccountRepository extends IRepository<Account, string> {
  findById(id: string): Promise<Account | null>;
  findByType(type: AccountType): Promise<Account[]>;
  findMainAccount(): Promise<Account | null>;
  create(account: Account): Promise<Account>;
  update(id: string, account: Account): Promise<Account>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Account[]>;
}

export const ACCOUNT_REPOSITORY = Symbol('ACCOUNT_REPOSITORY');
