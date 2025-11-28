import { Injectable } from '@nestjs/common';
import { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { Notice, NoticeStatus } from '../../domain/model/notice.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { NoticeInfraMapper } from '../notice-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { NoticeDetailFilterDto } from '../../application/dto/notice.dto';

@Injectable()
export default class NoticeRepository implements INoticeRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findPaged(filter?: BaseFilter<NoticeDetailFilterDto>): Promise<PagedResult<Notice>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.notice.findMany({
        where,
        orderBy: { noticeDate: 'desc' },
        include: {
          creator: true,
          meeting: {
            include: {
              attendees: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.notice.count({ where }),
    ]);

    return new PagedResult<Notice>(
      data.map(m => NoticeInfraMapper.toNoticeDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: NoticeDetailFilterDto): Promise<Notice[]> {
    const notices = await this.prisma.notice.findMany({
      where: this.whereQuery(filter),
      orderBy: { noticeDate: 'desc' },
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return notices.map(m => NoticeInfraMapper.toNoticeDomain(m)!);
  }

  private whereQuery(props?: NoticeDetailFilterDto): Prisma.NoticeWhereInput {
    const where: Prisma.NoticeWhereInput = {
      ...(props?.status && props.status.length > 0
        ? { status: { in: props.status } }
        : {}),
      ...(props?.creatorId ? { creatorId: props.creatorId } : {}),
      ...(props?.startDate || props?.endDate
        ? {
            noticeDate: {
              ...(props.startDate ? { gte: props.startDate } : {}),
              ...(props.endDate ? { lte: props.endDate } : {}),
            },
          }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Notice | null> {
    const notice = await this.prisma.notice.findUnique({
      where: { id },
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NoticeInfraMapper.toNoticeDomain(notice);
  }

  async findByStatus(status: NoticeStatus): Promise<Notice[]> {
    const notices = await this.prisma.notice.findMany({
      where: { status, deletedAt: null },
      orderBy: { noticeDate: 'desc' },
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return notices.map(m => NoticeInfraMapper.toNoticeDomain(m)!);
  }

  async findByCreator(creatorId: string): Promise<Notice[]> {
    const notices = await this.prisma.notice.findMany({
      where: { creatorId, deletedAt: null },
      orderBy: { noticeDate: 'desc' },
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return notices.map(m => NoticeInfraMapper.toNoticeDomain(m)!);
  }

  async findDraftNotices(): Promise<Notice[]> {
    return this.findByStatus(NoticeStatus.DRAFT);
  }

  async create(notice: Notice): Promise<Notice> {
    const createData: Prisma.NoticeUncheckedCreateInput = {
      ...NoticeInfraMapper.toNoticeCreatePersistence(notice),
    };

    const created = await this.prisma.notice.create({
      data: createData,
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NoticeInfraMapper.toNoticeDomain(created)!;
  }

  async update(id: string, notice: Notice): Promise<Notice> {
    const updateData: Prisma.NoticeUncheckedUpdateInput = {
      ...NoticeInfraMapper.toNoticeUpdatePersistence(notice),
    };

    const updated = await this.prisma.notice.update({
      where: { id },
      data: updateData,
      include: {
        creator: true,
        meeting: {
          include: {
            attendees: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    return NoticeInfraMapper.toNoticeDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.notice.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
