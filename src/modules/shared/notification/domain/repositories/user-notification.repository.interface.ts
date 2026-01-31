import { BaseRepository } from 'src/shared/models/repository.base';
import { Notification } from '../models/notification.model';


export interface IUserNotificationRepository extends BaseRepository<Notification, string> {
    bulkUpdate(notifications: Notification[]): Promise<void>;
    findByUserIdAndNotificationId(userId: string, notificationId: string): Promise<Notification | null>;
}

export const IUserNotificationRepository = Symbol('IUserNotificationRepository');
