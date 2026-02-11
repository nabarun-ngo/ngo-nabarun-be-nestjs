import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { PrismaPostgresService } from './prisma-postgres.service';
import { ConfigService } from '@nestjs/config';
import { RedisHashCacheService } from './redis-hash-cache.service';
import { Redis } from 'ioredis';

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
        {
          provide: RedisHashCacheService,
          useFactory: () => {
            return new RedisHashCacheService(new Redis(options.redisUrl!));
          },
        },
      ],
      global: true,
      exports: [PrismaPostgresService, RedisHashCacheService],
    };
  }
}
