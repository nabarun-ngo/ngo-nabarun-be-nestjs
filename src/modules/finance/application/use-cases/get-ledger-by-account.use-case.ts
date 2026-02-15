import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import {
  LedgerByAccountReportDto,
  LedgerLineWithBalanceDto,
} from '../dto/report.dto';

export interface GetLedgerByAccountRequest {
  accountId: string;
  fromDate?: Date;
  toDate?: Date;
  includeRunningBalance?: boolean;
}

/**
 * Ledger report for one account: lines in date range with optional running balance.
 */
@Injectable()
export class GetLedgerByAccountUseCase
  implements IUseCase<GetLedgerByAccountRequest, LedgerByAccountReportDto>
{
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(
    request: GetLedgerByAccountRequest,
  ): Promise<LedgerByAccountReportDto> {
    const { accountId, fromDate, toDate, includeRunningBalance = false } = request;
    const lines = await this.ledgerEntryRepository.findByAccountId(
      accountId,
      fromDate,
      toDate,
    );
    const closingBalance = await this.ledgerEntryRepository.getBalanceForAccount(
      accountId,
      toDate ?? new Date(),
    );
    const account = await this.accountRepository.findById(accountId);

    let runningBalance = 0;
    const lineDtos: LedgerLineWithBalanceDto[] = lines.map((line) => {
      // Running balance = cumulative (credit - debit) up to and including this line
      if (includeRunningBalance) {
        runningBalance += line.creditAmount - line.debitAmount;
      }
      const dto: LedgerLineWithBalanceDto = {
        id: line.id,
        journalEntryId: line.journalEntryId,
        accountId: line.accountId,
        lineNumber: line.lineNumber,
        debitAmount: line.debitAmount,
        creditAmount: line.creditAmount,
        currency: line.currency,
        particulars: line.particulars,
        createdAt: line.createdAt,
      };
      if (includeRunningBalance) {
        dto.runningBalance = runningBalance;
      }
      return dto;
    });

    return {
      accountId,
      accountName: account?.name,
      fromDate,
      toDate,
      closingBalance,
      lines: lineDtos,
    };
  }
}
