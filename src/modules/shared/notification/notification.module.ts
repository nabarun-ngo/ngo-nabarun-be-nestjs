import { Module } from '@nestjs/common';
import { NotificationController } from './presentation/controllers/notification.controller';
import { NotificationService } from './application/services/notification.service';
import { FirebaseMessagingService } from './application/services/firebase-messaging.service';
import { NotificationRepository } from './infrastructure/persistence/notification.repository';
import { UserNotificationRepository } from './infrastructure/persistence/user-notification.repository';
import { FcmTokenRepository } from './infrastructure/persistence/fcm-token.repository';
import { INotificationRepository } from './domain/repositories/notification.repository.interface';
import { IUserNotificationRepository } from './domain/repositories/user-notification.repository.interface';
import { IFcmTokenRepository } from './domain/repositories/fcm-token.repository.interface';
import { DatabaseModule } from '../database/database.module';
import { CreateNotificationUseCase } from './application/use-cases/create-notification.use-case';
import { FirebaseModule } from '../firebase/firebase.module';
import { MetadataService } from './infrastructure/external/metadata.service';
import { NotificationEventHandler } from './application/handlers/notification-event.handler';

@Module({
    imports: [DatabaseModule, FirebaseModule],
    controllers: [NotificationController],
    providers: [
        NotificationService,
        FirebaseMessagingService,
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
        NotificationEventHandler
    ],
    exports: [NotificationService, FirebaseMessagingService, CreateNotificationUseCase],
})
export class NotificationModule { }
