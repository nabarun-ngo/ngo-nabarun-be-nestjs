import { Module, DynamicModule, Global, Provider } from '@nestjs/common';
import { PrismaPostgresService } from './prisma-postgres.service';

export interface DatabaseOptions {
  mongoUrl?: string;
  postgresUrl?: string;

}

@Global()
@Module({})
export class DatabaseModule {
  static forRoot(options: DatabaseOptions): DynamicModule {
    const providers: Provider[] = [];

    if (options.postgresUrl) {
      providers.push({
        provide: 'POSTGRES_URL',
        useValue: options.postgresUrl,
      });
    }

    if (options.mongoUrl) {
      providers.push({
        provide: 'MONGO_URL',
        useValue: options.mongoUrl,
      });
    }
    return {
      module: DatabaseModule,
      imports: [],
      providers: [...providers,PrismaPostgresService],
      global: true,
      exports: [PrismaPostgresService],
    };
  }
}
