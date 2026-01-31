import { Notification } from "../../domain/models/notification.model";
import { NotificationResponseDto } from "./notification.dto";

export class NotificationDtoMapper {
    static toResponseDto(notification: Notification): NotificationResponseDto {
        return {
            id: notification.id,
            title: notification.title,
            body: notification.body,
            type: notification.type,
            category: notification.category,
            priority: notification.priority,
            actionUrl: notification.action?.url,
            actionType: notification.action?.type,
            actionData: notification.action?.data,
            referenceId: notification.referenceId,
            referenceType: notification.referenceType,
            isRead: notification.isRead,
            readAt: notification.readAt,
            isArchived: notification.isArchived,
            archivedAt: notification.archivedAt,
            isPushSent: notification.isPushSent,
            pushSentAt: notification.pushSentAt,
            pushDelivered: notification.pushDelivered,
            imageUrl: notification.imageUrl,
            icon: notification.icon,
            metadata: notification.metadata,
            expiresAt: notification.expiresAt,
            createdAt: notification.createdAt,
            updatedAt: notification.updatedAt,
        };
    }
}