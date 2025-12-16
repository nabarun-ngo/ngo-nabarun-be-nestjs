import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsDate, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { AccountDetailDto } from './account.dto';
import { TransactionRefType, TransactionStatus, TransactionType } from '../../domain/model/transaction.model';

/**
 * Transaction Detail DTO - matches legacy TransactionDetail
 */
export class TransactionDetailDto {
  @ApiProperty()
  txnId: string;

  @ApiPropertyOptional()
  txnNumber?: string;

  @ApiProperty({ type: String, format: 'date-time' })
  txnDate: Date;

  @ApiProperty()
  txnAmount: number;

  @ApiProperty({ enum: TransactionType })
  txnType: TransactionType;

  @ApiProperty({ enum: TransactionStatus })
  txnStatus: TransactionStatus;

  @ApiProperty()
  txnDescription: string;

  @ApiPropertyOptional()
  txnParticulars?: string;

  @ApiPropertyOptional()
  txnRefId?: string;

  @ApiPropertyOptional({ enum: TransactionRefType })
  txnRefType?: TransactionRefType;

  @ApiPropertyOptional()
  accBalance?: number;

  @ApiPropertyOptional({ type: AccountDetailDto })
  transferFrom?: AccountDetailDto;

  @ApiPropertyOptional({ type: AccountDetailDto })
  transferTo?: AccountDetailDto;

  @ApiPropertyOptional()
  comment?: string;

  @ApiPropertyOptional({ type: AccountDetailDto })
  account?: AccountDetailDto;
}

/**
 * Transaction Detail Filter DTO
 */
export class TransactionDetailFilterDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnId?: string;

  @ApiPropertyOptional({ enum: TransactionType, isArray: true })
  @IsOptional()
  @IsEnum(TransactionType, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  txnType?: TransactionType[];

  @ApiPropertyOptional({ enum: TransactionStatus, isArray: true })
  @IsOptional()
  @IsEnum(TransactionStatus, { each: true })
  @Transform(({ value }) =>
    Array.isArray(value) ? value : value ? [value] : undefined
  )
  txnStatus?: TransactionStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnRefId?: string;

  @ApiPropertyOptional({ enum: TransactionRefType })
  @IsOptional()
  @IsEnum(TransactionRefType)
  txnRefType?: TransactionRefType;

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

/**
 * Create Transaction DTO
 */
export class CreateTransactionDto {
  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  txnType: TransactionType;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  txnAmount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty()
  @IsString()
  accountId: string;

  @ApiProperty()
  @IsString()
  txnDescription: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnParticulars?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  txnRefId?: string;

  @ApiPropertyOptional({ enum: TransactionRefType })
  @IsOptional()
  @IsEnum(TransactionRefType)
  txnRefType?: TransactionRefType;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  txnDate?: Date;
}

