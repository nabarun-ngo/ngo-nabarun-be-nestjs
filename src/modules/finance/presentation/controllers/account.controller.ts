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
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import {
  AccountDetailDto,
  CreateAccountDto,
  UpdateAccountDto,
  UpdateAccountSelfDto,
  AccountDetailFilterDto,
} from '../../application/dto/account.dto';
import { TransactionDetailDto, TransactionDetailFilterDto } from '../../application/dto/transaction.dto';
import { AccountService } from '../../application/services/account.service';
import { PagedResult } from 'src/shared/models/paged-result';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';

/**
 * Account Controller - matches legacy endpoints
 * Base path: /api/account
 */
@ApiTags(AccountController.name)
@Controller('account')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
  ) { }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @RequirePermissions('create:account')
  @ApiOperation({ summary: 'Create new account', description: "Authorities : 'create:account'" })
  @ApiAutoResponse(AccountDetailDto, { status: 201, description: 'Created' })
  async createAccount(@Body() dto: CreateAccountDto): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.create(dto);
    return new SuccessResponse(account);
  }

  @Put(':id/update')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('update:account')
  @ApiOperation({ summary: 'Update account details', description: "Authorities : 'update:account'" })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK' })
  async updateAccount(
    @Param('id') id: string,
    @Body() dto: UpdateAccountDto,
  ): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.update(id, dto);
    return new SuccessResponse(account);
  }

  @Put(':id/update/me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update own account details', description: "" })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK' })
  async updateSelf(
    @Param('id') id: string,
    @Body() dto: UpdateAccountSelfDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse<AccountDetailDto>> {
    const account = await this.accountService.update(id, dto, user.profile_id);
    return new SuccessResponse(account);
  }

  @Get('list')
  @ApiOperation({ summary: 'List all accounts' })
  @RequirePermissions('read:accounts')
  @ApiAutoPagedResponse(AccountDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listAccounts(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: AccountDetailFilterDto): Promise<SuccessResponse<PagedResult<AccountDetailDto>>> {
    const result = await this.accountService.list({
      pageIndex,
      pageSize,
      props: filter,
    });
    return new SuccessResponse(result);
  }

  @Get('list/me')
  @ApiOperation({ summary: 'List own accounts', })
  @ApiAutoPagedResponse(AccountDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listSelfAccounts(
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: AccountDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<AccountDetailDto>>> {
    const result = await this.accountService.list({
      pageIndex,
      pageSize,
      props: filter,
    }, user?.profile_id);
    return new SuccessResponse(result);
  }


  @Get(':id/transactions')
  @ApiOperation({ summary: 'List transactions for account', description: "Authorities : 'read:transactions'" })
  @RequirePermissions('read:transactions')
  @ApiAutoPagedResponse(TransactionDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listAccountTransactions(
    @Param('id') accountId: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: TransactionDetailFilterDto,
  ): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    const result = await this.accountService.listTransactions(accountId, {
      pageIndex,
      pageSize,
      props: filter,
    });
    return new SuccessResponse(result);
  }

  @Get(':id/transactions/me')
  @ApiOperation({ summary: 'List own transactions for account', })
  @ApiAutoPagedResponse(TransactionDetailDto, { description: 'OK', wrapInSuccessResponse: true })
  async listSelfAccountTransactions(
    @Param('id') accountId: string,
    @Query('pageIndex') pageIndex?: number,
    @Query('pageSize') pageSize?: number,
    @Query() filter?: TransactionDetailFilterDto,
    @CurrentUser() user?: AuthUser,
  ): Promise<SuccessResponse<PagedResult<TransactionDetailDto>>> {
    const result = await this.accountService.listTransactions(accountId, {
      pageIndex,
      pageSize,
      props: filter,
    }, user?.profile_id);
    return new SuccessResponse(result);
  }

  @Get('payable-account')
  @ApiOperation({ summary: 'Get account data for payable', })
  @ApiAutoResponse(AccountDetailDto, { status: 200, description: 'OK', isArray: true, wrapInSuccessResponse: true })
  @ApiQuery({ name: 'isTransfer', required: false, type: Boolean })
  async payableAccount(@Query() isTransfer: boolean): Promise<SuccessResponse<AccountDetailDto[]>> {
    const account = await this.accountService.payableAccount(isTransfer);
    return new SuccessResponse(account);
  }

}

