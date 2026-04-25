import { Global, Module } from '@nestjs/common';
import { GmailService } from './application/services/gmail.service';
import { CorrespondenceService } from './application/services/correspondence.service';
import { FirebaseModule } from '../firebase/firebase.module';
import { NotificationHandler } from './application/handlers/notification.handler';
import { HttpModule } from '@nestjs/axios';
import { CorrespondenceController } from './presentation/controllers/correspondence.controller';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { NotificationController } from './presentation/controllers/notification.controller';
import { NotificationService } from './application/services/notification.service';
import { FirebaseMessagingService } from './application/services/firebase-messaging.service';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { UserNotificationRepository } from './infrastructure/persistence/user-notification.repository';
import { FcmTokenRepository } from './infrastructure/persistence/fcm-token.repository';
import { INotificationRepository } from './domain/repositories/notification.repository.interface';
import { IUserNotificationRepository } from './domain/repositories/user-notification.repository.interface';
import { IFcmTokenRepository } from './domain/repositories/fcm-token.repository.interface';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { MetadataService } from './infrastructure/external/metadata.service';
import { NotificationJobsHandler } from './application/handlers/notification-jobs.handler';
import { IPushNotificationProvider } from './domain/interfaces/push-notification-provider.interface';
import { FirebasePushProvider } from './infrastructure/external/firebase-push.provider';
import { OneSignalPushProvider } from './infrastructure/external/onesignal-push.provider';

@Global()
@Module({
    imports: [FirebaseModule, HttpModule, AuthModule, DatabaseModule],
    controllers: [CorrespondenceController, NotificationController],
    providers: [
        GmailService,
        CorrespondenceService,
        NotificationHandler,
        NotificationService,
        FirebaseMessagingService,
        FirebasePushProvider,
        OneSignalPushProvider,
        {
            provide: IPushNotificationProvider,
            useClass: OneSignalPushProvider, // Use OneSignal as the default provider
        },
        {
            provide: INotificationRepository,
            useClass: NotificationRepository,
        },
        {
            provide: IUserNotificationRepository,
            useClass: UserNotificationRepository,
        },
        {
            provide: IFcmTokenRepository,
            useClass: FcmTokenRepository,
        },
        CreateNotificationUseCase,
        MetadataService,
        NotificationJobsHandler
    ],
    exports: [
        CorrespondenceService,
        NotificationService,
        FirebaseMessagingService,
        CreateNotificationUseCase,
        IPushNotificationProvider
    ],
})
export class CorrespondenceModule { }
