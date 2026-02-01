import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEnum, IsOptional, IsObject, IsBoolean, IsDateString } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { NotificationCategory, NotificationPriority, NotificationType } from '../../domain/models/notification.model';

//TODO: Remove this DTO
export class CreateNotificationDto {
    @ApiProperty({ description: 'User ID who will receive the notification' })
    @IsString()
    @IsNotEmpty()
    userId: string;

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Notification body/message' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiProperty({ enum: NotificationType, description: 'Notification type' })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ enum: NotificationCategory, description: 'Notification category' })
    @IsEnum(NotificationCategory)
    category: NotificationCategory;

    @ApiPropertyOptional({ enum: NotificationPriority, description: 'Notification priority', default: NotificationPriority.NORMAL })
    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;

    @ApiPropertyOptional({ description: 'Action URL when notification is clicked' })
    @IsString()
    @IsOptional()
    actionUrl?: string;

    @ApiPropertyOptional({ description: 'Action type' })
    @IsString()
    @IsOptional()
    actionType?: string;

    @ApiPropertyOptional({ description: 'Action data (JSON)' })
    @IsObject()
    @IsOptional()
    actionData?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Reference ID (e.g., workflow ID, donation ID)' })
    @IsString()
    @IsOptional()
    referenceId?: string;

    @ApiPropertyOptional({ description: 'Reference type (e.g., Workflow, Donation)' })
    @IsString()
    @IsOptional()
    referenceType?: string;

    @ApiPropertyOptional({ description: 'Image URL' })
    @IsString()
    @IsOptional()
    imageUrl?: string;

    @ApiPropertyOptional({ description: 'Icon name' })
    @IsString()
    @IsOptional()
    icon?: string;

    @ApiPropertyOptional({ description: 'Additional metadata (JSON)' })
    @IsObject()
    @IsOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional({ description: 'Expiration date' })
    @IsDateString()
    @IsOptional()
    expiresAt?: Date;

    @ApiPropertyOptional({ description: 'Send push notification', default: true })
    @IsBoolean()
    @IsOptional()
    sendPush?: boolean;
}

export class NotificationResponseDto {
    @ApiProperty()
    id: string;

    @ApiProperty()
    title: string;

    @ApiProperty()
    body: string;

    @ApiProperty({ enum: NotificationType })
    type: NotificationType;

    @ApiProperty({ enum: NotificationCategory })
    category: NotificationCategory;

    @ApiProperty({ enum: NotificationPriority })
    priority: NotificationPriority;

    @ApiPropertyOptional()
    actionUrl?: string;

    @ApiPropertyOptional()
    actionType?: string;

    @ApiPropertyOptional()
    actionData?: Record<string, any>;

    @ApiPropertyOptional()
    referenceId?: string;

    @ApiPropertyOptional()
    referenceType?: string;

    @ApiProperty()
    isRead: boolean;

    @ApiPropertyOptional()
    readAt?: Date;

    @ApiProperty()
    isArchived: boolean;

    @ApiPropertyOptional()
    archivedAt?: Date;

    @ApiProperty()
    isPushSent: boolean;

    @ApiPropertyOptional()
    pushSentAt?: Date;

    @ApiProperty()
    pushDelivered: boolean;

    @ApiPropertyOptional()
    imageUrl?: string;

    @ApiPropertyOptional()
    icon?: string;

    @ApiPropertyOptional()
    metadata?: Record<string, any>;

    @ApiPropertyOptional()
    expiresAt?: Date;

    @ApiProperty()
    createdAt: Date;

    @ApiProperty()
    updatedAt: Date;
}

export class NotificationFiltersDto {

    @ApiPropertyOptional({ enum: NotificationType })
    @IsEnum(NotificationType)
    @IsOptional()
    readonly type?: NotificationType;

    @ApiPropertyOptional({ enum: NotificationCategory })
    @IsEnum(NotificationCategory)
    @IsOptional()
    readonly category?: NotificationCategory;

    @ApiPropertyOptional({ enum: ['Y', 'N'] })
    @IsEnum(['Y', 'N'])
    @IsOptional()
    readonly isRead?: 'Y' | 'N';

    @ApiPropertyOptional({ enum: ['Y', 'N'] })
    @IsEnum(['Y', 'N'])
    @IsOptional()
    readonly isArchived?: 'Y' | 'N';

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    readonly referenceId?: string;

    @ApiPropertyOptional()
    @IsString()
    @IsOptional()
    readonly referenceType?: string;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    readonly fromDate?: Date;

    @ApiPropertyOptional()
    @IsDateString()
    @IsOptional()
    readonly toDate?: Date;
}

export class RegisterFcmTokenDto {
    @ApiProperty({ description: 'FCM token' })
    @IsString()
    @IsNotEmpty()
    token: string;

    @ApiPropertyOptional({ description: 'Device type (WEB, ANDROID, IOS)' })
    @IsString()
    @IsOptional()
    deviceType?: string;

    @ApiPropertyOptional({ description: 'Device name' })
    @IsString()
    @IsOptional()
    deviceName?: string;

    @ApiPropertyOptional({ description: 'Browser name' })
    @IsString()
    @IsOptional()
    browser?: string;

    @ApiPropertyOptional({ description: 'Operating system' })
    @IsString()
    @IsOptional()
    os?: string;
}

//TODO: Remove this DTO
export class BulkNotificationDto {
    @ApiProperty({ description: 'User IDs who will receive the notification', type: [String] })
    @IsString({ each: true })
    @IsNotEmpty()
    userIds: string[];

    @ApiProperty({ description: 'Notification title' })
    @IsString()
    @IsNotEmpty()
    title: string;

    @ApiProperty({ description: 'Notification body/message' })
    @IsString()
    @IsNotEmpty()
    body: string;

    @ApiProperty({ enum: NotificationType, description: 'Notification type' })
    @IsEnum(NotificationType)
    type: NotificationType;

    @ApiProperty({ enum: NotificationCategory, description: 'Notification category' })
    @IsEnum(NotificationCategory)
    category: NotificationCategory;

    @ApiPropertyOptional({ enum: NotificationPriority, description: 'Notification priority' })
    @IsEnum(NotificationPriority)
    @IsOptional()
    priority?: NotificationPriority;

    @ApiPropertyOptional({ description: 'Action URL when notification is clicked' })
    @IsString()
    @IsOptional()
    actionUrl?: string;

    @ApiPropertyOptional({ description: 'Send push notification', default: true })
    @IsBoolean()
    @IsOptional()
    sendPush?: boolean;
}
