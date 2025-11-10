import { Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { Prisma } from 'generated/prisma';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { DonationPersistence } from '../types/finance-persistence.types';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { DefaultArgs } from 'generated/prisma/runtime/library';

@Injectable()
class DonationRepository
  extends PrismaBaseRepository<
    Donation,
    PrismaPostgresService['donation'],
    Prisma.DonationWhereUniqueInput,
    Prisma.DonationWhereInput,
    DonationPersistence.Base,
    Prisma.DonationCreateInput,
    Prisma.DonationUpdateInput
  >
  implements IDonationRepository
{
  protected getDelegate(prisma: PrismaPostgresService): Prisma.DonationDelegate<DefaultArgs, Prisma.PrismaClientOptions> {
    return prisma.donation;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<Donation>> {
    throw new Error('Method not implemented.');
  }



  protected toDomain(prismaModel: any): Donation | null {
    return FinanceInfraMapper.toDonationDomain(prismaModel);
  }

  async findAll(filter?: any): Promise<Donation[]> {
    const where: Prisma.DonationWhereInput = {
      type: filter?.type,
      status: filter?.status,
      donorId: filter?.donorId,
      deletedAt: null,
    };
    return this.findMany(where);
  }

  async findById(id: string): Promise<Donation | null> {
    return this.findUnique({ id });
  }

  async findByDonorId(donorId: string): Promise<Donation[]> {
    return this.findMany({ donorId, deletedAt: null });
  }

  async findByStatus(status: DonationStatus): Promise<Donation[]> {
    return this.findMany({ status, deletedAt: null });
  }

  async findByType(type: DonationType): Promise<Donation[]> {
    return this.findMany({ type, deletedAt: null });
  }

  async findPendingRegularDonations(): Promise<Donation[]> {
    return this.findMany({
      type: DonationType.REGULAR,
      status: DonationStatus.RAISED,
      deletedAt: null,
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Donation[]> {
    return this.findMany({
      raisedDate: {
        gte: startDate,
        lte: endDate,
      },
      deletedAt: null,
    });
  }

  async create(donation: Donation): Promise<Donation> {
    const createData = FinanceInfraMapper.toDonationCreatePersistence(donation);
    return this.createRecord(createData);
  }

  async update(id: string, donation: Donation): Promise<Donation> {
    const updateData = FinanceInfraMapper.toDonationUpdatePersistence(donation);
    return this.updateRecord({ id }, updateData);
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default DonationRepository;
