import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsArray, ValidateNested, IsDate, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { AccountDetailDto } from './account.dto';
import { ExpenseCategory, ExpenseRefType, ExpenseStatus } from '../../domain/model/expense.model';


/**
 * Expense Item Detail DTO
 */
export class ExpenseItemDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  itemName: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiProperty()
  amount: number;
}

/**
 * Expense Detail DTO - matches legacy ExpenseDetail
 */
export class ExpenseDetailDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expenseDate: Date;

  @ApiPropertyOptional()
  createdBy?: string; // UserDetail reference

  @ApiProperty({ type: String, format: 'date-time' })
  createdOn: Date;

  @ApiPropertyOptional()
  isAdmin?: boolean;

  @ApiPropertyOptional()
  isDeligated?: boolean;

  @ApiPropertyOptional()
  paidBy?: string; // UserDetail reference

  @ApiPropertyOptional()
  finalizedBy?: string; // UserDetail reference

  @ApiProperty({ enum: ExpenseStatus })
  status: ExpenseStatus;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  finalizedOn?: Date;

  @ApiPropertyOptional()
  settledBy?: string; // UserDetail reference

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  settledOn?: Date;

  @ApiPropertyOptional({ type: () => [ExpenseItemDetailDto] })
  expenseItems?: ExpenseItemDetailDto[];

  @ApiProperty()
  finalAmount: number;

  @ApiPropertyOptional({ enum: ExpenseRefType })
  expenseRefType?: ExpenseRefType;

  @ApiPropertyOptional()
  expenseRefId?: string;

  @ApiPropertyOptional()
  txnNumber?: string;

  @ApiPropertyOptional({ type: AccountDetailDto })
  settlementAccount?: AccountDetailDto;

  @ApiPropertyOptional()
  rejectedBy?: string; // UserDetail reference

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  rejectedOn?: Date;

  @ApiPropertyOptional()
  remarks?: string;
}

/**
 * Expense Detail Filter DTO
 */
export class ExpenseDetailFilterDto {
  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  endDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expenseRefId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expenseId?: string;

  @ApiPropertyOptional({ enum: ExpenseStatus, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(ExpenseStatus, { each: true })
  expenseStatus?: ExpenseStatus[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  payerId?: string;
}

/**
 * Create Expense DTO
 */
export class CreateExpenseDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty()
  @IsString()
  description: string;

  @ApiProperty({ enum: ExpenseCategory })
  @IsEnum(ExpenseCategory)
  category: ExpenseCategory;

  @ApiProperty({ minimum: 0.01 })
  @IsNumber()
  @Min(0.01)
  amount: number;

  @ApiProperty()
  @IsString()
  currency: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @IsDate()
  @Type(() => Date)
  expenseDate: Date;

  @ApiPropertyOptional({ enum: ExpenseRefType })
  @IsOptional()
  @IsEnum(ExpenseRefType)
  expenseRefType?: ExpenseRefType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  expenseRefId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ type: () => [ExpenseItemDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDetailDto)
  expenseItems?: ExpenseItemDetailDto[];
}

/**
 * Update Expense DTO
 */
export class UpdateExpenseDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 0.01 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  amount?: number;

  @ApiPropertyOptional({ type: String, format: 'date-time' })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  expenseDate?: Date;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  receiptUrl?: string;

  @ApiPropertyOptional({ type: () => [ExpenseItemDetailDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExpenseItemDetailDto)
  expenseItems?: ExpenseItemDetailDto[];
}


