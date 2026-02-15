import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import {
  JournalEntryResponseDto,
  JournalEntryFilterDto,
} from '../../application/dto/journal-entry.dto';
import { JournalEntryDtoMapper } from '../../application/dto/mapper/journal-entry-dto.mapper';
import { JOURNAL_ENTRY_REPOSITORY } from '../../domain/repositories/journal-entry.repository.interface';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { IJournalEntryRepository } from '../../domain/repositories/journal-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { Inject } from '@nestjs/common';
import { RequirePermissions } from 'src/modules/shared/auth/application/decorators/require-permissions.decorator';
import { JournalEntryFilter } from '../../domain/model/journal-entry.model';

@ApiTags('JournalEntry')
@Controller('journal-entry')
@ApiBearerAuth('jwt')
export class JournalEntryController {
  constructor(
    @Inject(JOURNAL_ENTRY_REPOSITORY)
    private readonly journalEntryRepository: IJournalEntryRepository,
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
  ) {}

  @Get('list')
  @RequirePermissions('read:journal-entries')
  @ApiOperation({ summary: 'List journal entries with optional filters' })
  @ApiAutoPagedResponse(JournalEntryResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async list(
    @Query() filterDto: JournalEntryFilterDto,
  ): Promise<SuccessResponse<PagedResult<JournalEntryResponseDto>>> {
    const props: JournalEntryFilter = {
      referenceType: filterDto.referenceType,
      referenceId: filterDto.referenceId,
      status: filterDto.status,
      fiscalPeriodId: filterDto.fiscalPeriodId,
      entryDateFrom: filterDto.entryDateFrom ? new Date(filterDto.entryDateFrom) : undefined,
      entryDateTo: filterDto.entryDateTo ? new Date(filterDto.entryDateTo) : undefined,
    };
    const filter = new BaseFilter(
      props,
      filterDto.pageIndex ?? 0,
      filterDto.pageSize ?? 100,
    );
    const result = await this.journalEntryRepository.findPaged(filter);
    const content = result.content.map((entry) =>
      JournalEntryDtoMapper.toResponseDto(entry),
    );
    const paged = new PagedResult<JournalEntryResponseDto>(
      content,
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
    return new SuccessResponse(paged);
  }

  @Get('by-reference/:referenceType/:referenceId')
  @RequirePermissions('read:journal-entries')
  @ApiOperation({ summary: 'Get posted journal entry by reference type and id' })
  @ApiAutoResponse(JournalEntryResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getByReference(
    @Param('referenceType') referenceType: string,
    @Param('referenceId') referenceId: string,
  ): Promise<SuccessResponse<JournalEntryResponseDto | null>> {
    const entry = await this.journalEntryRepository.findByReference(
      referenceType,
      referenceId,
    );
    if (!entry) {
      return new SuccessResponse(null);
    }
    const lines = await this.ledgerEntryRepository.findByJournalEntryId(entry.id);
    const dto = JournalEntryDtoMapper.toResponseDto(entry, lines);
    return new SuccessResponse(dto);
  }

  @Get(':id')
  @RequirePermissions('read:journal-entries')
  @ApiOperation({ summary: 'Get journal entry by id with ledger lines' })
  @ApiAutoResponse(JournalEntryResponseDto, { description: 'OK', wrapInSuccessResponse: true })
  async getById(
    @Param('id') id: string,
  ): Promise<SuccessResponse<JournalEntryResponseDto | null>> {
    const entry = await this.journalEntryRepository.findById(id);
    if (!entry) {
      return new SuccessResponse(null);
    }
    const lines = await this.ledgerEntryRepository.findByJournalEntryId(id);
    const dto = JournalEntryDtoMapper.toResponseDto(entry, lines);
    return new SuccessResponse(dto);
  }
}
