import { Injectable } from '@nestjs/common';
import { IEarningRepository } from '../../domain/repositories/earning.repository.interface';
import { Earning, EarningCategory } from '../../domain/model/earning.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { EarningPersistence } from '../types/finance-persistence.types';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

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
  protected getDelegate(prisma: PrismaPostgresService){
    return prisma.earning;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<Earning>> {
    throw new Error('Method not implemented.');
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
