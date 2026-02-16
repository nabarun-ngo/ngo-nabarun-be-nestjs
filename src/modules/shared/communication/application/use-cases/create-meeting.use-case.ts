import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { CreateMeetingDto, MeetingDto } from '../dto/meetings.dto';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { GoogleCalendarService } from '../../infrastructure/external/google-calendar.service';
import { Meeting, MeetingType } from '../../domain/model/meeting.model';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DateTime } from 'luxon';

@Injectable()
export class CreateMeetingUseCase implements IUseCase<{ request: CreateMeetingDto, creatorId?: string }, Meeting> {
    constructor(
        @Inject(MEETING_REPOSITORY)
        private readonly meetingRepository: IMeetingRepository,
        private readonly googleCalendarService: GoogleCalendarService,
        private readonly eventEmitter: EventEmitter2
    ) { }

    async execute({ request, creatorId }: { request: CreateMeetingDto, creatorId?: string }): Promise<Meeting> {
        // 1. Create in Google Calendar
        const googleEvent = await this.googleCalendarService.createEvent({
            summary: request.summary,
            description: request.description ? `${request.description}\n\n` : '' + 'Agenda: ' + request.agenda?.map((agenda, index) => `\n${index + 1}. ${agenda.agenda}`).join('\n'),
            startTime: DateTime.fromISO(request.startTime, { zone: "Asia/Kolkata" }).toJSDate(),
            endTime: DateTime.fromISO(request.endTime, { zone: "Asia/Kolkata" }).toJSDate(),
            attendees: request.attendees.map((attendee) => attendee.email),
            location: request.location,
            timeZone: 'Asia/Kolkata',
            addMeetLink: request.type == MeetingType.ONLINE,
            meetingOptions: {
                guestsCanSeeOtherGuests: true,
                guestsCanModify: true,
                guestsCanInviteOthers: true,
                anyoneCanAddSelf: true
            },
            defaultReminder: false,
            reminders: request.type == MeetingType.ONLINE ? [
                {
                    method: 'popup',
                    minutes: 10,
                },
                {
                    method: 'popup',
                    minutes: 30,
                },
                {
                    method: 'popup',
                    minutes: 60,
                },
                {
                    method: 'email',
                    minutes: 60,
                },
            ] : [
                {
                    method: 'popup',
                    minutes: 1 * 60,
                },
                {
                    method: 'popup',
                    minutes: 2 * 60,
                },
                {
                    method: 'popup',
                    minutes: 4 * 60,
                },
                {
                    method: 'popup',
                    minutes: 6 * 60,
                },
                {
                    method: 'email',
                    minutes: 6 * 60,
                },
            ],
        });

        // 2. Create Domain Model
        const meeting = Meeting.create({
            agenda: request.agenda ?? [],
            description: request.description ?? '',
            location: request.location ?? '',
            summary: request.summary,
            type: request.type,
            startTime: DateTime.fromISO(request.startTime, { zone: "Asia/Kolkata" }).toJSDate(),
            endTime: DateTime.fromISO(request.endTime, { zone: "Asia/Kolkata" }).toJSDate(),
            attendees: request.attendees,
            status: googleEvent.status ?? '',
            hostEmail: googleEvent.hostEmail,
            creator: { id: creatorId },
        })

        meeting.addExtEvent(
            googleEvent.eventId!,
            googleEvent.meetLink!,
            googleEvent.calendarLink!,
        )

        // 3. Save to Repository
        const savedMeeting = await this.meetingRepository.create(meeting);

        // Emit domain events
        for (const event of meeting.domainEvents) {
            this.eventEmitter.emit(event.constructor.name, event);
        }
        meeting.clearEvents();

        return savedMeeting;
    }
}
