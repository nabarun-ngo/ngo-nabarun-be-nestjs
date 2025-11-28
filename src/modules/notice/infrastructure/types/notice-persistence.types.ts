import { Prisma } from '@prisma/client';

/**
 * Notice Module Persistence Types
 * Defines type-safe Prisma query result types for Notice and Meeting entities
 */

// ===== NOTICE TYPES =====
export namespace NoticePersistence {
  export type Base = Prisma.NoticeGetPayload<{
    select: {
      id: true;
      title: true;
      description: true;
      status: true;
      noticeDate: true;
      publishDate: true;
      hasMeeting: true;
      creatorId: true;
      creatorRoleCode: true;
      meetingId: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithCreator = Prisma.NoticeGetPayload<{
    include: {
      creator: true;
    };
  }>;

  export type WithMeeting = Prisma.NoticeGetPayload<{
    include: {
      meeting: true;
    };
  }>;
}

// ===== MEETING TYPES =====
export namespace MeetingPersistence {
  export type Base = Prisma.MeetingGetPayload<{
    select: {
      id: true;
      extMeetingId: true;
      meetingSummary: true;
      meetingDescription: true;
      meetingLocation: true;
      meetingDate: true;
      meetingStartTime: true;
      meetingEndTime: true;
      meetingRefId: true;
      meetingType: true;
      status: true;
      meetingRemarks: true;
      meetingRefType: true;
      extAudioConferenceLink: true;
      extVideoConferenceLink: true;
      extHtmlLink: true;
      creatorEmail: true;
      extConferenceStatus: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithAttendees = Prisma.MeetingGetPayload<{
    include: {
      attendees: {
        include: {
          user: true;
        };
      };
    };
  }>;
}

