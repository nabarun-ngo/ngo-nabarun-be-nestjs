import { Inject, Injectable } from '@nestjs/common';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { NoticeDetailDto, NoticeDetailFilterDto, CreateNoticeDto, UpdateNoticeDto } from '../dto/notice.dto';
import { NoticeDtoMapper } from '../dto/notice-dto.mapper';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateNoticeUseCase } from '../use-cases/create-notice.use-case';
import { UpdateNoticeUseCase } from '../use-cases/update-notice.use-case';
import { ListNoticesUseCase } from '../use-cases/list-notices.use-case';
import { GetNoticeUseCase } from '../use-cases/get-notice.use-case';
import { PublishNoticeUseCase } from '../use-cases/publish-notice.use-case';
import { GetDraftNoticesUseCase } from '../use-cases/get-draft-notices.use-case';

@Injectable()
export class NoticeService {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
    private readonly createNoticeUseCase: CreateNoticeUseCase,
    private readonly updateNoticeUseCase: UpdateNoticeUseCase,
    private readonly listNoticesUseCase: ListNoticesUseCase,
    private readonly getNoticeUseCase: GetNoticeUseCase,
    private readonly publishNoticeUseCase: PublishNoticeUseCase,
    private readonly getDraftNoticesUseCase: GetDraftNoticesUseCase,
  ) {}

  async list(filter: BaseFilter<NoticeDetailFilterDto>): Promise<PagedResult<NoticeDetailDto>> {
    const result = await this.listNoticesUseCase.execute(filter);
    // TODO: Fetch meetings for notices that have meetings
    const dtos = await Promise.all(
      result.content.map(async (notice) => {
        const meeting = notice.hasMeeting && notice.meetingId
          ? await this.meetingRepository.findById(notice.meetingId)
          : undefined;
        return NoticeDtoMapper.toDto(notice, meeting || undefined);
      })
    );
    return new PagedResult(dtos, result.totalSize, result.pageIndex, result.pageSize);
  }

  async getById(id: string): Promise<NoticeDetailDto> {
    const notice = await this.getNoticeUseCase.execute(id);
    const meeting = notice.hasMeeting && notice.meetingId
      ? await this.meetingRepository.findById(notice.meetingId)
      : undefined;
    return NoticeDtoMapper.toDto(notice, meeting || undefined);
  }

  async create(dto: CreateNoticeDto, creatorId: string): Promise<NoticeDetailDto> {
    const notice = await this.createNoticeUseCase.execute({ ...dto, creatorId });
    const meeting = notice.hasMeeting && notice.meetingId
      ? await this.meetingRepository.findById(notice.meetingId)
      : undefined;
    return NoticeDtoMapper.toDto(notice, meeting || undefined);
  }

  async update(id: string, dto: UpdateNoticeDto): Promise<NoticeDetailDto> {
    const notice = await this.updateNoticeUseCase.execute({ id, dto });
    const meeting = notice.hasMeeting && notice.meetingId
      ? await this.meetingRepository.findById(notice.meetingId)
      : undefined;
    return NoticeDtoMapper.toDto(notice, meeting || undefined);
  }

  async publish(id: string): Promise<NoticeDetailDto> {
    const notice = await this.publishNoticeUseCase.execute(id);
    const meeting = notice.hasMeeting && notice.meetingId
      ? await this.meetingRepository.findById(notice.meetingId)
      : undefined;
    return NoticeDtoMapper.toDto(notice, meeting || undefined);
  }

  async getDraftNotices(): Promise<NoticeDetailDto[]> {
    const notices = await this.getDraftNoticesUseCase.execute();
    return Promise.all(
      notices.map(async (notice) => {
        const meeting = notice.hasMeeting && notice.meetingId
          ? await this.meetingRepository.findById(notice.meetingId)
          : undefined;
        return NoticeDtoMapper.toDto(notice, meeting || undefined);
      })
    );
  }
}

