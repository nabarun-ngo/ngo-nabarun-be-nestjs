import { Inject, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Configkey } from "src/shared/config-keys";
import { INotificationRepository } from "../../domain/repositories/notification.repository.interface";
import { IFcmTokenRepository } from "../../domain/repositories/fcm-token.repository.interface";
import { ProcessJob } from "src/modules/shared/job-processing/application/decorators/process-job.decorator";
import { JobName } from "src/shared/job-names";
import { Job } from "bullmq";

@Injectable()
export class NotificationJobsHandler {

    constructor(
        @Inject(INotificationRepository)
        private readonly notificationRepository: INotificationRepository,
        @Inject(IFcmTokenRepository)
        private readonly fcmTokenRepository: IFcmTokenRepository,
        private readonly configService: ConfigService
    ) { }

    @ProcessJob({
        name: JobName.TriggerDeleteNotificationRequestEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        priority: 1
    })
    async handleDeleteNotificationRequestEvent(job: Job<any>) {
        const daysOld = this.configService.get<number>(Configkey.PROP_NOTIFICATION_KEEP_DAYS) ?? 90;
        const deletedCount = await this.notificationRepository.deleteOldNotifications(daysOld);
        job.log(`Deleted ${deletedCount} old notifications`);
        return { deletedCount: deletedCount };
    }

    @ProcessJob({
        name: JobName.TriggerDeleteFCMTokenRequestEvent,
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 2000,
        },
        priority: 1
    })
    async handleDeleteFCMTokenRequestEvent(job: Job<any>) {
        const daysOld = this.configService.get<number>(Configkey.PROP_FCMT_KEEP_DAYS) ?? 30;
        const deletedCount = await this.fcmTokenRepository.deleteInactiveTokens(daysOld);
        job.log(`Deleted ${deletedCount} old fcm tokens`);
        return { deletedCount: deletedCount };
    }
}