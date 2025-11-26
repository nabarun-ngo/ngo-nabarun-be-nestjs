import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse, PagedResult } from 'src/shared/models/response-model';
import {
  TransactionDetailDto,
  TransactionDetailFilterDto,
  CreateTransactionDto,
} from '../../application/dto/transaction.dto';
import { TransactionService } from '../../application/services/transaction.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';

/**
 * Transaction Controller - matches legacy endpoints
 * Base path: /api/transaction
 */
@ApiTags('transaction-controller')
@Controller('transaction')
export class TransactionController {
  constructor(
    private readonly transactionService: TransactionService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new transaction', description: "Authorities : hasAuthority('SCOPE_create:transaction')" })
  @ApiAutoResponse(TransactionDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateTransactionDto): Promise<SuccessResponse<TransactionDetailDto>> {
    const transaction = await this.transactionService.create(dto);
    return new SuccessResponse(transaction);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all transactions', description: "Authorities : hasAuthority('SCOPE_read:transaction')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: TransactionDetailFilterDto): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    const baseFilter: BaseFilter<TransactionDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.transactionService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('self/list')
  @ApiOperation({ summary: 'List own transactions', description: "Authorities : hasAuthority('SCOPE_read:transaction')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelf(@Query() filter: TransactionDetailFilterDto): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    // TODO: Filter by current user's accounts
    const baseFilter: BaseFilter<TransactionDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.transactionService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get transaction by ID', description: "Authorities : hasAuthority('SCOPE_read:transaction')" })
  @ApiAutoResponse(TransactionDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<TransactionDetailDto>> {
    const transaction = await this.transactionService.getById(id);
    return new SuccessResponse(transaction);
  }

  @Post(':id/revert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revert transaction', description: "Authorities : hasAuthority('SCOPE_update:transaction')" })
  @ApiAutoResponse(TransactionDetailDto, { status: 200, description: 'OK' })
  async revert(@Param('id') id: string): Promise<SuccessResponse<TransactionDetailDto>> {
    // TODO: Implement revert use case
    const transaction = await this.transactionService.getById(id);
    return new SuccessResponse(transaction);
  }
}

