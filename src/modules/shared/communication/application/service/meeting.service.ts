import { Inject, Injectable } from "@nestjs/common";
import { type IMeetingRepository, MEETING_REPOSITORY } from "../../domain/repositories/meeting.repository.interface";
import { CreateMeetingUseCase } from "../use-cases/create-meeting.use-case";
import { UpdateMeetingUseCase } from "../use-cases/update-meeting.use-case";
import { CreateMeetingDto, MeetingDto, UpdateEventDto } from "../dto/meetings.dto";
import { toMeetingDto } from "../dto/meeting.mapper";
import { BaseFilter } from "src/shared/models/base-filter-props";
import { PagedResult } from "src/shared/models/paged-result";

@Injectable()
export class MeetingService {
    constructor(
        @Inject(MEETING_REPOSITORY)
        private readonly meetingRepository: IMeetingRepository,
        private readonly createMeetingUseCase: CreateMeetingUseCase,
        private readonly updateMeetingUseCase: UpdateMeetingUseCase
    ) { }

    async createMeeting(request: CreateMeetingDto): Promise<MeetingDto> {
        return toMeetingDto(await this.createMeetingUseCase.execute(request));
    }

    async updateMeeting(id: string, request: UpdateEventDto): Promise<MeetingDto> {
        return toMeetingDto(await this.updateMeetingUseCase.execute({ id, updateData: request }));
    }

    async list(filter: BaseFilter<any>) {
        const meetings = await this.meetingRepository.findPaged(filter);
        return new PagedResult(
            meetings.content.map(toMeetingDto),
            meetings.totalSize,
            filter.pageIndex!,
            filter.pageSize!
        );
    }
}