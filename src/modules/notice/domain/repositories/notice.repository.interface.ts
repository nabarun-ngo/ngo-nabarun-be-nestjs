import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Notice, NoticeStatus } from '../model/notice.model';

export interface INoticeRepository extends IRepository<Notice, string> {
  findById(id: string): Promise<Notice | null>;
  findByStatus(status: NoticeStatus): Promise<Notice[]>;
  findByCreator(creatorId: string): Promise<Notice[]>;
  findDraftNotices(): Promise<Notice[]>;
  create(notice: Notice): Promise<Notice>;
  update(id: string, notice: Notice): Promise<Notice>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Notice[]>;
}

export const NOTICE_REPOSITORY = Symbol('NOTICE_REPOSITORY');

