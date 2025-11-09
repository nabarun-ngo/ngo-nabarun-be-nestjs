import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Expense, ExpenseCategory, ExpenseStatus } from '../model/expense.model';

export interface IExpenseRepository extends IRepository<Expense, string> {
  findById(id: string): Promise<Expense | null>;
  findByCategory(category: ExpenseCategory): Promise<Expense[]>;
  findByStatus(status: ExpenseStatus): Promise<Expense[]>;
  findByRequestedBy(userId: string): Promise<Expense[]>;
  findPendingExpenses(): Promise<Expense[]>;
  create(expense: Expense): Promise<Expense>;
  update(id: string, expense: Expense): Promise<Expense>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Expense[]>;
}

export const EXPENSE_REPOSITORY = Symbol('EXPENSE_REPOSITORY');
