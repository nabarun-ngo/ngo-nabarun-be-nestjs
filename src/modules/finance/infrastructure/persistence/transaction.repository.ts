import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { Transaction, TransactionType } from '../../domain/model/transaction.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { TransactionDetailFilterDto } from '../../application/dto/transaction.dto';

@Injectable()
class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findPaged(filter?: BaseFilter<TransactionDetailFilterDto>): Promise<PagedResult<Transaction>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { transactionDate: 'desc' },
        include: {
          account: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return new PagedResult<Transaction>(
      data.map(m => FinanceInfraMapper.toTransactionDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: TransactionDetailFilterDto): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: this.whereQuery(filter),
      orderBy: { transactionDate: 'desc' },
      include: {
        account: true,
      },
    });

    return transactions.map(m => FinanceInfraMapper.toTransactionDomain(m)!);
  }

  private whereQuery(props?: TransactionDetailFilterDto): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      ...(props?.type ? { type: props.type } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.accountId ? { accountId: props.accountId } : {}),
      ...(props?.startDate || props?.endDate
        ? {
            transactionDate: {
              ...(props.startDate ? { gte: props.startDate } : {}),
              ...(props.endDate ? { lte: props.endDate } : {}),
            },
          }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Transaction | null> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        account: true,
      },
    });

    return FinanceInfraMapper.toTransactionDomain(transaction);
  }

  async findByAccountId(accountId: string): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { accountId, deletedAt: null },
      orderBy: { transactionDate: 'desc' },
      include: {
        account: true,
      },
    });

    return transactions.map(m => FinanceInfraMapper.toTransactionDomain(m)!);
  }

  async findByType(type: TransactionType): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: { type, deletedAt: null },
      orderBy: { transactionDate: 'desc' },
      include: {
        account: true,
      },
    });

    return transactions.map(m => FinanceInfraMapper.toTransactionDomain(m)!);
  }

  async findByDateRange(accountId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: {
        accountId,
        transactionDate: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: { transactionDate: 'desc' },
      include: {
        account: true,
      },
    });

    return transactions.map(m => FinanceInfraMapper.toTransactionDomain(m)!);
  }

  async create(transaction: Transaction): Promise<Transaction> {
    const createData: Prisma.TransactionCreateInput = {
      ...FinanceInfraMapper.toTransactionCreatePersistence(transaction),
    };

    const created = await this.prisma.transaction.create({
      data: createData,
      include: {
        account: true,
      },
    });

    return FinanceInfraMapper.toTransactionDomain(created)!;
  }

  async update(id: string, transaction: Transaction): Promise<Transaction> {
    // Transactions typically shouldn't be updated, but interface requires it
    throw new Error('Transactions cannot be updated once created');
  }

  async delete(id: string): Promise<void> {
    await this.prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default TransactionRepository;
