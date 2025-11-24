import { IsNumber, IsString, IsOptional, Min, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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
}

export class DonationDto {
  @ApiProperty()
  id: string;
  @ApiProperty()
  type: string;
  @ApiProperty()
  amount: number;
  @ApiProperty()
  currency: string;
  @ApiProperty()
  status: string;
  @ApiPropertyOptional()
  donorId?: string;
  @ApiPropertyOptional()
  donorName?: string;
  @ApiPropertyOptional()
  donorEmail?: string;
  @ApiPropertyOptional()
  description?: string;
  @ApiProperty({ type: String, format: 'date-time' })
  raisedDate: Date;
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  paidDate?: Date;
  @ApiPropertyOptional()
  transactionId?: string;
  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
