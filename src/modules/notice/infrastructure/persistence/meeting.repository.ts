import { Injectable } from '@nestjs/common';
import { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { Meeting, MeetingType, MeetingStatus } from '../../domain/model/meeting.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { NoticeInfraMapper } from '../notice-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

export interface MeetingFilter {
  meetingType?: string[];
  meetingStatus?: string[];
  meetingRefId?: string;
  meetingRefType?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export default class MeetingRepository implements IMeetingRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findPaged(filter?: BaseFilter<MeetingFilter>): Promise<PagedResult<Meeting>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.meeting.findMany({
        where,
        orderBy: { meetingDate: 'desc' },
        include: {
          attendees: {
            include: {
              user: true,
            },
          },
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.meeting.count({ where }),
    ]);

    return new PagedResult<Meeting>(
      data.map(m => {
        const attendeeIds = m.attendees.map(a => a.userId);
        return NoticeInfraMapper.toMeetingDomain(m, attendeeIds)!;
      }),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 10,
    );
  }

  async findAll(filter?: MeetingFilter): Promise<Meeting[]> {
    const meetings = await this.prisma.meeting.findMany({
      where: this.whereQuery(filter),
      orderBy: { meetingDate: 'desc' },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    return meetings.map(m => {
      const attendeeIds = m.attendees.map(a => a.userId);
      return NoticeInfraMapper.toMeetingDomain(m, attendeeIds)!;
    });
  }

  private whereQuery(props?: MeetingFilter): Prisma.MeetingWhereInput {
    const where: Prisma.MeetingWhereInput = {
      ...(props?.meetingType && props.meetingType.length > 0
        ? { meetingType: { in: props.meetingType } }
        : {}),
      ...(props?.meetingStatus && props.meetingStatus.length > 0
        ? { status: { in: props.meetingStatus } }
        : {}),
      ...(props?.meetingRefId ? { meetingRefId: props.meetingRefId } : {}),
      ...(props?.meetingRefType ? { meetingRefType: props.meetingRefType } : {}),
      ...(props?.startDate || props?.endDate
        ? {
            meetingDate: {
              ...(props.startDate ? { gte: props.startDate } : {}),
              ...(props.endDate ? { lte: props.endDate } : {}),
            },
          }
        : {}),
      deletedAt: null,
    };
    return where;
  }

  async findById(id: string): Promise<Meeting | null> {
    const meeting = await this.prisma.meeting.findUnique({
      where: { id },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!meeting) return null;

    const attendeeIds = meeting.attendees.map(a => a.userId);
    return NoticeInfraMapper.toMeetingDomain(meeting, attendeeIds);
  }

  async findByType(type: MeetingType): Promise<Meeting[]> {
    const meetings = await this.prisma.meeting.findMany({
      where: { meetingType: type, deletedAt: null },
      orderBy: { meetingDate: 'desc' },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    return meetings.map(m => {
      const attendeeIds = m.attendees.map(a => a.userId);
      return NoticeInfraMapper.toMeetingDomain(m, attendeeIds)!;
    });
  }

  async findByStatus(status: MeetingStatus): Promise<Meeting[]> {
    const meetings = await this.prisma.meeting.findMany({
      where: { status, deletedAt: null },
      orderBy: { meetingDate: 'desc' },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    return meetings.map(m => {
      const attendeeIds = m.attendees.map(a => a.userId);
      return NoticeInfraMapper.toMeetingDomain(m, attendeeIds)!;
    });
  }

  async findByRefId(refId: string): Promise<Meeting[]> {
    const meetings = await this.prisma.meeting.findMany({
      where: { meetingRefId: refId, deletedAt: null },
      orderBy: { meetingDate: 'desc' },
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    return meetings.map(m => {
      const attendeeIds = m.attendees.map(a => a.userId);
      return NoticeInfraMapper.toMeetingDomain(m, attendeeIds)!;
    });
  }

  async create(meeting: Meeting): Promise<Meeting> {
    const attendeeIds = meeting.attendeeIds;
    const createData: Prisma.MeetingUncheckedCreateInput = {
      ...NoticeInfraMapper.toMeetingCreatePersistence(meeting, attendeeIds),
    };

    const created = await this.prisma.meeting.create({
      data: createData,
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    const createdAttendeeIds = created.attendees.map(a => a.userId);
    return NoticeInfraMapper.toMeetingDomain(created, createdAttendeeIds)!;
  }

  async update(id: string, meeting: Meeting): Promise<Meeting> {
    const attendeeIds = meeting.attendeeIds;
    const updateData: Prisma.MeetingUncheckedUpdateInput = {
      ...NoticeInfraMapper.toMeetingUpdatePersistence(meeting, attendeeIds),
    };

    const updated = await this.prisma.meeting.update({
      where: { id },
      data: updateData,
      include: {
        attendees: {
          include: {
            user: true,
          },
        },
      },
    });

    const updatedAttendeeIds = updated.attendees.map(a => a.userId);
    return NoticeInfraMapper.toMeetingDomain(updated, updatedAttendeeIds)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.meeting.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }
}
