import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import UserRepository from './infrastructure/persistence/user.repository';

@Module({
  controllers: [UserController],
  imports: [],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
  ],
  exports: [],
})
export class UserModule {}
