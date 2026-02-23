import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { PrismaPostgresService } from './prisma-postgres.service';
import { ConfigService } from '@nestjs/config';
import { RedisHashCacheService } from './redis-hash-cache.service';
import { Redis } from 'ioredis';
import { RedisStoreService } from './redis-store.service';
import { LockingService } from './locking.service';

export interface DatabaseOptions {
  mongoUrl?: string;
  postgresUrl?: string;
  redisUrl?: string;
}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [],
      providers: [
        {
          provide: 'POSTGRES_URL',
          useValue: options.postgresUrl,
        },
        {
          provide: 'MONGO_URL',
          useValue: options.mongoUrl,
        },
        PrismaPostgresService,
        LockingService,
        {
          provide: 'REDIS_CLIENT',
          useFactory: () => {
            return new Redis(options.redisUrl || 'redis://localhost:6379');
          },
        },
        {
          provide: RedisHashCacheService,
          useFactory: (redis: Redis) => {
            return new RedisHashCacheService(redis);
          },
          inject: ['REDIS_CLIENT'],
        },
        {
          provide: RedisStoreService,
          useFactory: (redis: Redis) => {
            return new RedisStoreService(redis);
          },
          inject: ['REDIS_CLIENT'],
        },
      ],
      global: true,
      exports: [PrismaPostgresService, RedisHashCacheService, RedisStoreService, 'REDIS_CLIENT', LockingService],
    };
  }
}
