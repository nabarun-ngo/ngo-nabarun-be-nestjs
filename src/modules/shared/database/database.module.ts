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
        PrismaPostgresService],
      global: true,
      exports: [PrismaPostgresService],
    };
  }
}
