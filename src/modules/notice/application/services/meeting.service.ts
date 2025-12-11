import { Inject, Injectable } from '@nestjs/common';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { MeetingDetailDto, CreateMeetingDto, UpdateMeetingDto } from '../dto/meeting.dto';
import { MeetingDtoMapper } from '../dto/notice-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateMeetingUseCase } from '../use-cases/create-meeting.use-case';
import { CreateMeetingWithGoogleUseCase } from '../use-cases/create-meeting-with-google.use-case';
import { UpdateMeetingUseCase } from '../use-cases/update-meeting.use-case';
import { UpdateMeetingWithGoogleUseCase } from '../use-cases/update-meeting-with-google.use-case';
import { ListMeetingsUseCase } from '../use-cases/list-meetings.use-case';
import { GetMeetingUseCase } from '../use-cases/get-meeting.use-case';

@Injectable()
export class MeetingService {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
    private readonly createMeetingUseCase: CreateMeetingUseCase,
    private readonly createMeetingWithGoogleUseCase: CreateMeetingWithGoogleUseCase,
    private readonly updateMeetingUseCase: UpdateMeetingUseCase,
    private readonly updateMeetingWithGoogleUseCase: UpdateMeetingWithGoogleUseCase,
    private readonly listMeetingsUseCase: ListMeetingsUseCase,
    private readonly getMeetingUseCase: GetMeetingUseCase,
  ) {}

  async list(filter: BaseFilter<any>): Promise<PagedResult<MeetingDetailDto>> {
    const result = await this.listMeetingsUseCase.execute(filter);
    return new PagedResult(
      result.content.map(m => MeetingDtoMapper.toDto(m)),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<MeetingDetailDto> {
    const meeting = await this.getMeetingUseCase.execute(id);
    return MeetingDtoMapper.toDto(meeting);
  }

  async create(dto: CreateMeetingDto & { attendeeUserIds?: string[] }): Promise<MeetingDetailDto> {
    // Use Google Calendar integration if it's an online meeting
    const useGoogle = dto.meetingType === 'ONLINE_VIDEO' || dto.meetingType === 'ONLINE_AUDIO';
    const meeting = useGoogle
      ? await this.createMeetingWithGoogleUseCase.execute(dto)
      : await this.createMeetingUseCase.execute(dto);
    return MeetingDtoMapper.toDto(meeting);
  }

  async update(id: string, dto: UpdateMeetingDto & { attendeeUserIds?: string[] }): Promise<MeetingDetailDto> {
    // Check if meeting has Google Calendar event
    const existingMeeting = await this.getMeetingUseCase.execute(id);
    const useGoogle = existingMeeting.extMeetingId !== undefined;
    
    const meeting = useGoogle
      ? await this.updateMeetingWithGoogleUseCase.execute({ id, dto, attendeeUserIds: dto.attendeeUserIds })
      : await this.updateMeetingUseCase.execute({ id, dto });
    return MeetingDtoMapper.toDto(meeting);
  }
}

