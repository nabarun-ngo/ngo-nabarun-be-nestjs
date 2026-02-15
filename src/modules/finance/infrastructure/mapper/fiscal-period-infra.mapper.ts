import { Prisma } from '@prisma/client';
import { FiscalPeriod, FiscalPeriodStatus } from '../../domain/model/fiscal-period.model';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

export type PrismaFiscalPeriod = Prisma.FiscalPeriodGetPayload<Record<string, never>>;

export class FiscalPeriodInfraMapper {
  static toFiscalPeriodDomain(p: PrismaFiscalPeriod | null): FiscalPeriod | null {
    if (!p) return null;
    return new FiscalPeriod(
      p.id,
      p.code,
      p.name,
      p.startDate,
      p.endDate,
      p.status as FiscalPeriodStatus,
      MapperUtils.nullToUndefined(p.closedAt),
      MapperUtils.nullToUndefined(p.closedById),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toFiscalPeriodCreatePersistence(domain: FiscalPeriod): Prisma.FiscalPeriodUncheckedCreateInput {
    return {
      id: domain.id,
      code: domain.code,
      name: domain.name,
      startDate: domain.startDate,
      endDate: domain.endDate,
      status: domain.status,
      closedAt: MapperUtils.undefinedToNull(domain.closedAt),
      closedById: MapperUtils.undefinedToNull(domain.closedById),
    };
  }

  static toFiscalPeriodUpdatePersistence(domain: FiscalPeriod): Prisma.FiscalPeriodUncheckedUpdateInput {
    return {
      code: domain.code,
      name: domain.name,
      startDate: domain.startDate,
      endDate: domain.endDate,
      status: domain.status,
      closedAt: MapperUtils.undefinedToNull(domain.closedAt),
      closedById: MapperUtils.undefinedToNull(domain.closedById),
      updatedAt: domain.updatedAt,
    };
  }
}
