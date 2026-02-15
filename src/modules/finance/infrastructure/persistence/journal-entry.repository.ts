import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { IJournalEntryRepository } from '../../domain/repositories/journal-entry.repository.interface';
import { JournalEntry, JournalEntryFilter } from '../../domain/model/journal-entry.model';
import { JournalEntryInfraMapper } from '../mapper/journal-entry-infra.mapper';
import { LedgerEntryInfraMapper } from '../mapper/ledger-entry-infra.mapper';

@Injectable()
class JournalEntryRepository implements IJournalEntryRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  private whereQuery(props?: JournalEntryFilter): Prisma.JournalEntryWhereInput {
    const where: Prisma.JournalEntryWhereInput = {
      ...(props?.referenceType ? { referenceType: props.referenceType } : {}),
      ...(props?.referenceId ? { referenceId: props.referenceId } : {}),
      ...(props?.status?.length ? { status: { in: props.status } } : {}),
      ...(props?.fiscalPeriodId ? { fiscalPeriodId: props.fiscalPeriodId } : {}),
      ...(props?.entryDateFrom || props?.entryDateTo
        ? {
            entryDate: {
              ...(props.entryDateFrom ? { gte: props.entryDateFrom } : {}),
              ...(props.entryDateTo ? { lte: props.entryDateTo } : {}),
            },
          }
        : {}),
    };
    return where;
  }

  async findPaged(filter?: BaseFilter<JournalEntryFilter>): Promise<PagedResult<JournalEntry>> {
    const where = this.whereQuery(filter?.props);
    const [data, total] = await Promise.all([
      this.prisma.journalEntry.findMany({
        where,
        orderBy: { entryDate: 'desc' },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.journalEntry.count({ where }),
    ]);
    return new PagedResult<JournalEntry>(
      data.map((m) => JournalEntryInfraMapper.toJournalEntryDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: JournalEntryFilter): Promise<JournalEntry[]> {
    const data = await this.prisma.journalEntry.findMany({
      where: this.whereQuery(filter ?? {}),
      orderBy: { entryDate: 'desc' },
    });
    return data.map((m) => JournalEntryInfraMapper.toJournalEntryDomain(m)!);
  }

  async findById(id: string): Promise<JournalEntry | null> {
    const p = await this.prisma.journalEntry.findUnique({ where: { id } });
    return JournalEntryInfraMapper.toJournalEntryDomain(p);
  }

  async findByReference(referenceType: string, referenceId: string): Promise<JournalEntry | null> {
    const p = await this.prisma.journalEntry.findFirst({
      where: { referenceType, referenceId, status: 'POSTED' },
    });
    return JournalEntryInfraMapper.toJournalEntryDomain(p);
  }

  async create(entity: JournalEntry): Promise<JournalEntry> {
    const lines = entity.getLines();
    const created = await this.prisma.$transaction(async (tx) => {
      const jeData = JournalEntryInfraMapper.toJournalEntryCreatePersistence(entity);
      const je = await tx.journalEntry.create({ data: jeData });
      if (lines.length > 0) {
        await tx.ledgerEntry.createMany({
          data: lines.map((line) => ({
            ...LedgerEntryInfraMapper.toLedgerEntryCreatePersistence(line),
            journalEntryId: je.id,
          })),
        });
      }
      return je;
    });
    return JournalEntryInfraMapper.toJournalEntryDomain(created)!;
  }

  async update(id: string, entity: JournalEntry): Promise<JournalEntry> {
    const data = JournalEntryInfraMapper.toJournalEntryUpdatePersistence(entity);
    const updated = await this.prisma.journalEntry.update({
      where: { id },
      data,
    });
    return JournalEntryInfraMapper.toJournalEntryDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.ledgerEntry.deleteMany({ where: { journalEntryId: id } });
      await tx.journalEntry.delete({ where: { id } });
    });
  }

  async count(filter: JournalEntryFilter): Promise<number> {
    return this.prisma.journalEntry.count({ where: this.whereQuery(filter ?? {}) });
  }
}

export default JournalEntryRepository;
