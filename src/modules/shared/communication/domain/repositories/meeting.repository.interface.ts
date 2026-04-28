import { Meeting, MeetingFilter } from '../model/meeting.model';
import { IRepository } from 'src/shared/interfaces/repository.interface';

export const MEETING_REPOSITORY = 'MEETING_REPOSITORY';

export interface IMeetingRepository extends IRepository<Meeting, string, MeetingFilter> {
    findByExtId(extId: string): Promise<Meeting | null>;
    findByTimeRange(startGte: Date, startLte: Date, endGte: Date, endLte: Date): Promise<Meeting[]>;
}
