import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMeetingDto } from '../dto/meeting.dto';
import { GoogleCalendarService } from '../../infrastructure/external/google-calendar.service';
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';

@Injectable()
export class CreateMeetingWithGoogleUseCase implements IUseCase<CreateMeetingDto & { attendeeUserIds?: string[] }, Meeting> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  async execute(request: CreateMeetingDto & { attendeeUserIds?: string[] }): Promise<Meeting> {
    // Create meeting domain entity
    const meeting = Meeting.create({
      meetingSummary: request.meetingSummary,
      meetingDate: request.meetingDate,
      meetingType: request.meetingType,
      meetingDescription: request.meetingDescription,
      meetingLocation: request.meetingLocation,
      meetingStartTime: request.meetingStartTime,
      meetingEndTime: request.meetingEndTime,
      meetingRefId: request.meetingRefId,
      meetingRefType: request.meetingRefType,
      attendeeIds: request.attendeeIds || request.attendeeUserIds || [],
      meetingRemarks: request.meetingRemarks,
      creatorEmail: request.creatorEmail,
    });

    // Save meeting first
    const savedMeeting = await this.meetingRepository.create(meeting);

    // Create Google Calendar event if it's an online meeting or if explicitly requested
    if (
      request.meetingType === 'ONLINE_VIDEO' ||
      request.meetingType === 'ONLINE_AUDIO' ||
      request.meetingType === 'OFFLINE' // Can also create calendar event for offline meetings
    ) {
      try {
        // Get attendee emails from user IDs
        const attendeeEmails: string[] = [];
        if (request.attendeeUserIds && request.attendeeUserIds.length > 0) {
          for (const userId of request.attendeeUserIds) {
            const user = await this.userRepository.findById(userId);
            if (user && user.email) {
              attendeeEmails.push(user.email);
            }
          }
        }
        // Add creator email if provided
        if (request.creatorEmail) {
          attendeeEmails.push(request.creatorEmail);
        }

        // Create Google Calendar event
        const googleEvent = await this.googleCalendarService.createEventFromMeeting(
          savedMeeting,
          attendeeEmails,
        );

        // Update meeting with Google Calendar details
        savedMeeting.markCreatedInGoogle(googleEvent.id, googleEvent.htmlLink);

        // Set conference links
        if (googleEvent.conferenceData?.entryPoints) {
          const videoLink = googleEvent.conferenceData.entryPoints.find(
            ep => ep.entryPointType === 'video',
          );
          const audioLink = googleEvent.conferenceData.entryPoints.find(
            ep => ep.entryPointType === 'phone',
          );

          savedMeeting.setConferenceLinks({
            videoLink: videoLink?.uri,
            audioLink: audioLink?.uri,
            htmlLink: googleEvent.htmlLink,
            status: 'created',
          });
        } else if (googleEvent.hangoutLink) {
          savedMeeting.setConferenceLinks({
            videoLink: googleEvent.hangoutLink,
            htmlLink: googleEvent.htmlLink,
            status: 'created',
          });
        }

        // Update meeting with Google Calendar info
        await this.meetingRepository.update(savedMeeting.id, savedMeeting);
      } catch (error) {
        // Log error but don't fail the meeting creation
        // Meeting is created locally, Google Calendar creation failed
        savedMeeting.markCreationFailed(true);
        await this.meetingRepository.update(savedMeeting.id, savedMeeting);
        // Re-throw to let caller know Google Calendar creation failed
        throw error;
      }
    }

    // Emit domain events
    for (const event of savedMeeting.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedMeeting.clearEvents();

    return savedMeeting;
  }
}

