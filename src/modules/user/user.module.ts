import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import UserRepository from './infrastructure/persistence/user.repository';
import { SharedModule } from 'src/shared/shared.module';
import { EmailJobProcessor } from './application/handlers/user-create.handler';

@Module({
  controllers: [UserController],
  imports: [SharedModule],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    EmailJobProcessor,
  ],
  exports: [],
})
export class UserModule {}
