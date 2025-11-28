import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { UpdateMeetingDto } from '../dto/meeting.dto';

@Injectable()
export class UpdateMeetingUseCase implements IUseCase<{ id: string; dto: UpdateMeetingDto }, Meeting> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(request: { id: string; dto: UpdateMeetingDto }): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(request.id);
    if (!meeting) {
      throw new BusinessException(`Meeting not found with id: ${request.id}`);
    }

    meeting.update({
      meetingSummary: request.dto.meetingSummary,
      meetingDescription: request.dto.meetingDescription,
      meetingLocation: request.dto.meetingLocation,
      meetingDate: request.dto.meetingDate,
      meetingStartTime: request.dto.meetingStartTime,
      meetingEndTime: request.dto.meetingEndTime,
      attendeeIds: request.dto.attendeeIds,
      meetingRemarks: request.dto.meetingRemarks,
    });

    const updatedMeeting = await this.meetingRepository.update(request.id, meeting);
    return updatedMeeting;
  }
}

