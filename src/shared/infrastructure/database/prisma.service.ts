import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from 'generated/prisma';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL!, // injected by Doppler
        },
      },
      log: ['error', 'warn'],
    });
  }
  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutdown: ${signal}`);
    await this.$disconnect();
    this.logger.debug('Database disconnected');
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log(`Connected to Database`)
  }
}