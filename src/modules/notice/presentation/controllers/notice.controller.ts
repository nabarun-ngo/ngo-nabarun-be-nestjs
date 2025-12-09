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
import { SuccessResponse } from 'src/shared/models/response-model';
import {
  NoticeDetailDto,
  NoticeDetailFilterDto,
  CreateNoticeDto,
  UpdateNoticeDto,
} from '../../application/dto/notice.dto';
import { NoticeService } from '../../application/services/notice.service';
import { PagedResult, PagedResult as PagedResultModel } from 'src/shared/models/paged-result';

/**
 * Notice Controller - matches legacy endpoints
 * Base path: /api/notice
 */
@ApiTags('Notice')
@Controller('notice')
export class NoticeController {
  constructor(
    private readonly noticeService: NoticeService,
  ) { }

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
  async list(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: NoticeDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<NoticeDetailDto>>> {
    const result = await this.noticeService.list({
      pageIndex,
      pageSize,
      props: { ...filter },
    });
    return new SuccessResponse(result);
  }


}

