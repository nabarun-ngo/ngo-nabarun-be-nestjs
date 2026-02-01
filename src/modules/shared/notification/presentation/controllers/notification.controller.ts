import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Query,
    Delete,
    Patch,
    Request,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from '../../application/services/notification.service';
import {
    NotificationResponseDto,
    RegisterFcmTokenDto,
    BulkNotificationDto,
    NotificationFiltersDto,
} from '../../application/dto/notification.dto';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoPagedResponse, ApiAutoResponse, ApiAutoVoidResponse } from 'src/shared/decorators/api-auto-response.decorator';

@ApiTags(NotificationController.name)
@ApiBearerAuth('jwt')
@Controller('notifications')
export class NotificationController {
    constructor(private readonly notificationService: NotificationService) { }

    @Post('bulk')
    @ApiOperation({ summary: 'Create bulk notifications' })
    @ApiAutoResponse(NotificationResponseDto, { status: 201, description: 'Bulk notifications created successfully', wrapInSuccessResponse: true })
    async createBulkNotifications(@Body() dto: BulkNotificationDto) {
        const notifications = await this.notificationService.createBulkNotifications(dto);
        return new SuccessResponse(notifications);
    }

    @Get('me')
    @ApiOperation({ summary: 'Get my notifications' })
    @ApiQuery({ name: 'pageIndex', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiAutoPagedResponse(NotificationResponseDto, { status: 200, description: 'Notifications retrieved successfully', wrapInSuccessResponse: true, isArray: true })
    async getMyNotifications(
        @CurrentUser() user: AuthUser,
        @Query('pageIndex') pageIndex?: number,
        @Query('pageSize') pageSize?: number,
        @Query() filter?: NotificationFiltersDto,
    ) {
        const userId = user.profile_id!;
        const result = await this.notificationService.getUserNotifications(
            userId,
            {
                pageIndex,
                pageSize,
                props: filter,
            }
        );

        return new SuccessResponse(result);
    }

    @Get('me/unread-count')
    @ApiOperation({ summary: 'Get my unread notification count' })
    @ApiAutoResponse(Number, { status: 200, description: 'Unread count retrieved successfully', wrapInSuccessResponse: true })
    async getMyUnreadCount(@CurrentUser() user: AuthUser) {
        const userId = user.profile_id!;
        const count = await this.notificationService.getUnreadCount(userId);
        return new SuccessResponse(count ?? 0);
    }

    @Patch('me/update-as-read/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Mark notification as read' })
    @ApiAutoVoidResponse({ status: 200, description: 'Notification marked as read' })
    async markAsRead(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        await this.notificationService.markAsRead(user.profile_id!, id);
        return new SuccessResponse();
    }

    @Patch('me/update-as-read-all')
    @ApiOperation({ summary: 'Mark all my notifications as read' })
    @ApiAutoVoidResponse({ status: 200, description: 'All notifications marked as read' })
    async markAllAsRead(@CurrentUser() user: AuthUser) {
        const userId = user.profile_id!;
        await this.notificationService.markAllAsRead(userId);
        return new SuccessResponse();
    }

    @Patch('me/update-as-archive/:id')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Archive notification' })
    @ApiAutoVoidResponse({ status: 200, description: 'Notification archived' })
    async archiveNotification(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        await this.notificationService.archiveNotification(user.profile_id!, id);
        return new SuccessResponse();
    }


    @Post('fcm-token')
    @ApiOperation({ summary: 'Register FCM token for push notifications' })
    @ApiAutoResponse(String, { status: 200, description: 'FCM token registered successfully' })
    async registerFcmToken(@CurrentUser() user: AuthUser, @Body() dto: RegisterFcmTokenDto) {
        const userId = user.profile_id!;
        await this.notificationService.registerFcmToken(userId, dto);
        return new SuccessResponse("FCM token registered successfully");
    }

    @Delete('fcm-token/:token')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Deactivate FCM token' })
    @ApiAutoVoidResponse({ status: 200, description: 'FCM token deactivated' })
    async deactivateFcmToken(@Param('token') token: string) {
        await this.notificationService.deactivateFcmToken(token);
        return new SuccessResponse();
    }

}
