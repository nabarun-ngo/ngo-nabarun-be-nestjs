import { Module } from '@nestjs/common';
import { UserController } from './presentation/controllers/user.controller';
import { CreateUserUseCase } from './application/use-cases/create-user.use-case';
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import UserRepository from './infrastructure/persistence/user.repository';
import { UserEventsHandler } from './application/handlers/user-events.handler';
import { UserJobsHandler } from './application/handlers/user-jobs.handler';
import { Auth0UserService } from './infrastructure/external/auth0-user.service';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { UserMetadataService } from './infrastructure/external/user-metadata.service';
import { CorrespondenceModule } from '../shared/correspondence/correspondence.module';

@Module({
  controllers: [UserController],
  imports: [FirebaseModule,CorrespondenceModule],
  providers: [
    CreateUserUseCase,
    {
      provide: USER_REPOSITORY,
      useClass: UserRepository,
    },
    Auth0UserService,
    UserEventsHandler,
    UserJobsHandler,
    UserMetadataService
  ],
  exports: [],
})
export class UserModule {}
