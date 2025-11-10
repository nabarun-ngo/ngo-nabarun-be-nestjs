import { IsNumber, IsString, IsOptional, Min, IsEmail } from 'class-validator';

export class CreateRegularDonationDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsString()
  donorId: string; // User ID

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateOneTimeDonationDto {
  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsString()
  currency: string;

  @IsOptional()
  @IsString()
  donorId?: string; // Optional for internal members

  @IsOptional()
  @IsString()
  donorName?: string; // Required for guests

  @IsOptional()
  @IsEmail()
  donorEmail?: string; // Required for guests

  @IsOptional()
  @IsString()
  description?: string;
}

export class ProcessDonationPaymentDto {
  @IsString()
  donationId: string;

  @IsString()
  accountId: string;
}

export class DonationDto {
  id: string;
  type: string;
  amount: number;
  currency: string;
  status: string;
  donorId?: string;
  donorName?: string;
  donorEmail?: string;
  description?: string;
  raisedDate: Date;
  paidDate?: Date;
  transactionId?: string;
  createdAt: Date;
}
