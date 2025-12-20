import { Injectable } from '@nestjs/common';
import { ITransactionRepository } from '../../domain/repositories/transaction.repository.interface';
import { Transaction, TransactionFilter, TransactionType } from '../../domain/model/transaction.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { TransactionDetailFilterDto } from '../../application/dto/transaction.dto';
import { TransactionInfraMapper } from '../mapper/transaction-infra.mapper';

export type TransactionPersistence = Prisma.TransactionGetPayload<{
  include: {};
}>;

@Injectable()
class TransactionRepository implements ITransactionRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async findPaged(filter?: BaseFilter<TransactionFilter>): Promise<PagedResult<Transaction>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: {
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return new PagedResult<Transaction>(
      data.map(m => TransactionInfraMapper.toTransactionDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: TransactionFilter): Promise<Transaction[]> {
    const transactions = await this.prisma.transaction.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
      },
    });

    return transactions.map(m => TransactionInfraMapper.toTransactionDomain(m)!);
  }

  private whereQuery(props?: TransactionFilter): Prisma.TransactionWhereInput {
    const where: Prisma.TransactionWhereInput = {
      ...(props?.type ? { type: { in: props.type } } : {}),
      ...(props?.status ? { status: { in: props.status } } : {}),
      ...(props?.accountId ? { OR: [{ fromAccountId: props.accountId }, { toAccountId: props.accountId }] } : {}),
      ...(props?.referenceType ? { referenceType: { in: props.referenceType } } : {}),
      ...(props?.referenceId ? { referenceId: props.referenceId } : {}),
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
      },
    });

    return TransactionInfraMapper.toTransactionDomain(transaction!);
  }



  async create(transaction: Transaction): Promise<Transaction> {
    const createData: Prisma.TransactionUncheckedCreateInput = {
      ...TransactionInfraMapper.toTransactionCreatePersistence(transaction),
    };

    const created = await this.prisma.transaction.create({
      data: createData,
      include: {
      },
    });

    return TransactionInfraMapper.toTransactionDomain(created)!;
  }

  async update(id: string, transaction: Transaction): Promise<Transaction> {
    const updateData: Prisma.TransactionUncheckedUpdateInput = {
      ...TransactionInfraMapper.toTransactionUpdatePersistence(transaction),
    };

    const updated = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
      include: {
      },
    });

    return TransactionInfraMapper.toTransactionDomain(updated)!;
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
