import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaPostgresService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaPostgresService.name);

  constructor(@Inject('POSTGRES_URL') dbUrl: string) {
     super({
      datasources: {
        db: {
          url: dbUrl!, 
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