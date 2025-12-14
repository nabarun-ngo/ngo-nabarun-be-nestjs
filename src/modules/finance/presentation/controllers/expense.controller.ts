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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import {
  ExpenseDetailDto,
  ExpenseDetailFilterDto,
  CreateExpenseDto,
  UpdateExpenseDto,
} from '../../application/dto/expense.dto';
import { ExpenseService } from '../../application/services/expense.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';

/**
 * Expense Controller - matches legacy endpoints
 * Base path: /api/expense
 */
@ApiTags(ExpenseController.name)
@Controller('expense')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class ExpenseController {
  constructor(
    private readonly expenseService: ExpenseService,
  ) { }

  @Post('create')
  @RequirePermissions('create:expense')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create new expense', description: "Authorities : 'create:expense'" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async createExpense(
    @Body() dto: CreateExpenseDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.create(dto, user);
    return new SuccessResponse(expense);
  }

  @Put(':id/update')
  @RequirePermissions('update:expense')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update expense details', description: "Authorities : 'update:expense'" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async updateExpense(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.update(id, dto);
    return new SuccessResponse(expense);
  }



  @Post(':id/finalize')
  @RequirePermissions('create:expense_final')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize expense', description: "Authorities : 'create:expense_final'" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async finalizeExpense(
    @Param('id') id: string,
    @Body() body: { finalizedBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.finalize(id, body.finalizedBy);
    return new SuccessResponse(expense);
  }

  @Post(':id/settle')
  @RequirePermissions('create:expense_settle')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Settle expense', description: "Authorities : 'create:expense_settle'" })
  @ApiAutoResponse(ExpenseDetailDto, { status: 200, description: 'OK' })
  async settleExpense(
    @Param('id') id: string,
    @Body() body: { accountId: string; settledBy: string },
  ): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.settle(id, body.accountId, body.settledBy);
    return new SuccessResponse(expense);
  }

  @Get('list')
  @RequirePermissions('read:expense')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all expenses', description: "Authorities : 'read:expense'" })
  @ApiAutoPagedResponse(ExpenseDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listExpenses(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ExpenseDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    const result = await this.expenseService.list({
      pageIndex,
      pageSize,
      props: { ...filter },
    });
    return new SuccessResponse(result);
  }

  @Get('list/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List own expenses', description: "Authorities : 'read:expense'" })
  @ApiAutoPagedResponse(ExpenseDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listSelfExpenses(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: ExpenseDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<ExpenseDetailDto>>> {
    const result = await this.expenseService.list({
      pageIndex,
      pageSize,
      props: { ...filter, },
    });
    return new SuccessResponse(result);
  }

  @Get(':id')
  @RequirePermissions('read:expense')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get expense by ID', description: "Authorities : 'read:expense'" })
  @ApiAutoResponse(ExpenseDetailDto, { description: 'OK' })
  async getExpenseById(@Param('id') id: string): Promise<SuccessResponse<ExpenseDetailDto>> {
    const expense = await this.expenseService.getById(id);
    return new SuccessResponse(expense);
  }


}

