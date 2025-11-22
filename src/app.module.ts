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
import { config } from './config/config';
import { DMSModule } from './modules/shared/dms/dms.module';
import { PublicModule } from './modules/shared/public/public.module';

@Module({
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
    PublicModule
  ],
})
export class AppModule { }
