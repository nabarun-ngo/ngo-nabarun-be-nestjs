import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { Transaction, TransactionType } from '../../domain/model/transaction.model';
import { Prisma } from 'generated/prisma';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { TransactionPersistence } from '../types/finance-persistence.types';

@Injectable()
class TransactionRepository
  extends PrismaBaseRepository<
    Transaction,
    PrismaPostgresService['transaction'],
    Prisma.TransactionWhereUniqueInput,
    Prisma.TransactionWhereInput,
    TransactionPersistence.Base,
    Prisma.TransactionCreateInput,
    Prisma.TransactionUpdateInput
  >
  implements ITransactionRepository
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.transaction;
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
