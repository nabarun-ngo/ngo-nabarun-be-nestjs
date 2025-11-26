import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Account Type Enum - matches legacy system
 */
export enum AccountType {
  PRINCIPAL = 'PRINCIPAL',
  GENERAL = 'GENERAL',
  DONATION = 'DONATION',
  PUBLIC_DONATION = 'PUBLIC_DONATION',
}

/**
 * Account Status Enum - matches legacy system
 */
export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

/**
 * Bank Detail DTO - matches legacy system
 */
export class BankDetailDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankBranch?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  bankAccountType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  IFSCNumber?: string;
}

/**
 * UPI Detail DTO - matches legacy system
 */
export class UPIDetailDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payeeName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  upiId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  mobileNumber?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  qrData?: string;
}

/**
 * Account Detail DTO - matches legacy AccountDetail
 */
export class AccountDetailDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  accountHolderName?: string;

  @ApiProperty()
  currentBalance: number;

  @ApiPropertyOptional()
  accountHolder?: string; // UserDetail reference

  @ApiProperty({ enum: AccountStatus })
  accountStatus: AccountStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  activatedOn?: Date;

  @ApiProperty({ enum: AccountType })
  accountType: AccountType;

  @ApiPropertyOptional({ type: BankDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailDto)
  bankDetail?: BankDetailDto;

  @ApiPropertyOptional({ type: UPIDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UPIDetailDto)
  upiDetail?: UPIDetailDto;
}

/**
 * Account Detail Filter DTO
 */
export class AccountDetailFilterDto {
  @ApiPropertyOptional({ enum: AccountStatus, isArray: true })
  @IsOptional()
  status?: AccountStatus[];

  @ApiPropertyOptional({ enum: AccountType, isArray: true })
  @IsOptional()
  type?: AccountType[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHolderId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  includePaymentDetail?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  includeBalance?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;
}

/**
 * Create Account DTO
 */
export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  initialBalance?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHolderId?: string;

  @ApiPropertyOptional({ type: BankDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailDto)
  bankDetail?: BankDetailDto;

  @ApiPropertyOptional({ type: UPIDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UPIDetailDto)
  upiDetail?: UPIDetailDto;
}

/**
 * Update Account DTO
 */
export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  @IsEnum(AccountStatus)
  accountStatus?: AccountStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ type: BankDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailDto)
  bankDetail?: BankDetailDto;

  @ApiPropertyOptional({ type: UPIDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UPIDetailDto)
  upiDetail?: UPIDetailDto;
}


