import { Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { Donation, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { FinanceInfraMapper } from '../finance-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { DonationDetailFilterDto } from '../../application/dto/donation.dto';

@Injectable()
class DonationRepository implements IDonationRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findPaged(filter?: BaseFilter<DonationDetailFilterDto>): Promise<PagedResult<Donation>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { raisedDate: 'desc' },
        include: {
          donor: true,
          transaction: true,
          paidToAccount: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.donation.count({ where }),
    ]);

    return new PagedResult<Donation>(
      data.map(m => FinanceInfraMapper.toDonationDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: DonationDetailFilterDto): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: this.whereQuery(filter),
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  private whereQuery(props?: DonationDetailFilterDto): Prisma.DonationWhereInput {
    const where: Prisma.DonationWhereInput = {
      ...(props?.type ? { type: props.type } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.donorId ? { donorId: props.donorId } : {}),
      ...(props?.startDate || props?.endDate
        ? {
            raisedDate: {
              ...(props.startDate ? { gte: props.startDate } : {}),
              ...(props.endDate ? { lte: props.endDate } : {}),
            },
          }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Donation | null> {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return FinanceInfraMapper.toDonationDomain(donation);
  }

  async findByDonorId(donorId: string): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { donorId, deletedAt: null },
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  async findByStatus(status: DonationStatus): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { status, deletedAt: null },
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  async findByType(type: DonationType): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { type, deletedAt: null },
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  async findPendingRegularDonations(): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: {
        type: DonationType.REGULAR,
        status: DonationStatus.RAISED,
        deletedAt: null,
      },
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: {
        raisedDate: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: { raisedDate: 'desc' },
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return donations.map(m => FinanceInfraMapper.toDonationDomain(m)!);
  }

  async create(donation: Donation): Promise<Donation> {
    const createData: Prisma.DonationUncheckedCreateInput = {
      ...FinanceInfraMapper.toDonationCreatePersistence(donation),
    };

    const created = await this.prisma.donation.create({
      data: createData,
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return FinanceInfraMapper.toDonationDomain(created)!;
  }

  async update(id: string, donation: Donation): Promise<Donation> {
    const updateData: Prisma.DonationUncheckedUpdateInput = {
      ...FinanceInfraMapper.toDonationUpdatePersistence(donation),
    };

    const updated = await this.prisma.donation.update({
      where: { id },
      data: updateData,
      include: {
        donor: true,
        transaction: true,
        paidToAccount: true,
      },
    });

    return FinanceInfraMapper.toDonationDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.donation.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}

export default DonationRepository;
