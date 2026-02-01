import { BaseRepository } from 'src/shared/models/repository.base';
import { Notification, NotificationFilter } from '../models/notification.model';


export interface IUserNotificationRepository extends BaseRepository<Notification, string, NotificationFilter> {
    bulkUpdate(notifications: Notification[]): Promise<void>;
    findByUserIdAndNotificationId(userId: string, notificationId: string): Promise<Notification | null>;
}

export const IUserNotificationRepository = Symbol('IUserNotificationRepository');
