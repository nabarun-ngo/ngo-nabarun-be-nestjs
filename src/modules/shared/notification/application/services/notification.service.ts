import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { IFcmTokenRepository } from '../../domain/repositories/fcm-token.repository.interface';
import { FcmToken } from '../../domain/models/fcm-token.model';
import { PagedResult } from 'src/shared/models/paged-result';
import { RegisterFcmTokenDto, BulkNotificationDto, NotificationFiltersDto, NotificationResponseDto } from '../dto/notification.dto';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateNotificationUseCase } from '../use-cases/create-notification.use-case';
import { NotificationDtoMapper } from '../dto/notification-dto.mapper';
import { IUserNotificationRepository } from '../../domain/repositories/user-notification.repository.interface';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        @Inject(IUserNotificationRepository)
        private readonly userNotificationRepository: IUserNotificationRepository,
        @Inject(IFcmTokenRepository)
        private readonly fcmTokenRepository: IFcmTokenRepository,
        private readonly createNotificationUseCase: CreateNotificationUseCase,
    ) { }

    /**
     * Create bulk notifications
     */
    async createBulkNotifications(dto: BulkNotificationDto): Promise<NotificationResponseDto> {
        const notification = await this.createNotificationUseCase.execute({
            userIds: dto.userIds,
            title: dto.title,
            body: dto.body,
            type: dto.type,
            category: dto.category,
            priority: dto.priority,
            actionUrl: dto.actionUrl,
            sendPush: dto.sendPush,
        });
        return NotificationDtoMapper.toResponseDto(notification);
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(
        userId: string,
        filter?: BaseFilter<NotificationFiltersDto>,
    ): Promise<PagedResult<NotificationResponseDto>> {
        const pagedResult = await this.userNotificationRepository.findPaged({
            pageIndex: filter?.pageIndex,
            pageSize: filter?.pageSize,
            props: {
                userId,
                ...filter?.props,
                isRead: filter?.props?.isRead ? (filter?.props?.isRead === 'Y') : undefined,
                isArchived: filter?.props?.isArchived ? (filter?.props?.isArchived === 'Y') : undefined,
            }
        });
        return new PagedResult<NotificationResponseDto>(
            pagedResult.content.map(n => NotificationDtoMapper.toResponseDto(n!)),
            pagedResult.totalSize,
            pagedResult.pageIndex,
            pagedResult.pageSize
        );
    }


    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        return await this.userNotificationRepository.count({
            userId,
            isRead: false,
            isArchived: false,
        });
    }

    /**
     * Mark notification as read
     */
    async markAsRead(userId: string, notificationId: string): Promise<void> {
        const notification = await this.userNotificationRepository.findByUserIdAndNotificationId(userId, notificationId);
        if (!notification) {
            throw new Error(`Notification with ID ${notificationId} not found`);
        }
        notification.markAsRead();
        await this.userNotificationRepository.update(notification.userNotificationId!, notification);
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        const notifications = await this.userNotificationRepository.findAll({
            userId,
            isRead: false,
            isArchived: false,
        });

        for (const notification of notifications) {
            notification.markAsRead();
        }
        if (notifications.length > 0) {
            await this.userNotificationRepository.bulkUpdate(notifications.map(n => n.userNotificationId!), notifications[0]);
        }
    }

    /**
     * Archive a notification
     */
    async archiveNotification(userId: string, notificationId: string): Promise<void> {
        const notification = await this.userNotificationRepository.findByUserIdAndNotificationId(userId, notificationId);
        if (!notification) {
            throw new NotFoundException(`Notification with ID ${notificationId} not found`);
        }

        notification.archive();
        await this.userNotificationRepository.update(notification.userNotificationId!, notification);
    }

    /**
     * Register FCM token for a user
     */
    async registerFcmToken(userId: string, dto: RegisterFcmTokenDto): Promise<FcmToken> {
        // Check if token already exists
        const existingToken = await this.fcmTokenRepository.findByToken(dto.token);

        if (existingToken) {
            // Update existing token
            existingToken.activate();
            existingToken.updateLastUsed();
            return await this.fcmTokenRepository.update(existingToken.id, existingToken);
        }

        // Create new token
        const fcmToken = FcmToken.create({
            userId,
            token: dto.token,
            deviceType: dto.deviceType,
            deviceName: dto.deviceName,
            browser: dto.browser,
            os: dto.os,
        });

        return await this.fcmTokenRepository.create(fcmToken);
    }

    /**
     * Deactivate FCM token
     */
    async deactivateFcmToken(token: string): Promise<void> {
        await this.fcmTokenRepository.deactivateToken(token);
    }
}
