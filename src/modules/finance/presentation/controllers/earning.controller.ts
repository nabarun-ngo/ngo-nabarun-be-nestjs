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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse, } from 'src/shared/models/response-model';
import {
  EarningDetailDto,
  EarningDetailFilterDto,
  CreateEarningDto,
  UpdateEarningDto,
} from '../../application/dto/earning.dto';
import { EarningService } from '../../application/services/earning.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';

/**
 * Earning Controller - matches legacy endpoints
 * Base path: /api/earning
 */
@ApiTags(EarningController.name)
@Controller('earning')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class EarningController {
  constructor(
    private readonly earningService: EarningService,
  ) { }

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('create:earning')
  @ApiOperation({ summary: 'Create new earning', description: "Authorities : 'create:earning'" })
  @ApiAutoResponse(EarningDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateEarningDto): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.create(dto);
    return new SuccessResponse(earning);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('update:earning')
  @ApiOperation({ summary: 'Update earning details', description: "Authorities : 'update:earning'" })
  @ApiAutoResponse(EarningDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEarningDto,
  ): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.update(id, dto);
    return new SuccessResponse(earning);
  }

  @Get('list')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('read:earning')
  @ApiOperation({ summary: 'List all earnings', description: "Authorities : 'read:earning'" })
  @ApiAutoPagedResponse(EarningDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async list(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: EarningDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<EarningDetailDto>>> {
    const result = await this.earningService.list({
      pageIndex,
      pageSize,
      props: { ...filter },
    });
    return new SuccessResponse(result);
  }

  @Get('list/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List own earnings' })
  @ApiAutoPagedResponse(EarningDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listSelf(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: EarningDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<EarningDetailDto>>> {
    const result = await this.earningService.list({
      pageIndex,
      pageSize,
      props: { ...filter, },
    });
    return new SuccessResponse(result);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('read:earning')
  @ApiOperation({ summary: 'Get earning by ID', description: "Authorities : 'read:earning'" })
  @ApiAutoResponse(EarningDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<EarningDetailDto>> {
    const earning = await this.earningService.getById(id);
    return new SuccessResponse(earning);
  }
}

