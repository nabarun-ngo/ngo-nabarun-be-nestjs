import { Global, Module } from '@nestjs/common';
import { GmailService } from './services/gmail.service';
import { CorrespondenceService } from './services/correspondence.service';
import { FirebaseModule } from '../firebase/firebase.module';
import helpers from 'handlebars-helpers';
import Handlebars from "handlebars";
import { NotificationHandler } from './handlers/notification.handler';
import { HttpModule } from '@nestjs/axios';
import { CorrespondenceController } from './controllers/correspondence.controller';
import { AuthModule } from '../auth/auth.module';

// Register all helpers
helpers({ handlebars: Handlebars });

@Global()
@Module({
  imports: [FirebaseModule, HttpModule, AuthModule],
  controllers: [CorrespondenceController],
  providers: [
    GmailService, CorrespondenceService, NotificationHandler
  ],
  exports: [CorrespondenceService],
})
export class CorrespondenceModule { }
