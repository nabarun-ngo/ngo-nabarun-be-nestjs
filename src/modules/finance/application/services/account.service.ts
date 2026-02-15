import { Inject, Injectable } from '@nestjs/common';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { AccountDetailDto, AccountDetailFilterDto, AddFundDto, CreateAccountDto, TransferDto, UpdateAccountDto } from '../dto/account.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { CreateAccountUseCase } from '../use-cases/create-account.use-case';
import { UpdateAccountUseCase } from '../use-cases/update-account.use-case';
import { AccountDtoMapper } from '../dto/mapper/account-dto.mapper';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { AccountFilter, AccountStatus, AccountType } from '../../domain/model/account.model';
import { AccountRefDataDto } from '../dto/donation.dto';
import { MetadataService } from '../../infrastructure/external/metadata.service';
import { toKeyValueDto } from 'src/shared/utilities/kv-config.util';
import { PostToLedgerUseCase } from '../use-cases/post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { ReverseJournalEntryUseCase } from '../use-cases/reverse-journal-entry.use-case';
import {
  LedgerActivityDto,
  LedgerActivityFilterDto,
  JournalEntryResponseDto,
  ReverseJournalEntryDto,
} from '../dto/ledger-activity.dto';

@Injectable()
export class AccountService {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly updateAccountUseCase: UpdateAccountUseCase,
    private readonly metadataService: MetadataService,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
    private readonly reverseJournalEntryUseCase: ReverseJournalEntryUseCase,
  ) { }

  async list(filter: BaseFilter<AccountDetailFilterDto>, userId?: string): Promise<PagedResult<AccountDetailDto>> {
    const result = await this.accountRepository.findPaged({
      pageIndex: filter.pageIndex,
      pageSize: filter.pageSize,
      props: {
        accountHolderId: userId ?? filter.props?.accountHolderId,
        id: filter.props?.accountId,
        status: filter.props?.status,
        type: filter.props?.type,
      }
    });
    return new PagedResult(
      result.content.map(a => AccountDtoMapper.toDto(a, {
        includeBankDetail: filter.props?.includePaymentDetail === 'Y',
        includeUpiDetail: filter.props?.includePaymentDetail === 'Y',
        includeBalance: filter.props?.includeBalance === 'Y',
      })),
      result.totalSize,
      result.pageIndex,
      result.pageSize,
    );
  }

  async getById(id: string): Promise<AccountDetailDto> {
    const account = await this.accountRepository.findById(id);
    if (!account) {
      throw new BusinessException('Account not found with id ' + id);
    }
    return AccountDtoMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true, includeBalance: true });
  }

  async create(dto: CreateAccountDto, createdById?: string): Promise<AccountDetailDto> {
    const account = await this.createAccountUseCase.execute({ ...dto, createdById });
    return AccountDtoMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true, includeBalance: true });
  }

  async payableAccount(isTransfer: boolean): Promise<AccountDetailDto[]> {
    const account = await this.accountRepository.findAll({
      type: isTransfer === true ? [] : [AccountType.PRINCIPAL, AccountType.DONATION, AccountType.PUBLIC_DONATION],
      status: [AccountStatus.ACTIVE]
    });
    return account.map(a => AccountDtoMapper.toDto(a, {
      includeBankDetail: true,
      includeUpiDetail: true,
      includeBalance: false
    }));
  }

  async update(id: string, dto: UpdateAccountDto, userId?: string): Promise<AccountDetailDto> {
    const account = await this.updateAccountUseCase.execute({ id, dto });
    return AccountDtoMapper.toDto(account, { includeBankDetail: true, includeUpiDetail: true, includeBalance: true });
  }

  async listLedgerActivity(
    accountId: string,
    filter: BaseFilter<LedgerActivityFilterDto>,
    userId?: string
  ): Promise<PagedResult<LedgerActivityDto>> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new BusinessException('Account not found with id ' + accountId);
    }
    if (userId && account.accountHolderId !== userId) {
      throw new BusinessException('Account does not belong to user.');
    }
    const result = await this.ledgerEntryRepository.findPaged({
      pageIndex: filter.pageIndex ?? 0,
      pageSize: filter.pageSize ?? 20,
      props: {
        accountId,
        fromDate: filter.props?.fromDate,
        toDate: filter.props?.toDate,
      },
    });
    const content = result.content.map(line => ({
      journalEntryId: line.journalEntryId,
      ledgerEntryId: line.id,
      createdAt: line.createdAt,
      accountId: line.accountId,
      debitAmount: line.debitAmount,
      creditAmount: line.creditAmount,
      amount: line.creditAmount - line.debitAmount,
      currency: line.currency,
      particulars: line.particulars,
      type: line.debitAmount > 0 ? 'DEBIT' as const : 'CREDIT' as const,
    }));
    return new PagedResult(content, result.totalSize, result.pageIndex, result.pageSize);
  }

  async transferAmount(
    accountId: string,
    dto: TransferDto,
    profile_id: string | undefined
  ): Promise<JournalEntryResponseDto> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new BusinessException('Account not found with id ' + accountId);
    }
    if (profile_id && account.accountHolderId !== profile_id) {
      throw new BusinessException('Account does not belong to user.');
    }
    const amount = Number(dto.amount);
    const currency = account.currency ?? 'INR';
    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate: dto.transferDate ?? new Date(),
      description: dto.description ?? `Transfer to account ${dto.toAccountId}`,
      referenceType: JournalEntryReferenceType.TRANSFER,
      postedById: profile_id ?? 'system',
      lines: [
        { accountId, debitAmount: amount, creditAmount: 0, currency, particulars: `Transfer to ${dto.toAccountId}` },
        { accountId: dto.toAccountId, debitAmount: 0, creditAmount: amount, currency, particulars: `Transfer from ${accountId}` },
      ],
    });
    return { journalEntryId: journalEntry.id, message: 'Transfer posted to ledger.' };
  }

  async addFundToAccount(
    accountId: string,
    dto: AddFundDto,
    profile_id: string | undefined
  ): Promise<JournalEntryResponseDto> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new BusinessException('Account not found with id ' + accountId);
    }
    if (profile_id && account.accountHolderId !== profile_id) {
      throw new BusinessException('Account does not belong to user.');
    }
    const amount = Number(dto.amount);
    const currency = account.currency ?? 'INR';
    const journalEntry = await this.postToLedgerUseCase.execute({
      entryDate: dto.transferDate ?? new Date(),
      description: dto.description ?? `Add fund to account ${accountId}`,
      referenceType: JournalEntryReferenceType.ADD_FUND,
      referenceId: accountId,
      postedById: profile_id ?? 'system',
      lines: [
        { accountId, debitAmount: 0, creditAmount: amount, currency, particulars: dto.description ?? 'Add fund' },
      ],
    });
    return { journalEntryId: journalEntry.id, message: 'Fund added and posted to ledger.' };
  }

  async reverseJournalEntry(accountId: string, dto: ReverseJournalEntryDto): Promise<JournalEntryResponseDto> {
    const account = await this.accountRepository.findById(accountId);
    if (!account) {
      throw new BusinessException('Account not found with id ' + accountId);
    }
    const reversal = await this.reverseJournalEntryUseCase.execute({
      journalEntryId: dto.journalEntryId,
      postedById: 'system',
      description: dto.comment ? `Reversal: ${dto.comment}` : undefined,
    });
    return { journalEntryId: reversal.id, message: 'Journal entry reversed.' };
  }

  async getReferenceData(): Promise<AccountRefDataDto> {
    const data = await this.metadataService.getReferenceData();
    return {
      accountStatuses: data.acc_status.map(toKeyValueDto),
      accountTypes: data.acc_type.map(toKeyValueDto),
      transactionRefTypes: data.txn_types?.map(toKeyValueDto) ?? [],
      expenseStatuses: data.exp_status.map(toKeyValueDto),
    };
  }
}
