import { BaseRepository } from 'src/shared/models/repository.base';
import { Notification } from '../models/notification.model';


export interface INotificationRepository extends BaseRepository<Notification, string> {
    bulkUpdate(notifications: Notification[]): Promise<void>;
}

export const INotificationRepository = Symbol('INotificationRepository');
