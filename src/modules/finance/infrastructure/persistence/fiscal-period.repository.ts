import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { IFiscalPeriodRepository } from '../../domain/repositories/fiscal-period.repository.interface';
import { FiscalPeriod, FiscalPeriodFilter } from '../../domain/model/fiscal-period.model';
import { FiscalPeriodInfraMapper } from '../mapper/fiscal-period-infra.mapper';

@Injectable()
class FiscalPeriodRepository implements IFiscalPeriodRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  private whereQuery(props?: FiscalPeriodFilter): Prisma.FiscalPeriodWhereInput {
    const where: Prisma.FiscalPeriodWhereInput = {
      ...(props?.status?.length ? { status: { in: props.status } } : {}),
      ...(props?.code ? { code: props.code } : {}),
      ...(props?.startDateFrom ? { startDate: { gte: props.startDateFrom } } : {}),
      ...(props?.startDateTo ? { startDate: { lte: props.startDateTo } } : {}),
    };
    return where;
  }

  async findPaged(filter?: BaseFilter<FiscalPeriodFilter>): Promise<PagedResult<FiscalPeriod>> {
    const where = this.whereQuery(filter?.props);
    const [data, total] = await Promise.all([
      this.prisma.fiscalPeriod.findMany({
        where,
        orderBy: { startDate: 'desc' },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.fiscalPeriod.count({ where }),
    ]);
    return new PagedResult<FiscalPeriod>(
      data.map((m) => FiscalPeriodInfraMapper.toFiscalPeriodDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: FiscalPeriodFilter): Promise<FiscalPeriod[]> {
    const data = await this.prisma.fiscalPeriod.findMany({
      where: this.whereQuery(filter ?? {}),
      orderBy: { startDate: 'desc' },
    });
    return data.map((m) => FiscalPeriodInfraMapper.toFiscalPeriodDomain(m)!);
  }

  async findById(id: string): Promise<FiscalPeriod | null> {
    const p = await this.prisma.fiscalPeriod.findUnique({ where: { id } });
    return FiscalPeriodInfraMapper.toFiscalPeriodDomain(p);
  }

  async findByCode(code: string): Promise<FiscalPeriod | null> {
    const p = await this.prisma.fiscalPeriod.findUnique({ where: { code } });
    return FiscalPeriodInfraMapper.toFiscalPeriodDomain(p);
  }

  async findOpenPeriodForDate(date: Date): Promise<FiscalPeriod | null> {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const p = await this.prisma.fiscalPeriod.findFirst({
      where: {
        status: 'OPEN',
        startDate: { lte: d },
        endDate: { gte: d },
      },
      orderBy: { startDate: 'desc' },
    });
    return FiscalPeriodInfraMapper.toFiscalPeriodDomain(p);
  }

  async create(entity: FiscalPeriod): Promise<FiscalPeriod> {
    const data = FiscalPeriodInfraMapper.toFiscalPeriodCreatePersistence(entity);
    const created = await this.prisma.fiscalPeriod.create({ data });
    return FiscalPeriodInfraMapper.toFiscalPeriodDomain(created)!;
  }

  async update(id: string, entity: FiscalPeriod): Promise<FiscalPeriod> {
    const data = FiscalPeriodInfraMapper.toFiscalPeriodUpdatePersistence(entity);
    const updated = await this.prisma.fiscalPeriod.update({
      where: { id },
      data,
    });
    return FiscalPeriodInfraMapper.toFiscalPeriodDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.fiscalPeriod.delete({ where: { id } });
  }

  async count(filter: FiscalPeriodFilter): Promise<number> {
    return this.prisma.fiscalPeriod.count({ where: this.whereQuery(filter ?? {}) });
  }
}

export default FiscalPeriodRepository;
