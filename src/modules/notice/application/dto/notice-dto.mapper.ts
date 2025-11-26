import { Notice, NoticeStatus } from '../../domain/model/notice.model';
import { NoticeDetailDto } from './notice.dto';
import { Meeting, MeetingType, MeetingStatus, MeetingRefType } from '../../domain/model/meeting.model';
import { MeetingDetailDto } from './meeting.dto';

/**
 * Notice DTO Mapper
 */
export class NoticeDtoMapper {
  static toDto(notice: Notice, meeting?: Meeting): NoticeDetailDto {
    return {
      id: notice.id,
      title: notice.title,
      description: notice.description,
      creator: notice.creatorId, // UserDetail reference - would need to fetch
      creatorRoleCode: notice.creatorRoleCode,
      noticeDate: notice.noticeDate,
      publishDate: notice.publishDate,
      noticeStatus: notice.status,
      hasMeeting: notice.hasMeeting,
      meeting: meeting ? MeetingDtoMapper.toDto(meeting) : undefined,
    };
  }
}

/**
 * Meeting DTO Mapper
 */
export class MeetingDtoMapper {
  static toDto(meeting: Meeting): MeetingDetailDto {
    return {
      id: meeting.id,
      extMeetingId: meeting.extMeetingId,
      meetingSummary: meeting.meetingSummary,
      meetingDescription: meeting.meetingDescription,
      meetingLocation: meeting.meetingLocation,
      meetingDate: meeting.meetingDate,
      meetingStartTime: meeting.meetingStartTime,
      meetingEndTime: meeting.meetingEndTime,
      meetingRefId: meeting.meetingRefId,
      meetingType: meeting.meetingType,
      meetingStatus: meeting.status,
      meetingAttendees: meeting.attendeeIds, // UserDetail references - would need to fetch
      meetingRemarks: meeting.meetingRemarks,
      meetingRefType: meeting.meetingRefType,
      extAudioConferenceLink: meeting.extAudioConferenceLink,
      extVideoConferenceLink: meeting.extVideoConferenceLink,
      extHtmlLink: meeting.extHtmlLink,
      creatorEmail: meeting.creatorEmail,
      extConferenceStatus: meeting.extConferenceStatus,
    };
  }
}

