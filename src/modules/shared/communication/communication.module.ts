import { Module, Global } from '@nestjs/common';
import { MeetingController } from './presentation/controllers/meeting.controller';
import { CreateMeetingUseCase } from './application/use-cases/create-meeting.use-case';
import { UpdateMeetingUseCase } from './application/use-cases/update-meeting.use-case';
import { DeleteMeetingUseCase } from './application/use-cases/delete-meeting.use-case';

import { GoogleCalendarService } from './infrastructure/external/google-calendar.service';
import { MEETING_REPOSITORY } from './domain/repositories/meeting.repository.interface';
import MeetingRepository from './infrastructure/persistence/meeting.repository';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { MeetingService } from './application/service/meeting.service';

@Global()
@Module({
    imports: [AuthModule, DatabaseModule],
    controllers: [MeetingController],
    providers: [
        // Use Cases
        CreateMeetingUseCase,
        UpdateMeetingUseCase,
        DeleteMeetingUseCase,
        // Infrastructure
        GoogleCalendarService,
        MeetingService,
        {
            provide: MEETING_REPOSITORY,
            useClass: MeetingRepository,
        },
    ],
    exports: [

        MEETING_REPOSITORY,
    ],
})
export class CommunicationModule { }
