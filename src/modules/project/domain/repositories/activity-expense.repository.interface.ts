import { IRepository } from 'src/shared/interfaces/repository.interface';

export interface ActivityExpenseProps {
  activityId: string;
  expenseId: string;
  allocationPercentage?: number;
  allocationAmount?: number;
  notes?: string;
  createdBy: string;
}

export interface ActivityExpense {
  id: string;
  activityId: string;
  expenseId: string;
  allocationPercentage?: number;
  allocationAmount?: number;
  notes?: string;
  createdBy: string;
  createdAt: Date;
}

export interface IActivityExpenseRepository {
  findById(id: string): Promise<ActivityExpense | null>;
  findByActivityId(activityId: string): Promise<ActivityExpense[]>;
  findByExpenseId(expenseId: string): Promise<ActivityExpense[]>;
  create(props: ActivityExpenseProps): Promise<ActivityExpense>;
  delete(id: string): Promise<void>;
  deleteByActivityAndExpense(activityId: string, expenseId: string): Promise<void>;
}

export const ACTIVITY_EXPENSE_REPOSITORY = Symbol('ACTIVITY_EXPENSE_REPOSITORY');

