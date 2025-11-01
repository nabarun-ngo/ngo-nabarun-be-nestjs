import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import UserRepository from './infrastructure/persistence/user.repository';
import { UserEventsHandler } from './application/handlers/user-events.handler';
import { UserJobsHandler } from './application/handlers/user-jobs.handler';
import { AuthModule } from '../shared/auth/auth.module';

@Module({
  controllers: [UserController],
  imports: [],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    UserEventsHandler,
    UserJobsHandler
  ],
  exports: [],
})
export class UserModule {}
