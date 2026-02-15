import { BadRequestException, Controller, Get, Param, Query, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LedgerEntryResponseDto } from '../../application/dto/ledger-entry.dto';
import { LedgerEntryDtoMapper } from '../../application/dto/mapper/ledger-entry-dto.mapper';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { Inject } from '@nestjs/common';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { BackfillLedgerEntryUseCase } from '../../application/use-cases/backfill-ledger-entry.use-case';
import {
  BackfillLedgerRequestDto,
  BackfillLedgerResponseDto,
  BackfillEntityTypeEnum,
} from '../../application/dto/ledger-activity.dto';
import { CurrentUser } from 'src/modules/shared/auth/application/decorators/current-user.decorator';
import { type AuthUser } from 'src/modules/shared/auth/domain/models/api-user.model';

/**
 * Response for ledger by account (lines + derived balance)
 */
export class LedgerByAccountResponseDto {
  @ApiProperty()
  accountId: string;

  @ApiPropertyOptional()
  fromDate?: string;

  @ApiPropertyOptional()
  toDate?: string;

  @ApiProperty({ description: 'Derived balance from ledger lines' })
  balance: number;

  @ApiProperty({ type: [LedgerEntryResponseDto] })
  lines: LedgerEntryResponseDto[];
}

@ApiTags('Ledger')
@Controller('ledger')
@ApiBearerAuth('jwt')
export class LedgerController {
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
    private readonly backfillLedgerEntryUseCase: BackfillLedgerEntryUseCase,
  ) {}

  @Get('account/:accountId')
  @RequirePermissions('read:ledger')
  @ApiOperation({ summary: 'Get ledger lines for an account (optionally by date range)' })
  @ApiAutoResponse(LedgerByAccountResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getByAccount(
    @Param('accountId') accountId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
  ): Promise<SuccessResponse<LedgerByAccountResponseDto>> {
    const from = fromDate ? new Date(fromDate) : undefined;
    const to = toDate ? new Date(toDate) : undefined;
    const lines = await this.ledgerEntryRepository.findByAccountId(
      accountId,
      from,
      to,
    );
    const balance = await this.ledgerEntryRepository.getBalanceForAccount(
      accountId,
      to ?? new Date(),
    );
    const dto: LedgerByAccountResponseDto = {
      accountId,
      fromDate: fromDate,
      toDate: toDate,
      balance,
      lines: lines.map((l) => LedgerEntryDtoMapper.toResponseDto(l)),
    };
    return new SuccessResponse(dto);
  }

  @Get('account/:accountId/balance')
  @RequirePermissions('read:ledger')
  @ApiOperation({ summary: 'Get derived balance for an account (optionally as of date)' })
  @ApiAutoResponse(Number, { description: 'Balance', wrapInSuccessResponse: true })
  async getBalance(
    @Param('accountId') accountId: string,
    @Query('asOfDate') asOfDate?: string,
  ): Promise<SuccessResponse<{ balance: number }>> {
    const asOf = asOfDate ? new Date(asOfDate) : undefined;
    const balance = await this.ledgerEntryRepository.getBalanceForAccount(
      accountId,
      asOf,
    );
    return new SuccessResponse({ balance });
  }

  @Post('backfill')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('update:journal-entries')
  @ApiOperation({
    summary: 'Add journal and ledger entry for existing donation or expense',
    description:
      'Creates a journal entry and ledger lines for an existing PAID donation or SETTLED expense that does not yet have a linked entry. For donation: uses paidToAccountId. For expense: provide expenseAccountId (debit) and paymentAccountId (credit).',
  })
  @ApiAutoResponse(BackfillLedgerResponseDto, { description: 'Backfill result', wrapInSuccessResponse: true })
  async backfillLedgerEntry(
    @Body() dto: BackfillLedgerRequestDto,
    @CurrentUser() user: AuthUser,
  ): Promise<SuccessResponse<BackfillLedgerResponseDto>> {
    const postedById = dto.postedById ?? user?.profile_id;
    if (!postedById) {
      throw new BadRequestException('postedById is required; provide it in the body or use an authenticated user');
    }
    const result = await this.backfillLedgerEntryUseCase.execute({
      entityType: dto.entityType as 'DONATION' | 'EXPENSE',
      entityId: dto.entityId,
      postedById,
      entryDate: dto.entryDate,
      allowOverwrite: dto.allowOverwrite,
      expenseAccountId: dto.expenseAccountId,
      paymentAccountId: dto.paymentAccountId,
    });
    const response: BackfillLedgerResponseDto = {
      journalEntryId: result.journalEntry.id,
      entityType: result.entityType as BackfillEntityTypeEnum,
      entityId: result.entityId,
      linked: result.linked,
    };
    return new SuccessResponse(response);
  }
}
