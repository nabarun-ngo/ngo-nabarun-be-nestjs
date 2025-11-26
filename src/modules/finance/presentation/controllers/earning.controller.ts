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
  EarningDetailDto,
  EarningDetailFilterDto,
  CreateEarningDto,
  UpdateEarningDto,
} from '../../application/dto/earning.dto';
import { EarningService } from '../../application/services/earning.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';

/**
 * Earning Controller - matches legacy endpoints
 * Base path: /api/earning
 */
@ApiTags('earning-controller')
@Controller('earning')
export class EarningController {
  constructor(
    private readonly earningService: EarningService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new earning', description: "Authorities : hasAuthority('SCOPE_create:earning')" })
  @ApiAutoResponse(EarningDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateEarningDto): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.create(dto);
    return new SuccessResponse(earning);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update earning details', description: "Authorities : hasAuthority('SCOPE_update:earning')" })
  @ApiAutoResponse(EarningDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEarningDto,
  ): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.update(id, dto);
    return new SuccessResponse(earning);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all earnings', description: "Authorities : hasAuthority('SCOPE_read:earning')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: EarningDetailFilterDto): Promise<SuccessResponse<PagedResult<EarningDetailDto>>> {
    const baseFilter: BaseFilter<EarningDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.earningService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('self/list')
  @ApiOperation({ summary: 'List own earnings', description: "Authorities : hasAuthority('SCOPE_read:earning')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelf(@Query() filter: EarningDetailFilterDto): Promise<SuccessResponse<PagedResult<EarningDetailDto>>> {
    // TODO: Filter by current user
    const baseFilter: BaseFilter<EarningDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.earningService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get earning by ID', description: "Authorities : hasAuthority('SCOPE_read:earning')" })
  @ApiAutoResponse(EarningDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.getById(id);
    return new SuccessResponse(earning);
  }
}

