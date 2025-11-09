import { Injectable } from '@nestjs/common';
import { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { Earning, EarningCategory } from '../../domain/model/earning.model';
import { Prisma } from 'generated/prisma';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { EarningPersistence } from '../types/finance-persistence.types';

@Injectable()
class EarningRepository
  extends PrismaBaseRepository<
    Earning,
    PrismaPostgresService['earning'],
    Prisma.EarningWhereUniqueInput,
    Prisma.EarningWhereInput,
    EarningPersistence.Base,
    Prisma.EarningCreateInput,
    Prisma.EarningUpdateInput
  >
  implements IEarningRepository
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.earning;
  }

  protected toDomain(prismaModel: any): Earning | null {
    return FinanceInfraMapper.toEarningDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Earning[]> {
    const where: Prisma.EarningWhereInput = {
      category: filter?.category,
      source: filter?.source,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Earning | null> {
    return this.findUnique({ id });
  }

  async findByCategory(category: EarningCategory): Promise<Earning[]> {
    return this.findMany({ category, deletedAt: null });
  }

  async findBySource(source: string): Promise<Earning[]> {
    return this.findMany({ source, deletedAt: null });
  }

  async create(earning: Earning): Promise<Earning> {
    const createData = FinanceInfraMapper.toEarningCreatePersistence(earning);
    return this.createRecord(createData);
  }

  async update(id: string, earning: Earning): Promise<Earning> {
    const updateData = FinanceInfraMapper.toEarningUpdatePersistence(earning);
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default EarningRepository;
