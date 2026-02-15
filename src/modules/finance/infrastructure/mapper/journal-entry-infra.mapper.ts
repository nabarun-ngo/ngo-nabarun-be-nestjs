import { Prisma } from '@prisma/client';
import {
  JournalEntry,
  JournalEntryStatus,
  JournalEntryReferenceType,
} from '../../domain/model/journal-entry.model';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

export type PrismaJournalEntryWithLines = Prisma.JournalEntryGetPayload<{
  include: { ledgerEntries: true };
}>;

export type PrismaJournalEntry = Prisma.JournalEntryGetPayload<Record<string, never>>;

export class JournalEntryInfraMapper {
  /**
   * Maps Prisma journal entry to domain. Ledger lines are not attached (load via LedgerEntryRepository.findByJournalEntryId if needed).
   */
  static toJournalEntryDomain(
    p: PrismaJournalEntryWithLines | PrismaJournalEntry | null,
  ): JournalEntry | null {
    if (!p) return null;
    return new JournalEntry(
      p.id,
      p.entryDate,
      p.description,
      p.status as JournalEntryStatus,
      MapperUtils.nullToUndefined(p.referenceType) as JournalEntryReferenceType | undefined,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.createdById),
      MapperUtils.nullToUndefined(p.postedAt),
      MapperUtils.nullToUndefined(p.postedById),
      MapperUtils.nullToUndefined(p.fiscalPeriodId),
      MapperUtils.nullToUndefined(p.reversalOfId),
      p.version,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toJournalEntryCreatePersistence(domain: JournalEntry): Prisma.JournalEntryUncheckedCreateInput {
    return {
      id: domain.id,
      fiscalPeriodId: MapperUtils.undefinedToNull(domain.fiscalPeriodId),
      entryDate: domain.entryDate,
      description: domain.description,
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      status: domain.status,
      createdById: MapperUtils.undefinedToNull(domain.createdById),
      postedAt: MapperUtils.undefinedToNull(domain.postedAt),
      postedById: MapperUtils.undefinedToNull(domain.postedById),
      reversalOfId: MapperUtils.undefinedToNull(domain.reversalOfId),
      version: domain.version,
    };
  }

  static toJournalEntryUpdatePersistence(domain: JournalEntry): Prisma.JournalEntryUncheckedUpdateInput {
    return {
      entryDate: domain.entryDate,
      description: domain.description,
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      status: domain.status,
      postedAt: MapperUtils.undefinedToNull(domain.postedAt),
      postedById: MapperUtils.undefinedToNull(domain.postedById),
      reversalOfId: MapperUtils.undefinedToNull(domain.reversalOfId),
      version: domain.version,
      updatedAt: domain.updatedAt,
    };
  }
}
