import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, ValidateNested, IsNumber, IsDate } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountType as BackendAccountType, AccountStatus } from '../../domain/model/account.model';

/**
 * Simplified Account Type for Frontend
 * Hides backend complexity - frontend only sees simple categories
 */
export enum AccountType {
  /** Main organizational account */
  PRINCIPAL = 'PRINCIPAL',
  /** Cashier/operational account for receiving donations */
  DONATION = 'DONATION',
  /** Public donation collection account */
  PUBLIC_DONATION = 'PUBLIC_DONATION',
  /** Personal wallet account */
  WALLET = 'WALLET',
}

/**
 * Account Category for Frontend Display
 * Groups accounts by their purpose for UI
 */
export enum AccountCategory {
  ORGANIZATIONAL = 'ORGANIZATIONAL',
  OPERATIONAL = 'OPERATIONAL',
  INDIVIDUAL = 'INDIVIDUAL',
}

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
 * Account Detail DTO - Simplified for Frontend
 * Backend complexity is hidden - only shows what frontend needs
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

  @ApiProperty({ enum: AccountType, description: 'Simplified account type for frontend' })
  accountType: AccountType;

  @ApiProperty({ enum: AccountCategory, description: 'Account category for UI grouping' })
  accountCategory: AccountCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

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

/**
 * Account Detail Filter DTO
 */
export class AccountDetailFilterDto {
  @ApiPropertyOptional({ enum: AccountStatus, isArray: true })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  status?: AccountStatus[];

  @ApiPropertyOptional({ enum: AccountType, isArray: true, description: 'Simplified account types for filtering' })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  accountType?: AccountType[];

  @ApiPropertyOptional({ enum: AccountCategory, isArray: true, description: 'Filter by account category' })
  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  accountCategory?: AccountCategory[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountHolderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  accountId?: string;
}

/**
 * Create Account DTO - Simplified for Frontend
 */
export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: AccountType, description: 'Simplified account type - backend maps to detailed type' })
  accountType: AccountType;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsString()
  accountHolderId: string;

  @ApiPropertyOptional()
  @IsOptional()
  initialBalance?: number;

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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  createdById?: string;
}

/**
 * Update Account DTO
 */
export class UpdateAccountDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: AccountStatus })
  @IsOptional()
  accountStatus?: AccountStatus;

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
 * Update Account Self DTO (for account holder to update their own account)
 */
export class UpdateAccountSelfDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ type: UPIDetailDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => UPIDetailDto)
  upiDetail?: UPIDetailDto;
}

export class TransferDto {
  @ApiProperty()
  @IsString()
  toAccountId: string;

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDate()
  transferDate: Date;

}

export class AddFundDto {

  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty()
  @IsDate()
  fundDate: Date;

}
