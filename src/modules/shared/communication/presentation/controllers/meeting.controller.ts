import { Body, Controller, Get, Put, Param, Query, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UpdateEventDto, MeetingDto, CreateMeetingDto } from "../../application/dto/meetings.dto";
import { ApiAutoResponse } from "src/shared/decorators/api-auto-response.decorator";
import { SuccessResponse } from "src/shared/models/response-model";
import { MeetingService } from "../../application/service/meeting.service";

@ApiTags(MeetingController.name)
@ApiBearerAuth('jwt')
@Controller('communication/meeting')
export class MeetingController {
    constructor(
        private readonly meetingService: MeetingService,
    ) { }

    @Post('create')
    @ApiAutoResponse(MeetingDto, { description: 'Meeting created successfully', wrapInSuccessResponse: true })
    async createMeeting(@Body() eventData: CreateMeetingDto) {
        return new SuccessResponse(
            await this.meetingService.createMeeting(eventData)
        );
    }

    @Get('list')
    @ApiAutoResponse(MeetingDto, { description: 'Meetings fetched successfully', wrapInSuccessResponse: true })
    async listMeetings(
        @Query('pageIndex') pageIndex?: number,
        @Query('pageSize') pageSize?: number) {
        return new SuccessResponse(
            await this.meetingService.list({ pageIndex, pageSize })
        );
    }

    @Put('update/:id')
    @ApiAutoResponse(MeetingDto, { description: 'Meeting updated successfully', wrapInSuccessResponse: true })
    async updateMeeting(
        @Param('id') eventId: string,
        @Body() updateData: UpdateEventDto
    ) {
        return new SuccessResponse(
            await this.meetingService.updateMeeting(eventId, updateData)
        );
    }
}
