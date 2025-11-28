import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Notice } from '../../domain/model/notice.model';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';

@Injectable()
export class GetDraftNoticesUseCase implements IUseCase<void, Notice[]> {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
  ) {}

  async execute(): Promise<Notice[]> {
    return await this.noticeRepository.findDraftNotices();
  }
}

