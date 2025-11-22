import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { Transaction, TransactionType } from '../../domain/model/transaction.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { TransactionPersistence } from '../types/finance-persistence.types';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class TransactionRepository
  extends PrismaBaseRepository<
    Transaction,
    PrismaPostgresService['transaction'],
    Prisma.TransactionWhereUniqueInput,
    Prisma.TransactionWhereInput,
    Prisma.TransactionGetPayload<any>,
    Prisma.TransactionCreateInput,
    Prisma.TransactionUpdateInput
  >
  implements ITransactionRepository
{
  protected getDelegate(prisma: PrismaPostgresService) {
    return prisma.transaction;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<Transaction>> {
    throw new Error('Method not implemented.');
  }

 

  protected toDomain(prismaModel: any): Transaction | null {
    return FinanceInfraMapper.toTransactionDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Transaction[]> {
    const where: Prisma.TransactionWhereInput = {
      type: filter?.type,
      accountId: filter?.accountId,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Transaction | null> {
    return this.findUnique({ id });
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    return this.findMany({ accountId, deletedAt: null });
  }

  async findByType(type: TransactionType): Promise<Transaction[]> {
    return this.findMany({ type, deletedAt: null });
  }

  async findByDateRange(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return this.findMany({
      accountId,
      transactionDate: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    });
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const createData = FinanceInfraMapper.toTransactionCreatePersistence(transaction);
    return this.createRecord(createData);
  }

  async update(id: string, transaction: Transaction): Promise<Transaction> {
    // Transactions typically shouldn't be updated, but interface requires it
    throw new Error('Transactions cannot be updated once created');
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default TransactionRepository;
