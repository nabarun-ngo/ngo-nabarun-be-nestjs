import { BaseRepository } from 'src/shared/models/repository.base';
import { Notification, NotificationFilter } from '../models/notification.model';


export interface INotificationRepository extends BaseRepository<Notification, string, NotificationFilter> {
}

export const INotificationRepository = Symbol('INotificationRepository');
