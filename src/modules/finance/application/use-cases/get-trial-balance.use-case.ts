import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from 'src/shared/interfaces/use-case.interface';
import { LEDGER_ENTRY_REPOSITORY } from '../../domain/repositories/ledger-entry.repository.interface';
import type { ILedgerEntryRepository } from '../../domain/repositories/ledger-entry.repository.interface';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import {
  TrialBalanceReportDto,
  TrialBalanceLineDto,
} from '../dto/report.dto';

export interface GetTrialBalanceRequest {
  fromDate: Date;
  toDate: Date;
}

/**
 * Trial balance: list of accounts with sum(debit) and sum(credit) from ledger entries in the date range.
 * Balance per line = totalCredit - totalDebit. Grand totals should match (sum debits = sum credits).
 */
@Injectable()
export class GetTrialBalanceUseCase
  implements IUseCase<GetTrialBalanceRequest, TrialBalanceReportDto>
{
  constructor(
    @Inject(LEDGER_ENTRY_REPOSITORY)
    private readonly ledgerEntryRepository: ILedgerEntryRepository,
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
  ) {}

  async execute(request: GetTrialBalanceRequest): Promise<TrialBalanceReportDto> {
    const { fromDate, toDate } = request;
    const entries = await this.ledgerEntryRepository.findAll({
      fromDate,
      toDate,
    });

    // Group by accountId and sum debit/credit
    const byAccount = new Map<
      string,
      { totalDebit: number; totalCredit: number; currency?: string }
    >();
    for (const e of entries) {
      const key = e.accountId;
      const cur = byAccount.get(key) ?? {
        totalDebit: 0,
        totalCredit: 0,
        currency: e.currency,
      };
      cur.totalDebit += e.debitAmount;
      cur.totalCredit += e.creditAmount;
      if (e.currency) cur.currency = e.currency;
      byAccount.set(key, cur);
    }

    const accountIds = Array.from(byAccount.keys());
    const accounts = await Promise.all(
      accountIds.map((id) => this.accountRepository.findById(id)),
    );
    const accountMap = new Map(
      accounts.filter((a): a is NonNullable<typeof a> => a != null).map((a) => [a.id, a]),
    );

    const lines: TrialBalanceLineDto[] = [];
    let totalDebit = 0;
    let totalCredit = 0;
    for (const [accountId, agg] of byAccount.entries()) {
      const account = accountMap.get(accountId);
      const balance = agg.totalCredit - agg.totalDebit;
      totalDebit += agg.totalDebit;
      totalCredit += agg.totalCredit;
      lines.push({
        accountId,
        accountName: account?.name,
        currency: agg.currency,
        totalDebit: agg.totalDebit,
        totalCredit: agg.totalCredit,
        balance,
      });
    }

    // Sort by account id for stable output
    lines.sort((a, b) => a.accountId.localeCompare(b.accountId));

    return {
      fromDate,
      toDate,
      lines,
      totalDebit,
      totalCredit,
    };
  }
}
