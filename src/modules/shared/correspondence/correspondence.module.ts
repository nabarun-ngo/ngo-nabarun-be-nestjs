import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GmailService } from './services/gmail.service';
import { CorrespondenceService } from './services/correspondence.service';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [GmailService, CorrespondenceService],
  exports: [CorrespondenceService],
})
export class CorrespondenceModule {}

