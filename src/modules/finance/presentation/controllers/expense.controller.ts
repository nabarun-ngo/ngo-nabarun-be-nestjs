import {
  Controller,
  Get,
  Post,
  Put,
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
  ExpenseDetailDto,
  ExpenseDetailFilterDto,
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../application/dto/expense.dto';
import { ExpenseService } from '../../application/services/expense.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';

/**
 * Expense Controller - matches legacy endpoints
 * Base path: /api/expense
 */
@ApiTags('expense-controller')
@Controller('expense')
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new expense', description: "Authorities : hasAuthority('SCOPE_create:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateExpenseDto): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.create(dto);
    return new SuccessResponse(expense);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update expense details', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.update(id, dto);
    return new SuccessResponse(expense);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit expense for approval', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async submit(@Param('id') id: string): Promise<SuccessResponse<ExpenseDetailDto>> {
    // TODO: Implement submit use case
    const expense = await this.expenseService.getById(id);
    return new SuccessResponse(expense);
  }

  @Post(':id/finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async finalize(
    @Param('id') id: string,
    @Body() body: { finalizedBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.finalize(id, body.finalizedBy);
    return new SuccessResponse(expense);
  }

  @Post(':id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async settle(
    @Param('id') id: string,
    @Body() body: { accountId: string; settledBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.settle(id, body.accountId, body.settledBy);
    return new SuccessResponse(expense);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async reject(
    @Param('id') id: string,
    @Body() body: { rejectedBy: string; remarks?: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    // TODO: Implement reject use case
    const expense = await this.expenseService.getById(id);
    return new SuccessResponse(expense);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all expenses', description: "Authorities : hasAuthority('SCOPE_read:expense')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: ExpenseDetailFilterDto): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    const baseFilter: BaseFilter<ExpenseDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.expenseService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('self/list')
  @ApiOperation({ summary: 'List own expenses', description: "Authorities : hasAuthority('SCOPE_read:expense')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelf(@Query() filter: ExpenseDetailFilterDto): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    // TODO: Filter by current user
    const baseFilter: BaseFilter<ExpenseDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.expenseService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get expense by ID', description: "Authorities : hasAuthority('SCOPE_read:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { description: 'OK' })
  async getById(@Param('id') id: string): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.getById(id);
    return new SuccessResponse(expense);
  }
}

