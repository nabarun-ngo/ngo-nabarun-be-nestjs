import { Injectable } from '@nestjs/common';
import { IDonationRepository } from '../../domain/repositories/donation.repository.interface';
import { Donation, DonationFilter, DonationStatus, DonationType } from '../../domain/model/donation.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { DonationDetailFilterDto } from '../../application/dto/donation.dto';
import { DonationInfraMapper } from '../mapper/donation-infra.mapper';

export type FullDonation = Prisma.DonationGetPayload<{
  include: {
    donor: true;
    paidToAccount: true;
    confirmedBy: true;
  };
}>;

export type OnlyDonation = Prisma.DonationGetPayload<{
  include: {
    donor: true;
    paidToAccount: false;
  };
}>;


@Injectable()
class DonationRepository implements IDonationRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async findPaged(filter?: BaseFilter<DonationFilter>): Promise<PagedResult<Donation>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.donation.findMany({
        where,
        orderBy: { raisedOn: 'desc' },
        include: {
          donor: true,
          paidToAccount: true,
          confirmedBy: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.donation.count({ where }),
    ]);

    return new PagedResult<Donation>(
      data.map(m => DonationInfraMapper.toDonationDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: DonationDetailFilterDto): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: this.whereQuery(filter),
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  private whereQuery(props?: DonationFilter): Prisma.DonationWhereInput {
    const where: Prisma.DonationWhereInput = {
      ...(props?.type && props.type.length > 0 ? { type: { in: props.type } } : {}),
      ...(props?.status && props.status.length > 0 ? { status: { in: props.status } } : {}),
      ...(props?.donorId ? { donorId: props.donorId } : {}),
      ...(props?.donationId ? { id: props.donationId } : {}),
      ...(props?.startDate || props?.endDate
        ? {
          raisedOn: {
            ...(props.startDate ? { gte: props.startDate } : {}),
            ...(props.endDate ? { lte: props.endDate } : {}),
          },
        }
        : {}),
      ...(props?.startDate_lte ? { startDate: { lte: props.startDate_lte } } : {}),
      ...(props?.endDate_gte ? { endDate: { gte: props.endDate_gte } } : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Donation | null> {
    const donation = await this.prisma.donation.findUnique({
      where: { id },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return DonationInfraMapper.toDonationDomain(donation!);
  }

  async findByDonorId(donorId: string): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { donorId, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  async findByStatus(status: DonationStatus): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { status, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  async findByType(type: DonationType): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: { type, deletedAt: null },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  async findPendingRegularDonations(): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: {
        type: DonationType.REGULAR,
        status: DonationStatus.RAISED,
        deletedAt: null,
      },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Donation[]> {
    const donations = await this.prisma.donation.findMany({
      where: {
        raisedOn: {
          gte: startDate,
          lte: endDate,
        },
        deletedAt: null,
      },
      orderBy: { raisedOn: 'desc' },
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return donations.map(m => DonationInfraMapper.toDonationDomain(m)!);
  }

  async create(donation: Donation): Promise<Donation> {
    const createData: Prisma.DonationUncheckedCreateInput = {
      ...DonationInfraMapper.toDonationCreatePersistence(donation),
    };

    const created = await this.prisma.donation.create({
      data: createData,
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return DonationInfraMapper.toDonationDomain(created)!;
  }

  async update(id: string, donation: Donation): Promise<Donation> {
    const updateData: Prisma.DonationUncheckedUpdateInput = {
      ...DonationInfraMapper.toDonationUpdatePersistence(donation),
    };

    const updated = await this.prisma.donation.update({
      where: { id },
      data: updateData,
      include: {
        donor: true,
        paidToAccount: true,
        confirmedBy: true,
      },
    });

    return DonationInfraMapper.toDonationDomain(updated)!;
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
