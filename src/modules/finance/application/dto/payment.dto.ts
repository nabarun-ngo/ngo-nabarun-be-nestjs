import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';

/**
 * Payment Method Enum - matches legacy system
 */
export enum PaymentMethod {
  CASH = 'CASH',
  NETBANKING = 'NETBANKING',
  UPI = 'UPI',
}

/**
 * UPI Payment Type Enum - matches legacy system
 */
export enum UPIPaymentType {
  GPAY = 'GPAY',
  PAYTM = 'PAYTM',
  PHONEPE = 'PHONEPE',
  BHARATPAY = 'BHARATPAY',
  UPI_OTH = 'UPI_OTH',
}

/**
 * Additional Field DTO - matches legacy system
 */
export class AdditionalFieldDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ 
    enum: [
      'firstName',
      'lastName',
      'email',
      'dialCode',
      'mobileNumber',
      'hometown',
      'reasonForJoining',
      'howDoUKnowAboutNabarun',
      'password',
      'name',
      'amount',
      'paymentMethod',
      'paidToAccount',
      'decision',
      'remarks',
      'confirmation',
      'reasonForLeaving',
      'startDate',
      'endDate',
      'rejoinDecision',
      'suggession',
    ],
    description: 'Field key identifier'
  })
  key: string;

  @ApiProperty()
  value: string;

  @ApiPropertyOptional()
  valueType?: string;
}

