import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Notice } from '../../domain/model/notice.model';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { BusinessException } from '../../../../shared/exceptions/business-exception';
import { UpdateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class UpdateNoticeUseCase implements IUseCase<{ id: string; dto: UpdateNoticeDto }, Notice> {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
  ) {}

  async execute(request: { id: string; dto: UpdateNoticeDto }): Promise<Notice> {
    const notice = await this.noticeRepository.findById(request.id);
    if (!notice) {
      throw new BusinessException(`Notice not found with id: ${request.id}`);
    }

    notice.update({
      title: request.dto.title,
      description: request.dto.description,
      noticeDate: request.dto.noticeDate,
    });

    const updatedNotice = await this.noticeRepository.update(request.id, notice);
    return updatedNotice;
  }
}

