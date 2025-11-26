import { IsNumber, IsString, IsOptional, Min, IsEmail, IsBoolean, IsDate, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DonationType, DonationStatus } from '../../domain/model/donation.model';
import { PaymentMethod, UPIPaymentType, AdditionalFieldDto } from './payment.dto';

export class CreateRegularDonationDto {
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ minimum: 0.01 })
  amount: number;

  @IsString()
  @ApiProperty()
  currency: string;

  @IsString()
  @ApiProperty({ description: 'User ID of the donor' })
  donorId: string; // User ID

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;
}

export class CreateOneTimeDonationDto {
  @IsNumber()
  @Min(0.01)
  @ApiProperty({ minimum: 0.01 })
  amount: number;

  @IsString()
  @ApiProperty()
  currency: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Optional for internal members' })
  donorId?: string; // Optional for internal members

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Required for guests' })
  donorName?: string; // Required for guests

  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({ description: 'Required for guests' })
  donorEmail?: string; // Required for guests

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  description?: string;
}

export class ProcessDonationPaymentDto {
  @IsString()
  @ApiProperty()
  donationId: string;

  @IsString()
  @ApiProperty()
  accountId: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  transactionRef?: string;

  @IsOptional()
  @ApiPropertyOptional({ enum: PaymentMethod })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @ApiPropertyOptional({ enum: UPIPaymentType })
  paidUsingUPI?: UPIPaymentType;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  confirmedBy?: string;

  @IsOptional()
  @IsBoolean()
  @ApiPropertyOptional()
  isPaymentNotified?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  remarks?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  paidOn?: Date;
}

export class DonationDetailFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  donorId?: string;

  @ApiPropertyOptional({ enum: DonationStatus, isArray: true })
  @IsOptional()
  @IsArray()
  status?: DonationStatus[];

  @ApiPropertyOptional({ enum: DonationType, isArray: true })
  @IsOptional()
  @IsArray()
  type?: DonationType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isGuest?: boolean;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;
}

export class DonationDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional({ description: 'Whether this is a guest donation' })
  isGuest?: boolean;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  donorId?: string;

  @ApiPropertyOptional()
  donorName?: string;

  @ApiPropertyOptional()
  donorEmail?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Start date for regular donations' })
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'End date for regular donations' })
  endDate?: Date;

  @ApiProperty({ type: String, format: 'date-time', description: 'Date when donation was raised' })
  raisedOn: Date;

  @ApiProperty({ enum: DonationType, description: 'Donation type: REGULAR or ONETIME' })
  type: DonationType;

  @ApiProperty({ enum: DonationStatus })
  status: DonationStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Date when donation was paid' })
  paidOn?: Date;

  @ApiPropertyOptional({ description: 'User ID who confirmed the donation' })
  confirmedBy?: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', description: 'Date when donation was confirmed' })
  confirmedOn?: Date;

  @ApiPropertyOptional({ enum: PaymentMethod, description: 'Payment method used' })
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Account ID where payment was made' })
  paidToAccount?: string;

  @ApiPropertyOptional({ description: 'Donor user details (for internal members)' })
  donorDetails?: string; // UserDetail reference - can be expanded to full UserDto if needed

  @ApiPropertyOptional({ description: 'Event ID this donation is for' })
  forEvent?: string; // EventDetail reference

  @ApiPropertyOptional({ enum: UPIPaymentType, description: 'UPI payment type if payment method is UPI' })
  paidUsingUPI?: UPIPaymentType;

  @ApiPropertyOptional({ description: 'Whether payment notification was sent' })
  isPaymentNotified?: boolean;

  @ApiPropertyOptional({ description: 'Transaction reference ID' })
  transactionRef?: string;

  @ApiPropertyOptional({ description: 'Additional remarks' })
  remarks?: string;

  @ApiPropertyOptional({ description: 'Reason for cancellation (legacy typo preserved)' })
  cancelletionReason?: string;

  @ApiPropertyOptional({ description: 'Reason for later payment' })
  laterPaymentReason?: string;

  @ApiPropertyOptional({ description: 'Payment failure details' })
  paymentFailureDetail?: string;

  @ApiPropertyOptional({ 
    type: () => [AdditionalFieldDto],
    description: 'Additional custom fields'
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdditionalFieldDto)
  additionalFields?: AdditionalFieldDto[];
}
