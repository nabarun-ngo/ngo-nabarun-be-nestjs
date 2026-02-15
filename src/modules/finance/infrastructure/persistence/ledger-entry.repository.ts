import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { LedgerEntry, LedgerEntryFilter } from '../../domain/model/ledger-entry.model';
import { LedgerEntryInfraMapper } from '../mapper/ledger-entry-infra.mapper';

@Injectable()
class LedgerEntryRepository implements ILedgerEntryRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  private whereQuery(props?: LedgerEntryFilter): Prisma.LedgerEntryWhereInput {
    const where: Prisma.LedgerEntryWhereInput = {
      ...(props?.accountId ? { accountId: props.accountId } : {}),
      ...(props?.journalEntryId ? { journalEntryId: props.journalEntryId } : {}),
      ...(props?.fromDate || props?.toDate
        ? {
            createdAt: {
              ...(props.fromDate ? { gte: props.fromDate } : {}),
              ...(props.toDate ? { lte: props.toDate } : {}),
            },
          }
        : {}),
    };
    return where;
  }

  async findPaged(filter?: BaseFilter<LedgerEntryFilter>): Promise<PagedResult<LedgerEntry>> {
    const where = this.whereQuery(filter?.props);
    const orderBy = filter?.props?.accountId
      ? [{ createdAt: 'desc' as const }]
      : [{ journalEntryId: 'asc' as const }, { lineNumber: 'asc' as const }];
    const [data, total] = await Promise.all([
      this.prisma.ledgerEntry.findMany({
        where,
        orderBy,
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.ledgerEntry.count({ where }),
    ]);
    return new PagedResult<LedgerEntry>(
      data.map((m) => LedgerEntryInfraMapper.toLedgerEntryDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: LedgerEntryFilter): Promise<LedgerEntry[]> {
    const data = await this.prisma.ledgerEntry.findMany({
      where: this.whereQuery(filter ?? {}),
      orderBy: [{ journalEntryId: 'asc' }, { lineNumber: 'asc' }],
    });
    return data.map((m) => LedgerEntryInfraMapper.toLedgerEntryDomain(m)!);
  }

  async findById(id: string): Promise<LedgerEntry | null> {
    const p = await this.prisma.ledgerEntry.findUnique({ where: { id } });
    return LedgerEntryInfraMapper.toLedgerEntryDomain(p);
  }

  async create(entity: LedgerEntry): Promise<LedgerEntry> {
    const data = LedgerEntryInfraMapper.toLedgerEntryCreatePersistence(entity);
    const created = await this.prisma.ledgerEntry.create({ data });
    return LedgerEntryInfraMapper.toLedgerEntryDomain(created)!;
  }

  async createMany(entries: LedgerEntry[]): Promise<void> {
    if (entries.length === 0) return;
    const data = entries.map((e) => LedgerEntryInfraMapper.toLedgerEntryCreatePersistence(e));
    await this.prisma.ledgerEntry.createMany({ data });
  }

  async update(_id: string, _entity: LedgerEntry): Promise<LedgerEntry> {
    throw new BusinessException('Ledger entries are immutable and cannot be updated');
  }

  async delete(_id: string): Promise<void> {
    throw new BusinessException('Ledger entries are immutable and cannot be deleted');
  }

  async count(filter: LedgerEntryFilter): Promise<number> {
    return this.prisma.ledgerEntry.count({ where: this.whereQuery(filter ?? {}) });
  }

  async findByJournalEntryId(journalEntryId: string): Promise<LedgerEntry[]> {
    const data = await this.prisma.ledgerEntry.findMany({
      where: { journalEntryId },
      orderBy: { lineNumber: 'asc' },
    });
    return data.map((m) => LedgerEntryInfraMapper.toLedgerEntryDomain(m)!);
  }

  async findByAccountId(
    accountId: string,
    fromDate?: Date,
    toDate?: Date,
  ): Promise<LedgerEntry[]> {
    const where: Prisma.LedgerEntryWhereInput = { accountId };
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) (where.createdAt as Prisma.DateTimeFilter).gte = fromDate;
      if (toDate) (where.createdAt as Prisma.DateTimeFilter).lte = toDate;
    }
    const data = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });
    return data.map((m) => LedgerEntryInfraMapper.toLedgerEntryDomain(m)!);
  }

  async getBalanceForAccount(accountId: string, asOfDate?: Date): Promise<number> {
    const where: Prisma.LedgerEntryWhereInput = { accountId };
    if (asOfDate) {
      where.createdAt = { lte: asOfDate };
    }
    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      select: { creditAmount: true, debitAmount: true },
    });
    const balance = entries.reduce(
      (sum, e) => sum + Number(e.creditAmount) - Number(e.debitAmount),
      0,
    );
    return balance;
  }
}

export default LedgerEntryRepository;
