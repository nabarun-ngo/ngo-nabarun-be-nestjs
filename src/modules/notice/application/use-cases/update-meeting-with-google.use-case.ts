import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { UpdateMeetingDto } from '../dto/meeting.dto';
import { GoogleCalendarService } from '../../infrastructure/external/google-calendar.service';
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';

@Injectable()
export class UpdateMeetingWithGoogleUseCase implements IUseCase<{ id: string; dto: UpdateMeetingDto; attendeeUserIds?: string[] }, Meeting> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly googleCalendarService: GoogleCalendarService,
  ) {}

  async execute(request: { id: string; dto: UpdateMeetingDto; attendeeUserIds?: string[] }): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(request.id);
    if (!meeting) {
      throw new BusinessException(`Meeting not found with id: ${request.id}`);
    }

    // Update meeting domain entity
    meeting.update({
      meetingSummary: request.dto.meetingSummary,
      meetingDescription: request.dto.meetingDescription,
      meetingLocation: request.dto.meetingLocation,
      meetingDate: request.dto.meetingDate,
      meetingStartTime: request.dto.meetingStartTime,
      meetingEndTime: request.dto.meetingEndTime,
      attendeeIds: request.dto.attendeeIds || request.attendeeUserIds,
      meetingRemarks: request.dto.meetingRemarks,
    });

    // Update Google Calendar event if it exists
    if (meeting.extMeetingId) {
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
        // Also use attendeeIds from DTO if provided
        if (request.dto.attendeeIds && request.dto.attendeeIds.length > 0) {
          for (const userId of request.dto.attendeeIds) {
            const user = await this.userRepository.findById(userId);
            if (user && user.email) {
              attendeeEmails.push(user.email);
            }
          }
        }

        // Update Google Calendar event
        const googleEvent = await this.googleCalendarService.updateEventFromMeeting(
          meeting,
          meeting.extMeetingId,
          attendeeEmails,
        );

        // Update meeting status
        meeting.markUpdated(true);

        // Update conference links if changed
        if (googleEvent.conferenceData?.entryPoints) {
          const videoLink = googleEvent.conferenceData.entryPoints.find(
            ep => ep.entryPointType === 'video',
          );
          const audioLink = googleEvent.conferenceData.entryPoints.find(
            ep => ep.entryPointType === 'phone',
          );

          meeting.setConferenceLinks({
            videoLink: videoLink?.uri,
            audioLink: audioLink?.uri,
            htmlLink: googleEvent.htmlLink,
            status: 'updated',
          });
        }

        await this.meetingRepository.update(meeting.id, meeting);
      } catch (error) {
        // Log error but don't fail the meeting update
        // Meeting is updated locally, Google Calendar update failed
        meeting.markUpdated(false); // Mark as updated locally only
        await this.meetingRepository.update(meeting.id, meeting);
        // Re-throw to let caller know Google Calendar update failed
        throw error;
      }
    } else {
      // No Google Calendar event exists, just update locally
      await this.meetingRepository.update(meeting.id, meeting);
    }

    return meeting;
  }
}

