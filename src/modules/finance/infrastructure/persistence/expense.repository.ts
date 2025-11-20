import { Injectable } from '@nestjs/common';
import { IExpenseRepository } from '../../domain/repositories/expense.repository.interface';
import { Expense, ExpenseCategory, ExpenseStatus } from '../../domain/model/expense.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { ExpensePersistence } from '../types/finance-persistence.types';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class ExpenseRepository
  extends PrismaBaseRepository<
    Expense,
    PrismaPostgresService['expense'],
    Prisma.ExpenseWhereUniqueInput,
    Prisma.ExpenseWhereInput,
    ExpensePersistence.Base,
    Prisma.ExpenseCreateInput,
    Prisma.ExpenseUpdateInput
  >
  implements IExpenseRepository
{
  protected getDelegate(prisma: PrismaPostgresService){
    return prisma.expense;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<Expense>> {
    throw new Error('Method not implemented.');
  }

 

  protected toDomain(prismaModel: any): Expense | null {
    return FinanceInfraMapper.toExpenseDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Expense[]> {
    const where: Prisma.ExpenseWhereInput = {
      category: filter?.category,
      status: filter?.status,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Expense | null> {
    return this.findUnique({ id });
  }

  async findByCategory(category: ExpenseCategory): Promise<Expense[]> {
    return this.findMany({ category, deletedAt: null });
  }

  async findByStatus(status: ExpenseStatus): Promise<Expense[]> {
    return this.findMany({ status, deletedAt: null });
  }

  async findByRequestedBy(userId: string): Promise<Expense[]> {
    return this.findMany({ requestedBy: userId, deletedAt: null });
  }

  async findPendingExpenses(): Promise<Expense[]> {
    return this.findMany({ status: ExpenseStatus.PENDING, deletedAt: null });
  }

  async create(expense: Expense): Promise<Expense> {
    const createData = FinanceInfraMapper.toExpenseCreatePersistence(expense);
    return this.createRecord(createData);
  }

  async update(id: string, expense: Expense): Promise<Expense> {
    const updateData = FinanceInfraMapper.toExpenseUpdatePersistence(expense);
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default ExpenseRepository;
