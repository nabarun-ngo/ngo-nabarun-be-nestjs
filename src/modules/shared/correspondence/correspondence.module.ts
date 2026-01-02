import { Module } from '@nestjs/common';
import { GmailService } from './services/gmail.service';
import { CorrespondenceService } from './services/correspondence.service';
import { FirebaseModule } from '../firebase/firebase.module';
import helpers from 'handlebars-helpers';
import Handlebars from "handlebars";
import { NotificationHandler } from './handlers/notification.handler';
import { HttpModule } from '@nestjs/axios';

// Register all helpers
helpers({ handlebars: Handlebars });

@Module({
  imports: [FirebaseModule, HttpModule],
  controllers: [],
  providers: [
    GmailService, CorrespondenceService, NotificationHandler],
  exports: [CorrespondenceService],
})
export class CorrespondenceModule { }

