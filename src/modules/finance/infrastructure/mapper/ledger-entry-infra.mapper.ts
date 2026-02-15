import { Prisma } from '@prisma/client';
import { LedgerEntry } from '../../domain/model/ledger-entry.model';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

export type PrismaLedgerEntry = Prisma.LedgerEntryGetPayload<Record<string, never>>;

export class LedgerEntryInfraMapper {
  static toLedgerEntryDomain(p: PrismaLedgerEntry | null): LedgerEntry | null {
    if (!p) return null;
    return new LedgerEntry(
      p.id,
      p.journalEntryId,
      p.accountId,
      p.lineNumber,
      Number(p.debitAmount),
      Number(p.creditAmount),
      p.currency,
      MapperUtils.nullToUndefined(p.particulars),
      p.balanceAfter != null ? Number(p.balanceAfter) : undefined,
      p.createdAt,
    );
  }

  static toLedgerEntryCreatePersistence(domain: LedgerEntry): Prisma.LedgerEntryUncheckedCreateInput {
    return {
      id: domain.id,
      journalEntryId: domain.journalEntryId,
      accountId: domain.accountId,
      lineNumber: domain.lineNumber,
      debitAmount: domain.debitAmount,
      creditAmount: domain.creditAmount,
      currency: domain.currency,
      particulars: MapperUtils.undefinedToNull(domain.particulars),
      balanceAfter: domain.balanceAfter != null ? domain.balanceAfter : undefined,
    };
  }
}
