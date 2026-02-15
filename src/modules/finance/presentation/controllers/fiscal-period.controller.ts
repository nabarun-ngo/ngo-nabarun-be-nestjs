import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import {
  FiscalPeriodResponseDto,
  FiscalPeriodFilterDto,
  CloseFiscalPeriodDto,
} from '../../application/dto/fiscal-period.dto';
import { FiscalPeriodDtoMapper } from '../../application/dto/mapper/fiscal-period-dto.mapper';
import { FISCAL_PERIOD_REPOSITORY } from '../../domain/repositories/fiscal-period.repository.interface';
import type { IFiscalPeriodRepository } from '../../domain/repositories/fiscal-period.repository.interface';
import { Inject } from '@nestjs/common';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import type { AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';
import { FiscalPeriodFilter } from '../../domain/model/fiscal-period.model';
import { BusinessException } from 'src/shared/exceptions/business-exception';

@ApiTags('FiscalPeriod')
@Controller('fiscal-period')
@ApiBearerAuth('jwt')
export class FiscalPeriodController {
  constructor(
    @Inject(FISCAL_PERIOD_REPOSITORY)
    private readonly fiscalPeriodRepository: IFiscalPeriodRepository,
  ) {}

  @Get('list')
  @RequirePermissions('read:fiscal-periods')
  @ApiOperation({ summary: 'List fiscal periods' })
  @ApiAutoPagedResponse(FiscalPeriodResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async list(
    @Query() filterDto: FiscalPeriodFilterDto,
  ): Promise<SuccessResponse<PagedResult<FiscalPeriodResponseDto>>> {
    const props: FiscalPeriodFilter = {
      status: filterDto.status,
      code: filterDto.code,
    };
    const filter = new BaseFilter(
      props,
      filterDto.pageIndex ?? 0,
      filterDto.pageSize ?? 100,
    );
    const result = await this.fiscalPeriodRepository.findPaged(filter);
    const content = result.content.map((p) =>
      FiscalPeriodDtoMapper.toResponseDto(p),
    );
    const paged = new PagedResult<FiscalPeriodResponseDto>(
      content,
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(paged);
  }

  @Get('open-for-date')
  @RequirePermissions('read:fiscal-periods')
  @ApiOperation({ summary: 'Get open fiscal period for a given date' })
  @ApiAutoResponse(FiscalPeriodResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getOpenForDate(
    @Query('date') date: string,
  ): Promise<SuccessResponse<FiscalPeriodResponseDto | null>> {
    const d = date ? new Date(date) : new Date();
    const period = await this.fiscalPeriodRepository.findOpenPeriodForDate(d);
    const dto = period ? FiscalPeriodDtoMapper.toResponseDto(period) : null;
    return new SuccessResponse(dto);
  }

  @Get('by-code/:code')
  @RequirePermissions('read:fiscal-periods')
  @ApiOperation({ summary: 'Get fiscal period by code' })
  @ApiAutoResponse(FiscalPeriodResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getByCode(
    @Param('code') code: string,
  ): Promise<SuccessResponse<FiscalPeriodResponseDto | null>> {
    const period = await this.fiscalPeriodRepository.findByCode(code);
    const dto = period ? FiscalPeriodDtoMapper.toResponseDto(period) : null;
    return new SuccessResponse(dto);
  }

  @Get(':id')
  @RequirePermissions('read:fiscal-periods')
  @ApiOperation({ summary: 'Get fiscal period by id' })
  @ApiAutoResponse(FiscalPeriodResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getById(
    @Param('id') id: string,
  ): Promise<SuccessResponse<FiscalPeriodResponseDto | null>> {
    const period = await this.fiscalPeriodRepository.findById(id);
    const dto = period ? FiscalPeriodDtoMapper.toResponseDto(period) : null;
    return new SuccessResponse(dto);
  }

  @Post(':id/close')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('update:fiscal-periods')
  @ApiOperation({ summary: 'Close a fiscal period' })
  @ApiAutoResponse(FiscalPeriodResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async close(
    @Param('id') id: string,
    @Body() dto: CloseFiscalPeriodDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<FiscalPeriodResponseDto>> {
    const period = await this.fiscalPeriodRepository.findById(id);
    if (!period) {
      throw new BusinessException('Fiscal period not found');
    }
    const closedById = dto.closedById ?? user?.profile_id ?? '';
    period.close(closedById);
    const updated = await this.fiscalPeriodRepository.update(id, period);
    return new SuccessResponse(FiscalPeriodDtoMapper.toResponseDto(updated));
  }
}
