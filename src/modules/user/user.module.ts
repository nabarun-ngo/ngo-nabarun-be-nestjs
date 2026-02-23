import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import UserRepository from './infrastructure/persistence/user.repository';
import { SystemEventsHandler } from './application/handlers/system-events.handler';
import { UserEventsHandler } from './application/handlers/user-events.handler';
import { UserJobsHandler } from './application/handlers/user-jobs.handler';
import { Auth0UserService } from './infrastructure/external/auth0-user.service';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { UserMetadataService } from './infrastructure/external/user-metadata.service';
import { UserService } from './application/services/user.service';
import { UpdateUserUseCase } from './application/use-cases/update-user.use-case';
import { AssignRoleUseCase } from './application/use-cases/assign-role.use-case';
import { DMSModule } from '../shared/dms/dms.module';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { DeleteUserUseCase } from './application/use-cases/delete-user.use-case';
import { AuthModule } from '../shared/auth/auth.module';

@Module({
  controllers: [UserController],
  imports: [FirebaseModule, DMSModule, AuthModule],
  providers: [
    CreateUserUseCase,
    UpdateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    Auth0UserService,
    UserEventsHandler,
    SystemEventsHandler,
    UserJobsHandler,
    UserMetadataService,
    UserService,
    AssignRoleUseCase,
    ChangePasswordUseCase,
    DeleteUserUseCase
  ],
  exports: [USER_REPOSITORY, CreateUserUseCase, DeleteUserUseCase],
})
export class UserModule { }
