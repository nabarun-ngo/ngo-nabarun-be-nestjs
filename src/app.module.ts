import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './modules/user/user.module';
import { JobProcessingModule } from './modules/shared/job-processing/job-processing.module';
import { DatabaseModule } from './modules/shared/database/database.module';
import { AuthModule } from './modules/shared/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';
import { WorkflowModule } from './modules/workflow/workflow.module';
import { FinanceModule } from './modules/finance/finance.module';
import { config } from './config/app.config';
import { DMSModule } from './modules/shared/dms/dms.module';
import { PublicModule } from './modules/public/public.module';
import { ProjectModule } from './modules/project/project.module';
import { CorrespondenceModule } from './modules/shared/correspondence/correspondence.module';
import { CommunicationModule } from './modules/shared/communication/communication.module';
import { CronModule } from './modules/shared/cron/cron.module';
import { DocumentGeneratorModule } from './modules/shared/document-generator/document-generator.module';
import { WorkflowEngineModule } from './modules/workflow-engine/workflow-engine.module';
import { NotificationModule } from './modules/shared/notification/notification.module';

@Module({
  controllers: [],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true, // Memory optimization
    }),
    EventEmitterModule.forRoot({
      wildcard: false,
      delimiter: '.',
      maxListeners: 10,
      verboseMemoryLeak: false,
    }),
    JobProcessingModule.forRoot({
      connection: {
        url: config.database.redisUrl,
      }
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new KeyvRedis(config.database.redisUrl),
          ],
        };
      },
    }),
    DatabaseModule.forRoot({
      postgresUrl: config.database.postgresUrl,
    }),
    UserModule,
    AuthModule,
    WorkflowModule,
    FinanceModule,
    DMSModule,
    DocumentGeneratorModule,
    PublicModule,
    ProjectModule,
    CorrespondenceModule,
    CommunicationModule,
    CronModule,
    NotificationModule
  ],
})
export class AppModule { }
