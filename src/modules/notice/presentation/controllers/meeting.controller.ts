import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse, PagedResult } from 'src/shared/models/response-model';
import {
  MeetingDetailDto,
  CreateMeetingDto,
  UpdateMeetingDto,
} from '../../application/dto/meeting.dto';
import { MeetingService } from '../../application/services/meeting.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult as PagedResultModel } from 'src/shared/models/paged-result';

/**
 * Meeting Controller
 * Base path: /api/meeting
 */
@ApiTags('meeting-controller')
@Controller('meeting')
export class MeetingController {
  constructor(
    private readonly meetingService: MeetingService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Create new meeting', 
    description: "Authorities : hasAuthority('SCOPE_create:meeting'). For ONLINE_VIDEO or ONLINE_AUDIO meetings, automatically creates Google Calendar event with Google Meet link." 
  })
  @ApiAutoResponse(MeetingDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateMeetingDto): Promise<SuccessResponse<MeetingDetailDto>> {
    const meeting = await this.meetingService.create(dto);
    return new SuccessResponse(meeting);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update meeting details', description: "Authorities : hasAuthority('SCOPE_update:meeting')" })
  @ApiAutoResponse(MeetingDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMeetingDto,
  ): Promise<SuccessResponse<MeetingDetailDto>> {
    const meeting = await this.meetingService.update(id, dto);
    return new SuccessResponse(meeting);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all meetings', description: "Authorities : hasAuthority('SCOPE_read:meeting')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: any): Promise<SuccessResponse<PagedResultModel<MeetingDetailDto>>> {
    const baseFilter: BaseFilter<any> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.meetingService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get meeting by ID', description: "Authorities : hasAuthority('SCOPE_read:meeting')" })
  @ApiAutoResponse(MeetingDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<MeetingDetailDto>> {
    const meeting = await this.meetingService.getById(id);
    return new SuccessResponse(meeting);
  }
}

