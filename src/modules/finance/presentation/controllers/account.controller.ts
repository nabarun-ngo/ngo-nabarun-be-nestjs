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
  AccountDetailDto,
  CreateAccountDto,
  UpdateAccountDto,
  AccountDetailFilterDto,
} from '../../application/dto/account.dto';
import { TransactionDetailDto, TransactionDetailFilterDto } from '../../application/dto/transaction.dto';
import { ExpenseDetailDto, ExpenseDetailFilterDto, CreateExpenseDto, UpdateExpenseDto } from '../../application/dto/expense.dto';
import { AccountService } from '../../application/services/account.service';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateTransactionDto } from '../../application/dto/transaction.dto';

/**
 * Account Controller - matches legacy endpoints
 * Base path: /api/account
 */
@ApiTags('account-controller')
@Controller('account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) {}

  @Post('create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new account', description: "Authorities : hasAuthority('SCOPE_create:account')" })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK' })
  async create(@Body() dto: CreateAccountDto): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.create(dto);
    return new SuccessResponse(account);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update account details', description: "Authorities : hasAuthority('SCOPE_update:account')" })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.update(id, dto);
    return new SuccessResponse(account);
  }

  @Put(':id/update/self')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own account details', description: "Authorities : hasAuthority('SCOPE_update:account')" })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK' })
  async updateSelf(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.update(id, dto);
    return new SuccessResponse(account);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all accounts', description: "Authorities : hasAuthority('SCOPE_read:account')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async list(@Query() filter: AccountDetailFilterDto): Promise<SuccessResponse<PagedResult<AccountDetailDto>>> {
    const baseFilter: BaseFilter<AccountDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('self/list')
  @ApiOperation({ summary: 'List own accounts', description: "Authorities : hasAuthority('SCOPE_read:account')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelf(@Query() filter: AccountDetailFilterDto): Promise<SuccessResponse<PagedResult<AccountDetailDto>>> {
    // TODO: Filter by current user's accountHolderId
    const baseFilter: BaseFilter<AccountDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.list(baseFilter);
    return new SuccessResponse(result);
  }

  @Post(':id/transaction/create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create transaction for account', description: "Authorities : hasAuthority('SCOPE_create:transaction')" })
  @ApiAutoResponse(TransactionDetailDto, { status: 200, description: 'OK' })
  async createTransaction(
    @Param('id') accountId: string,
    @Body() dto: CreateTransactionDto,
  ): Promise<SuccessResponse<TransactionDetailDto>> {
    const transaction = await this.accountService.createTransaction(accountId, dto);
    return new SuccessResponse(transaction);
  }

  @Get(':id/transaction/list')
  @ApiOperation({ summary: 'List transactions for account', description: "Authorities : hasAuthority('SCOPE_read:transaction')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listTransactions(
    @Param('id') accountId: string,
    @Query() filter: TransactionDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    const baseFilter: BaseFilter<TransactionDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.listTransactions(accountId, baseFilter);
    return new SuccessResponse(result);
  }

  @Get(':id/transaction/self/list')
  @ApiOperation({ summary: 'List own transactions for account', description: "Authorities : hasAuthority('SCOPE_read:transaction')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelfTransactions(
    @Param('id') accountId: string,
    @Query() filter: TransactionDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    // TODO: Filter by current user
    const baseFilter: BaseFilter<TransactionDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.listTransactions(accountId, baseFilter);
    return new SuccessResponse(result);
  }

  @Post('expense/create')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create expense', description: "Authorities : hasAuthority('SCOPE_create:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async createExpense(@Body() dto: CreateExpenseDto): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.accountService.createExpense(dto);
    return new SuccessResponse(expense);
  }

  @Put('expense/:id/update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async updateExpense(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.accountService.updateExpense(id, dto);
    return new SuccessResponse(expense);
  }

  @Post('expense/:id/settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async settleExpense(
    @Param('id') id: string,
    @Body() body: { accountId: string; settledBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.accountService.settleExpense(id, body.accountId, body.settledBy);
    return new SuccessResponse(expense);
  }

  @Post('expense/:id/finalize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize expense', description: "Authorities : hasAuthority('SCOPE_update:expense')" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async finalizeExpense(
    @Param('id') id: string,
    @Body() body: { finalizedBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.accountService.finalizeExpense(id, body.finalizedBy);
    return new SuccessResponse(expense);
  }

  @Get('expense/list')
  @ApiOperation({ summary: 'List all expenses', description: "Authorities : hasAuthority('SCOPE_read:expense')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listExpenses(@Query() filter: ExpenseDetailFilterDto): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    const baseFilter: BaseFilter<ExpenseDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.listExpenses(baseFilter);
    return new SuccessResponse(result);
  }

  @Get('expense/list/self')
  @ApiOperation({ summary: 'List own expenses', description: "Authorities : hasAuthority('SCOPE_read:expense')" })
  @ApiAutoResponse(PagedResult, { description: 'OK' })
  async listSelfExpenses(@Query() filter: ExpenseDetailFilterDto): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    // TODO: Filter by current user
    const baseFilter: BaseFilter<ExpenseDetailFilterDto> = {
      pageIndex: filter.pageIndex || 0,
      pageSize: filter.pageSize || 10,
      props: filter,
    };
    const result = await this.accountService.listExpenses(baseFilter);
    return new SuccessResponse(result);
  }
}

