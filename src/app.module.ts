import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UserModule } from './modules/user/user.module';
import { JobProcessingModule } from './modules/shared/job-processing/job-processing.module';
import { DatabaseModule } from './modules/shared/database/database.module';
import { AuthModule } from './modules/shared/auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

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
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      }
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => {
        return {
          stores: [
            new KeyvRedis('redis://localhost:6379'),
          ],
        };
      },
    }),
    DatabaseModule.forRoot({
      postgresUrl: process.env.POSTGRES_URL,
    }),
    UserModule,
    AuthModule
  ],
})
export class AppModule { }
