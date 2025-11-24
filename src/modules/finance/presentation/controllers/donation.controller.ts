import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CreateRegularDonationUseCase } from '../../application/use-cases/create-regular-donation.use-case';
import { CreateOneTimeDonationUseCase } from '../../application/use-cases/create-one-time-donation.use-case';
import { ProcessDonationPaymentUseCase } from '../../application/use-cases/process-donation-payment.use-case';
import {
  CreateRegularDonationDto,
  CreateOneTimeDonationDto,
  ProcessDonationPaymentDto,
  DonationDto,
} from '../../application/dto/donation.dto';
import { ApiAutoResponse, ApiAutoPrimitiveResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';

/**
 * Donation Controller
 * Handles HTTP requests for donation operations
 */
@ApiTags('Donations')
@Controller('finance/donations')
export class DonationController {
  constructor(
    private readonly createRegularDonationUseCase: CreateRegularDonationUseCase,
    private readonly createOneTimeDonationUseCase: CreateOneTimeDonationUseCase,
    private readonly processDonationPaymentUseCase: ProcessDonationPaymentUseCase,
  ) {}

  @Post('regular')
  @ApiOperation({ summary: 'Create a regular donation' })
  @ApiAutoResponse(DonationDto, { status: 201, description: 'Regular donation created successfully', wrapInSuccessResponse: false })
  async createRegular(@Body() dto: CreateRegularDonationDto): Promise<DonationDto> {
    return await this.createRegularDonationUseCase.execute(dto);
  }

  @Post('one-time')
  @ApiOperation({ summary: 'Create a one-time donation' })
  @ApiAutoResponse(DonationDto, { status: 201, description: 'One-time donation created successfully', wrapInSuccessResponse: false })
  async createOneTime(@Body() dto: CreateOneTimeDonationDto): Promise<DonationDto> {
    return await this.createOneTimeDonationUseCase.execute(dto);
  }

  @Post(':id/process-payment')
  @ApiOperation({ summary: 'Process payment for a donation' })
  @ApiAutoPrimitiveResponse('string', { description: 'Payment processed successfully' })
  async processPayment(
    @Param('id') id: string,
    @Body() dto: Omit<ProcessDonationPaymentDto, 'donationId'>,
  ): Promise<SuccessResponse<string>> {
    await this.processDonationPaymentUseCase.execute({
      ...dto,
      donationId: id,
    });
    return new SuccessResponse<string>('Payment processed successfully');
  }

  // TODO: Add more endpoints:
  // - GET /donations (list with filters)
  // - GET /donations/:id (get by ID)
  // - GET /donations/donor/:donorId (get by donor)
  // - PUT /donations/:id/cancel (cancel donation)
}
