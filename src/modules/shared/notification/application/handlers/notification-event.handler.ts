import { Inject, Injectable, Logger } from "@nestjs/common";
import { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import { IFcmTokenRepository } from "../../domain/repositories/fcm-token.repository.interface";
import { OnEvent } from "@nestjs/event-emitter";
import { DeleteNotificationRequestEvent } from "../events/delete-notification-request.event";
import { DeleteFCMTokenRequestEvent } from "../events/delete-fcmtoken-request.event";
import { ConfigService } from "@nestjs/config";
import { Configkey } from "src/shared/config-keys";
import { ApplyTryCatch } from "src/shared/decorators/apply-try-catch.decorator";


@Injectable()
export class NotificationEventHandler {

    private readonly logger = new Logger(NotificationEventHandler.name);

    constructor(
        @Inject(INotificationRepository)
        private readonly notificationRepository: INotificationRepository,
        @Inject(IFcmTokenRepository)
        private readonly fcmTokenRepository: IFcmTokenRepository,
        private readonly configService: ConfigService
    ) { }

    @OnEvent(DeleteNotificationRequestEvent.name)
    @ApplyTryCatch()
    async handleDeleteNotificationRequestEvent(event: DeleteNotificationRequestEvent) {
        const daysOld = this.configService.get<number>(Configkey.PROP_NOTIFICATION_KEEP_DAYS) ?? 90;
        const deletedCount = await this.notificationRepository.deleteOldNotifications(daysOld);
        this.logger.log(`Deleted ${deletedCount} old notifications`);
        return { deletedCount: deletedCount };
    }

    @OnEvent(DeleteFCMTokenRequestEvent.name)
    @ApplyTryCatch()
    async handleDeleteFCMTokenRequestEvent(event: DeleteFCMTokenRequestEvent) {
        const daysOld = this.configService.get<number>(Configkey.PROP_FCMT_KEEP_DAYS) ?? 30;
        const deletedCount = await this.fcmTokenRepository.deleteInactiveTokens(daysOld);
        this.logger.log(`Deleted ${deletedCount} old fcm tokens`);
        return { deletedCount: deletedCount };
    }
}