import { calendar_v3 } from "@googleapis/calendar";
import { Meeting as MeetingEntity } from "@prisma/client";
import { Meeting, MeetingType, Participant } from "../../domain/model/meeting.model";
import { EventData } from "../external/google-calendar.service";

export class MeetingMapper {
    static fromGoogleEventToDto(event: calendar_v3.Schema$Event): EventData {
        const meetLink = event.hangoutLink ||
            event.conferenceData?.entryPoints?.find(ep => ep.entryPointType === 'video')?.uri;
        return {
            eventId: event.id ?? '',
            summary: event.summary ?? '(No title)',
            description: event.description ?? undefined,
            location: event.location ?? undefined,
            startTime: new Date(event.start?.dateTime || event.start?.date || ''),
            endTime: new Date(event.end?.dateTime || event.end?.date || ''),
            attendees: event.attendees?.map(a => a.email).filter((e): e is string => !!e) ?? [],
            meetLink: meetLink ?? undefined,
            calendarLink: event.htmlLink ?? '',
            status: event.status ?? 'unknown',
        };
    }

    static fromEntityToModel(entity: MeetingEntity): Meeting {
        return new Meeting(
            entity.id,
            entity.meetingSummary,
            entity.meetingType as MeetingType,
            entity.meetingDescription ?? '',
            new Date(entity.meetingStartTime!),
            new Date(entity.meetingEndTime!),
            entity.meetingAgenda ?? '',
            entity.status,
            entity.meetingLocation ?? '',
            JSON.parse(entity.attendees ?? '[]') as Participant[],//Attendees fix later
            entity.extHtmlLink ?? '',
            entity.extMeetingId ?? '',
            entity.meetingOutcomes ?? '',
            entity.extVideoConferenceLink ?? '',
            entity.createdAt,
            entity.updatedAt
        );
    }


}
