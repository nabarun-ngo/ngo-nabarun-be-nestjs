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
import { ApiAutoResponse, ApiAutoPrimitiveResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { PagedResult } from 'src/shared/models/paged-result';
import {
  DonationDto,
  ProcessDonationPaymentDto,
  DonationDetailFilterDto,
} from '../../application/dto/donation.dto';
import { DonationService } from '../../application/services/donation.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';

/**
 * Donation Controller - matches legacy endpoints
 * Base path: /api/donation
 */
@ApiTags('donation-controller')
@Controller('donation')
export class DonationController {
  constructor(
    private readonly donationService: DonationService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new donation', description: "Authorities : hasAuthority('SCOPE_create:donation')" })
  @ApiAutoResponse(DonationDto, { status: 200, description: 'OK' })
  async create(@Body() dto: DonationDto): Promise<SuccessResponse<DonationDto>> {
    const donation = await this.donationService.create(dto);
    return new SuccessResponse(donation);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update donation details', description: "Authorities : hasAuthority('SCOPE_update:donation')" })
  @ApiAutoResponse(DonationDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: Partial<DonationDto>,
  ): Promise<SuccessResponse<DonationDto>> {
    const donation = await this.donationService.update(id, dto);
    return new SuccessResponse(donation);
  }

  @Post(':id/payment')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Process payment for donation', description: "Authorities : hasAuthority('SCOPE_update:donation')" })
  @ApiAutoResponse(DonationDto, { status: 200, description: 'OK' })
  async processPayment(
    @Param('id') id: string,
    @Body() dto: ProcessDonationPaymentDto,
  ): Promise<SuccessResponse<DonationDto>> {
    const donation = await this.donationService.processPayment(id, dto);
    return new SuccessResponse(donation);
  }

  @Get(':id/documents')
  @ApiOperation({ summary: 'Get documents for donation', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse('array', { description: 'OK' })
  async getDocuments(@Param('id') id: string): Promise<SuccessResponse<any[]>> {
    // TODO: Implement document retrieval
    return new SuccessResponse([]);
  }

  @Get(':id/changes')
  @ApiOperation({ summary: 'Get donation changes/history', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse('array', { description: 'OK' })
  async getChanges(@Param('id') id: string): Promise<SuccessResponse<any[]>> {
    // TODO: Implement change history
    return new SuccessResponse([]);
  }

  @Get(':donorId/summary')
  @ApiOperation({ summary: 'Get donation summary for donor', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse('object', { description: 'OK' })
  async getDonorSummary(@Param('donorId') donorId: string): Promise<SuccessResponse<any>> {
    // TODO: Implement donor summary
    return new SuccessResponse({});
  }

  @Get(':donorId/list')
  @ApiOperation({ summary: 'Get donations by donor', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async getDonorDonations(
    @Param('donorId') donorId: string,
    @Query() query: any,
  ): Promise<SuccessResponse<PagedResult<DonationDto>>> {
    const filter: BaseFilter<DonationDetailFilterDto> = {
      pageIndex: query.pageIndex ? parseInt(query.pageIndex) : 0,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      props: {
        donorId,
        ...query,
      },
    };
    const result = await this.donationService.list(filter);
    return new SuccessResponse(result);
  }

  @Get('self/list')
  @ApiOperation({ summary: 'Get own donations', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async getSelfDonations(@Query() query: any): Promise<SuccessResponse<PagedResult<DonationDto>>> {
    // TODO: Get donorId from auth context
    const filter: BaseFilter<DonationDetailFilterDto> = {
      pageIndex: query.pageIndex ? parseInt(query.pageIndex) : 0,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      props: query,
    };
    const result = await this.donationService.list(filter);
    return new SuccessResponse(result);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all donations', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() query: any): Promise<SuccessResponse<PagedResult<DonationDto>>> {
    const filter: BaseFilter<DonationDetailFilterDto> = {
      pageIndex: query.pageIndex ? parseInt(query.pageIndex) : 0,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      props: query,
    };
    const result = await this.donationService.list(filter);
    return new SuccessResponse(result);
  }

  @Get('guest/list')
  @ApiOperation({ summary: 'List guest donations', description: "Authorities : hasAuthority('SCOPE_read:donation')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listGuestDonations(@Query() query: any): Promise<SuccessResponse<PagedResult<DonationDto>>> {
    const filter: BaseFilter<DonationDetailFilterDto> = {
      pageIndex: query.pageIndex ? parseInt(query.pageIndex) : 0,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
      props: {
        ...query,
        isGuest: true,
      },
    };
    const result = await this.donationService.list(filter);
    return new SuccessResponse(result);
  }
}
