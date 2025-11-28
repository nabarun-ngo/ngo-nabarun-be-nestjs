import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateMeetingDto } from '../dto/meeting.dto';

@Injectable()
export class CreateMeetingUseCase implements IUseCase<CreateMeetingDto, Meeting> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateMeetingDto): Promise<Meeting> {
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
      attendeeIds: request.attendeeIds,
      meetingRemarks: request.meetingRemarks,
      creatorEmail: request.creatorEmail,
    });

    const savedMeeting = await this.meetingRepository.create(meeting);

    // Emit domain events
    for (const event of savedMeeting.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedMeeting.clearEvents();

    return savedMeeting;
  }
}

