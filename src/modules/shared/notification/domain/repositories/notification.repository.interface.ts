import { BaseRepository } from 'src/shared/models/repository.base';
import { Notification, NotificationFilter } from '../models/notification.model';


export interface INotificationRepository extends BaseRepository<Notification, string, NotificationFilter> {
    bulkUpdate(notifications: Notification[]): Promise<void>;
}

export const INotificationRepository = Symbol('INotificationRepository');
