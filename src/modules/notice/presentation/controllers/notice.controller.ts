import {
  Controller,
  Get,
  Post,
  Patch,
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
  NoticeDetailDto,
  NoticeDetailFilterDto,
  CreateNoticeDto,
  UpdateNoticeDto,
} from '../../application/dto/notice.dto';
import { NoticeService } from '../../application/services/notice.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult as PagedResultModel } from 'src/shared/models/paged-result';

/**
 * Notice Controller - matches legacy endpoints
 * Base path: /api/notice
 */
@ApiTags('notice-controller')
@Controller('notice')
export class NoticeController {
  constructor(
    private readonly noticeService: NoticeService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a new notice', description: "Authorities : hasAuthority('SCOPE_create:notice')" })
  @ApiAutoResponse(NoticeDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateNoticeDto): Promise<SuccessResponse<NoticeDetailDto>> {
    // TODO: Get creatorId from auth context
    const creatorId = ''; // Get from auth
    const notice = await this.noticeService.create(dto, creatorId);
    return new SuccessResponse(notice);
  }

  @Patch(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a specific notice', description: "Authorities : hasAuthority('SCOPE_update:notice')" })
  @ApiAutoResponse(NoticeDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateNoticeDto,
  ): Promise<SuccessResponse<NoticeDetailDto>> {
    const notice = await this.noticeService.update(id, dto);
    return new SuccessResponse(notice);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notice by ID', description: "Authorities : hasAuthority('SCOPE_read:notice')" })
  @ApiAutoResponse(NoticeDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<NoticeDetailDto>> {
    const notice = await this.noticeService.getById(id);
    return new SuccessResponse(notice);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all notices', description: "Authorities : hasAuthority('SCOPE_read:notice')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: NoticeDetailFilterDto): Promise<SuccessResponse<PagedResultModel<NoticeDetailDto>>> {
    const baseFilter: BaseFilter<NoticeDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.noticeService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('getDraftedNotice')
  @ApiOperation({ summary: 'Get drafted notices', description: "Authorities : hasAuthority('SCOPE_read:notice')" })
  @ApiAutoResponse('array', { description: 'OK' })
  async getDraftedNotice(): Promise<SuccessResponse<NoticeDetailDto[]>> {
    const notices = await this.noticeService.getDraftNotices();
    return new SuccessResponse(notices);
  }
}

