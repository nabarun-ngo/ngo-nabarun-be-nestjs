import { Module } from '@nestjs/common';

// Controllers
import { NoticeController } from './presentation/controllers/notice.controller';
import { MeetingController } from './presentation/controllers/meeting.controller';

// Use Cases
import { CreateNoticeUseCase } from './application/use-cases/create-notice.use-case';
import { UpdateNoticeUseCase } from './application/use-cases/update-notice.use-case';
import { ListNoticesUseCase } from './application/use-cases/list-notices.use-case';
import { GetNoticeUseCase } from './application/use-cases/get-notice.use-case';
import { PublishNoticeUseCase } from './application/use-cases/publish-notice.use-case';
import { GetDraftNoticesUseCase } from './application/use-cases/get-draft-notices.use-case';
import { CreateMeetingUseCase } from './application/use-cases/create-meeting.use-case';
import { CreateMeetingWithGoogleUseCase } from './application/use-cases/create-meeting-with-google.use-case';
import { UpdateMeetingUseCase } from './application/use-cases/update-meeting.use-case';
import { UpdateMeetingWithGoogleUseCase } from './application/use-cases/update-meeting-with-google.use-case';
import { ListMeetingsUseCase } from './application/use-cases/list-meetings.use-case';
import { GetMeetingUseCase } from './application/use-cases/get-meeting.use-case';

// Services
import { NoticeService } from './application/services/notice.service';
import { MeetingService } from './application/services/meeting.service';

// Repositories
import { NOTICE_REPOSITORY } from './domain/repositories/notice.repository.interface';
import { MEETING_REPOSITORY } from './domain/repositories/meeting.repository.interface';
import NoticeRepository from './infrastructure/persistence/notice.repository';
import MeetingRepository from './infrastructure/persistence/meeting.repository';
import { GoogleCalendarService } from './infrastructure/external/google-calendar.service';
import { UserModule } from '../user/user.module';

/**
 * Notice Module
 * Manages notices/announcements and meetings
 */
@Module({
  controllers: [
    NoticeController,
    MeetingController,
  ],
  imports: [
    UserModule, // For accessing user repository to get attendee emails
  ],
  providers: [
    // ===== NOTICE =====
    CreateNoticeUseCase,
    UpdateNoticeUseCase,
    ListNoticesUseCase,
    GetNoticeUseCase,
    PublishNoticeUseCase,
    GetDraftNoticesUseCase,
    NoticeService,
    {
      provide: NOTICE_REPOSITORY,
      useClass: NoticeRepository,
    },

    // ===== MEETING =====
    CreateMeetingUseCase,
    CreateMeetingWithGoogleUseCase,
    UpdateMeetingUseCase,
    UpdateMeetingWithGoogleUseCase,
    ListMeetingsUseCase,
    GetMeetingUseCase,
    MeetingService,
    GoogleCalendarService,
    {
      provide: MEETING_REPOSITORY,
      useClass: MeetingRepository,
    },
  ],
  exports: [
    NOTICE_REPOSITORY,
    MEETING_REPOSITORY,
    NoticeService,
    MeetingService,
  ],
})
export class NoticeModule {}

