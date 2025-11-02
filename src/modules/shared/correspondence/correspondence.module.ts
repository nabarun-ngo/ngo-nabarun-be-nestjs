import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GmailService } from './services/gmail.service';
import { CorrespondenceService } from './services/correspondence.service';
import { FirebaseModule } from '../firebase/firebase.module';

@Module({
  imports: [ConfigModule,FirebaseModule],
  controllers: [],
  providers: [GmailService, CorrespondenceService],
  exports: [CorrespondenceService],
})
export class CorrespondenceModule {}

