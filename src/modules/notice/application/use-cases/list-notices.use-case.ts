import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Notice } from '../../domain/model/notice.model';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { BaseFilter } from '../../../../shared/models/base-filter-props';
import { PagedResult } from '../../../../shared/models/paged-result';
import { NoticeDetailFilterDto } from '../dto/notice.dto';

@Injectable()
export class ListNoticesUseCase implements IUseCase<BaseFilter<NoticeDetailFilterDto>, PagedResult<Notice>> {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
  ) {}

  async execute(request: BaseFilter<NoticeDetailFilterDto>): Promise<PagedResult<Notice>> {
    // TODO: Implement paged filtering in repository
    const allNotices = await this.noticeRepository.findAll();
    
    let filtered = allNotices;
    
    if (request.props?.status && request.props.status.length > 0) {
      filtered = filtered.filter(n => request.props?.status?.includes(n.status));
    }
    if (request.props?.creatorId) {
      filtered = filtered.filter(n => n.creatorId === request.props?.creatorId);
    }
    
    const page = request.pageIndex || 0;
    const size = request.pageSize || 10;
    const start = page * size;
    const end = start + size;
    const items = filtered.slice(start, end);
    
    return new PagedResult(items, filtered.length, page, size);
  }
}

