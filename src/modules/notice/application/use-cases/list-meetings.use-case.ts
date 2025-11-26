import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Meeting } from '../../domain/model/meeting.model';
import { MEETING_REPOSITORY } from '../../domain/repositories/meeting.repository.interface';
import type { IMeetingRepository } from '../../domain/repositories/meeting.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';

export interface MeetingFilter {
  meetingType?: string[];
  meetingStatus?: string[];
  meetingRefId?: string;
  meetingRefType?: string;
  startDate?: Date;
  endDate?: Date;
}

@Injectable()
export class ListMeetingsUseCase implements IUseCase<BaseFilter<MeetingFilter>, PagedResult<Meeting>> {
  constructor(
    @Inject(MEETING_REPOSITORY)
    private readonly meetingRepository: IMeetingRepository,
  ) {}

  async execute(request: BaseFilter<MeetingFilter>): Promise<PagedResult<Meeting>> {
    // TODO: Implement paged filtering in repository
    const allMeetings = await this.meetingRepository.findAll();
    
    let filtered = allMeetings;
    
    if (request.props?.meetingType && request.props.meetingType.length > 0) {
      filtered = filtered.filter(m => request.props?.meetingType?.includes(m.meetingType));
    }
    if (request.props?.meetingStatus && request.props.meetingStatus.length > 0) {
      filtered = filtered.filter(m => request.props?.meetingStatus?.includes(m.status));
    }
    if (request.props?.meetingRefId) {
      filtered = filtered.filter(m => m.meetingRefId === request.props?.meetingRefId);
    }
    if (request.props?.meetingRefType) {
      filtered = filtered.filter(m => m.meetingRefType === request.props?.meetingRefType);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}

