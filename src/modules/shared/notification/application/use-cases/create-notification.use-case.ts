import { Inject, Injectable, Logger } from "@nestjs/common";
import { IUseCase } from "src/shared/interfaces/use-case.interface";
import { Notification, NotificationCategory, NotificationPriority, NotificationType } from "../../domain/models/notification.model";
import { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import { IFcmTokenRepository } from "../../domain/repositories/fcm-token.repository.interface";
import { FirebaseMessagingService } from "../services/firebase-messaging.service";
import { IUserNotificationRepository } from "../../domain/repositories/user-notification.repository.interface";

class CreateNotification {
    userIds: string[];
    title: string;
    body: string;
    type: NotificationType;
    category: NotificationCategory;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionType?: string;
    actionData?: Record<string, any>;
    referenceId?: string;
    referenceType?: string;
    imageUrl?: string;
    icon?: string;
    metadata?: Record<string, any>;
    expiresAt?: Date;
    sendPush?: boolean;
}

@Injectable()
export class CreateNotificationUseCase implements IUseCase<CreateNotification, Notification> {

    private readonly logger = new Logger(CreateNotificationUseCase.name);

    constructor(
        @Inject(INotificationRepository)
        private readonly notificationRepository: INotificationRepository,
        @Inject(IUserNotificationRepository)
        private readonly userNotificationRepository: IUserNotificationRepository,
        @Inject(IFcmTokenRepository)
        private readonly fcmTokenRepository: IFcmTokenRepository,
        private readonly firebaseMessaging: FirebaseMessagingService,

    ) { }


    async execute(dto: CreateNotification): Promise<Notification> {

        // Create notification
        const notification = Notification.create({
            title: dto.title,
            body: dto.body,
            type: dto.type,
            category: dto.category,
            priority: dto.priority,
            action: {
                url: dto.actionUrl,
                type: dto.actionType,
                data: dto.actionData,
            },
            referenceId: dto.referenceId,
            referenceType: dto.referenceType,
            imageUrl: dto.imageUrl,
            icon: dto.icon,
            metadata: dto.metadata,
            expiresAt: dto.expiresAt,
        });
        notification.sendToUserIds = dto.userIds;
        // Save to database
        await this.notificationRepository.create(notification);

        // Send push notification if requested
        if (dto.sendPush !== false) {
            for (const userId of dto.userIds) {
                await this.sendPushNotification(userId, notification);
            }
        }
        return notification;
    }


    /**
    * Send push notification for a notification
    */
    private async sendPushNotification(userId: string, notification: Notification): Promise<void> {
        const tokens = await this.fcmTokenRepository.findActiveByUserId(userId);

        if (tokens.length === 0) {
            this.logger.warn(`No active FCM tokens found for user ${userId}`);
            return;
        }

        const tokenStrings = tokens.map(t => t.token);

        const result = await this.firebaseMessaging.sendToDevices(tokenStrings, {
            title: notification.title,
            body: notification.body,
            imageUrl: notification.imageUrl,
            icon: notification.icon,
            data: {
                notificationId: notification.id,
                type: notification.type,
                category: notification.category,
                ...(notification.action?.url && { actionUrl: notification.action.url }),
                ...(notification.referenceId && { referenceId: notification.referenceId }),
                ...(notification.referenceType && { referenceType: notification.referenceType }),
            },
        });

        const userNotification = await this.userNotificationRepository.findByUserIdAndNotificationId(userId, notification.id);
        if (!userNotification) {
            return;
        }
        // Update notification with push status
        userNotification.markPushSent(
            result.successCount > 0,
            result.failureCount > 0 ? `${result.failureCount} failures. ${JSON.stringify(result.errors)}` : undefined
        );
        await this.userNotificationRepository.update(userNotification.userNotificationId!, userNotification);

        this.logger.log(
            `Push notification sent for notification ${notification.id}: ` +
            `${result.successCount} success, ${result.failureCount} failures`
        );
    }
}