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
import { CreateRegularDonationUseCase } from '../../application/use-cases/create-regular-donation.use-case';
import { CreateOneTimeDonationUseCase } from '../../application/use-cases/create-one-time-donation.use-case';
import { ProcessDonationPaymentUseCase } from '../../application/use-cases/process-donation-payment.use-case';
import {
  CreateRegularDonationDto,
  CreateOneTimeDonationDto,
  ProcessDonationPaymentDto,
} from '../../application/dto/donation.dto';

/**
 * Donation Controller
 * Handles HTTP requests for donation operations
 */
@Controller('finance/donations')
export class DonationController {
  constructor(
    private readonly createRegularDonationUseCase: CreateRegularDonationUseCase,
    private readonly createOneTimeDonationUseCase: CreateOneTimeDonationUseCase,
    private readonly processDonationPaymentUseCase: ProcessDonationPaymentUseCase,
  ) {}

  @Post('regular')
  @HttpCode(HttpStatus.CREATED)
  async createRegular(@Body() dto: CreateRegularDonationDto) {
    return await this.createRegularDonationUseCase.execute(dto);
  }

  @Post('one-time')
  @HttpCode(HttpStatus.CREATED)
  async createOneTime(@Body() dto: CreateOneTimeDonationDto) {
    return await this.createOneTimeDonationUseCase.execute(dto);
  }

  @Post(':id/process-payment')
  @HttpCode(HttpStatus.OK)
  async processPayment(
    @Param('id') id: string,
    @Body() dto: Omit<ProcessDonationPaymentDto, 'donationId'>,
  ) {
    await this.processDonationPaymentUseCase.execute({
      ...dto,
      donationId: id,
    });
    return { message: 'Payment processed successfully' };
  }

  // TODO: Add more endpoints:
  // - GET /donations (list with filters)
  // - GET /donations/:id (get by ID)
  // - GET /donations/donor/:donorId (get by donor)
  // - PUT /donations/:id/cancel (cancel donation)
}
