import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Meeting, MeetingType, MeetingStatus } from '../model/meeting.model';

export interface IMeetingRepository extends IRepository<Meeting, string> {
  findById(id: string): Promise<Meeting | null>;
  findByType(type: MeetingType): Promise<Meeting[]>;
  findByStatus(status: MeetingStatus): Promise<Meeting[]>;
  findByRefId(refId: string): Promise<Meeting[]>;
  create(meeting: Meeting): Promise<Meeting>;
  update(id: string, meeting: Meeting): Promise<Meeting>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Meeting[]>;
}

export const MEETING_REPOSITORY = Symbol('MEETING_REPOSITORY');

