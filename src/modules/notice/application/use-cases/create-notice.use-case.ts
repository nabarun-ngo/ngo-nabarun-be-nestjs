import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Notice } from '../../domain/model/notice.model';
import { NOTICE_REPOSITORY } from '../../domain/repositories/notice.repository.interface';
import type { INoticeRepository } from '../../domain/repositories/notice.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateNoticeDto } from '../dto/notice.dto';

@Injectable()
export class CreateNoticeUseCase implements IUseCase<CreateNoticeDto & { creatorId: string }, Notice> {
  constructor(
    @Inject(NOTICE_REPOSITORY)
    private readonly noticeRepository: INoticeRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateNoticeDto & { creatorId: string }): Promise<Notice> {
    const notice = Notice.create({
      title: request.title,
      description: request.description,
      creatorId: request.creatorId,
      creatorRoleCode: request.creatorRoleCode,
      noticeDate: request.noticeDate,
      hasMeeting: request.hasMeeting || false,
      meetingId: request.meetingId,
    });

    const savedNotice = await this.noticeRepository.create(notice);

    // Emit domain events
    for (const event of savedNotice.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedNotice.clearEvents();

    return savedNotice;
  }
}

