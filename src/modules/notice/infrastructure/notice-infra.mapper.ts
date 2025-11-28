import { Notice, NoticeStatus } from '../domain/model/notice.model';
import { Meeting, MeetingType, MeetingStatus, MeetingRefType } from '../domain/model/meeting.model';
import { Prisma } from '@prisma/client';
import {
  NoticePersistence,
  MeetingPersistence,
} from './types/notice-persistence.types';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

/**
 * Notice Infrastructure Mapper
 * Handles conversion between Prisma persistence models and Domain models
 */
export class NoticeInfraMapper {
  // ===== NOTICE MAPPERS =====

  static toNoticeDomain(p: NoticePersistence.Base | any): Notice | null {
    if (!p) return null;

    return new Notice(
      p.id,
      p.title,
      p.description,
      p.creatorId,
      p.noticeDate,
      p.status as NoticeStatus,
      MapperUtils.nullToUndefined(p.creatorRoleCode),
      MapperUtils.nullToUndefined(p.publishDate),
      p.hasMeeting,
      MapperUtils.nullToUndefined(p.meetingId),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toNoticeCreatePersistence(domain: Notice): Prisma.NoticeUncheckedCreateInput {
    return {
      id: domain.id,
      title: domain.title,
      description: domain.description,
      status: domain.status,
      noticeDate: domain.noticeDate,
      publishDate: MapperUtils.undefinedToNull(domain.publishDate),
      hasMeeting: domain.hasMeeting,
      creatorId: domain.creatorId,
      creatorRoleCode: MapperUtils.undefinedToNull(domain.creatorRoleCode),
      meetingId: MapperUtils.undefinedToNull(domain.meetingId),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toNoticeUpdatePersistence(domain: Notice): Prisma.NoticeUncheckedUpdateInput {
    return {
      title: domain.title,
      description: domain.description,
      status: domain.status,
      noticeDate: domain.noticeDate,
      publishDate: MapperUtils.undefinedToNull(domain.publishDate),
      hasMeeting: domain.hasMeeting,
      creatorRoleCode: MapperUtils.undefinedToNull(domain.creatorRoleCode),
      meetingId: MapperUtils.undefinedToNull(domain.meetingId),
      updatedAt: new Date(),
    };
  }

  // ===== MEETING MAPPERS =====

  static toMeetingDomain(p: MeetingPersistence.Base | any, attendeeIds?: string[]): Meeting | null {
    if (!p) return null;

    return new Meeting(
      p.id,
      p.meetingSummary,
      p.meetingDate,
      p.meetingType as MeetingType,
      p.status as MeetingStatus,
      MapperUtils.nullToUndefined(p.meetingDescription),
      MapperUtils.nullToUndefined(p.meetingLocation),
      MapperUtils.nullToUndefined(p.meetingStartTime),
      MapperUtils.nullToUndefined(p.meetingEndTime),
      MapperUtils.nullToUndefined(p.meetingRefId),
      attendeeIds || [],
      MapperUtils.nullToUndefined(p.meetingRemarks),
      MapperUtils.nullToUndefined(p.meetingRefType) as MeetingRefType | undefined,
      MapperUtils.nullToUndefined(p.extMeetingId),
      MapperUtils.nullToUndefined(p.extAudioConferenceLink),
      MapperUtils.nullToUndefined(p.extVideoConferenceLink),
      MapperUtils.nullToUndefined(p.extHtmlLink),
      MapperUtils.nullToUndefined(p.creatorEmail),
      MapperUtils.nullToUndefined(p.extConferenceStatus),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toMeetingCreatePersistence(domain: Meeting, attendeeIds: string[]): Prisma.MeetingUncheckedCreateInput {
    return {
      id: domain.id,
      extMeetingId: MapperUtils.undefinedToNull(domain.extMeetingId),
      meetingSummary: domain.meetingSummary,
      meetingDescription: MapperUtils.undefinedToNull(domain.meetingDescription),
      meetingLocation: MapperUtils.undefinedToNull(domain.meetingLocation),
      meetingDate: domain.meetingDate,
      meetingStartTime: MapperUtils.undefinedToNull(domain.meetingStartTime),
      meetingEndTime: MapperUtils.undefinedToNull(domain.meetingEndTime),
      meetingRefId: MapperUtils.undefinedToNull(domain.meetingRefId),
      meetingType: domain.meetingType,
      status: domain.status,
      meetingRemarks: MapperUtils.undefinedToNull(domain.meetingRemarks),
      meetingRefType: MapperUtils.undefinedToNull(domain.meetingRefType),
      extAudioConferenceLink: MapperUtils.undefinedToNull(domain.extAudioConferenceLink),
      extVideoConferenceLink: MapperUtils.undefinedToNull(domain.extVideoConferenceLink),
      extHtmlLink: MapperUtils.undefinedToNull(domain.extHtmlLink),
      creatorEmail: MapperUtils.undefinedToNull(domain.creatorEmail),
      extConferenceStatus: MapperUtils.undefinedToNull(domain.extConferenceStatus),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      attendees: {
        create: attendeeIds.map(userId => ({
          userId,
        })),
      },
    };
  }

  static toMeetingUpdatePersistence(domain: Meeting, attendeeIds?: string[]): Prisma.MeetingUncheckedUpdateInput {
    const update: Prisma.MeetingUncheckedUpdateInput = {
      meetingSummary: domain.meetingSummary,
      meetingDescription: MapperUtils.undefinedToNull(domain.meetingDescription),
      meetingLocation: MapperUtils.undefinedToNull(domain.meetingLocation),
      meetingDate: domain.meetingDate,
      meetingStartTime: MapperUtils.undefinedToNull(domain.meetingStartTime),
      meetingEndTime: MapperUtils.undefinedToNull(domain.meetingEndTime),
      meetingRemarks: MapperUtils.undefinedToNull(domain.meetingRemarks),
      extMeetingId: MapperUtils.undefinedToNull(domain.extMeetingId),
      status: domain.status,
      extAudioConferenceLink: MapperUtils.undefinedToNull(domain.extAudioConferenceLink),
      extVideoConferenceLink: MapperUtils.undefinedToNull(domain.extVideoConferenceLink),
      extHtmlLink: MapperUtils.undefinedToNull(domain.extHtmlLink),
      extConferenceStatus: MapperUtils.undefinedToNull(domain.extConferenceStatus),
      updatedAt: new Date(),
    };

    // Update attendees if provided
    if (attendeeIds !== undefined) {
      update.attendees = {
        deleteMany: {}, // Delete all existing
        create: attendeeIds.map(userId => ({
          userId,
        })),
      };
    }

    return update;
  }
}

