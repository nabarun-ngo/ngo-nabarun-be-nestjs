import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetMeetingUseCase implements IUseCase<string, Meeting> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(id: string): Promise<Meeting> {
    const meeting = await this.meetingRepository.findById(id);
    if (!meeting) {
      throw new BusinessException(`Meeting not found with id: ${id}`);
    }
    return meeting;
  }
}

