import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Notice } from '../../domain/model/notice.model';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';

@Injectable()
export class GetNoticeUseCase implements IUseCase<string, Notice> {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
  ) {}

  async execute(id: string): Promise<Notice> {
    const notice = await this.noticeRepository.findById(id);
    if (!notice) {
      throw new BusinessException(`Notice not found with id: ${id}`);
    }
    return notice;
  }
}

