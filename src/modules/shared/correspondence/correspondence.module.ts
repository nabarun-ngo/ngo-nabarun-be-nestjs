import { Module } from '@nestjs/common';
import { GmailService } from './services/gmail.service';
import { CorrespondenceService } from './services/correspondence.service';
import { FirebaseModule } from '../firebase/firebase.module';
import helpers from 'handlebars-helpers';
import Handlebars from "handlebars";

// Register all helpers
helpers({ handlebars: Handlebars });

@Module({
  imports: [FirebaseModule],
  controllers: [],
  providers: [
    GmailService, CorrespondenceService],
  exports: [CorrespondenceService],
})
export class CorrespondenceModule { }

