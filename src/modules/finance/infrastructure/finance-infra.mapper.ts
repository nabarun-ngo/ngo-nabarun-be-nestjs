import { Donation, DonationType, DonationStatus } from '../domain/model/donation.model';
import { Transaction, TransactionType, TransactionStatus } from '../domain/model/transaction.model';
import { Account, AccountType, AccountStatus } from '../domain/model/account.model';
import { Expense, ExpenseCategory, ExpenseStatus } from '../domain/model/expense.model';
import { Earning, EarningCategory, EarningStatus } from '../domain/model/earning.model';
import { Prisma } from 'prisma/client';
import {
  DonationPersistence,
  TransactionPersistence,
  AccountPersistence,
  ExpensePersistence,
  EarningPersistence,
} from './types/finance-persistence.types';
import { MapperUtils } from 'src/modules/shared/database/mapper-utils';

/**
 * Finance Infrastructure Mapper
 * Handles conversion between Prisma persistence models and Domain models
 */
export class FinanceInfraMapper {
  // ===== DONATION MAPPERS =====

  static toDonationDomain(p: DonationPersistence.Base | any): Donation | null {
    if (!p) return null;

    return new Donation(
      p.id,
      p.type as DonationType,
      Number(p.amount),
      p.currency,
      p.status as DonationStatus,
      MapperUtils.nullToUndefined(p.donorId),
      MapperUtils.nullToUndefined(p.donorName),
      MapperUtils.nullToUndefined(p.donorEmail),
      MapperUtils.nullToUndefined(p.description),
      p.raisedDate,
      MapperUtils.nullToUndefined(p.paidDate),
      MapperUtils.nullToUndefined(p.transactionId),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toDonationCreatePersistence(domain: Donation): Prisma.DonationUncheckedCreateInput {
    return {
      id: domain.id,
      type: domain.type,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      donorId: MapperUtils.undefinedToNull(domain.donorId),
      donorName: MapperUtils.undefinedToNull(domain.donorName),
      donorEmail: MapperUtils.undefinedToNull(domain.donorEmail),
      description: MapperUtils.undefinedToNull(domain.description),
      raisedDate: domain.raisedDate,
      paidDate: MapperUtils.undefinedToNull(domain.paidDate),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toDonationUpdatePersistence(domain: Donation): Prisma.DonationUncheckedUpdateInput {
    return {
      status: domain.status,
      paidDate: MapperUtils.undefinedToNull(domain.paidDate),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      updatedAt: new Date(),
    };
  }

  // ===== TRANSACTION MAPPERS =====

  static toTransactionDomain(p: TransactionPersistence.Base | any): Transaction | null {
    if (!p) return null;

    return new Transaction(
      p.id,
      p.type as TransactionType,
      Number(p.amount),
      p.currency,
      p.status as TransactionStatus,
      p.accountId,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType),
      p.description,
      p.metadata as Record<string, any> | undefined,
      p.transactionDate,
      p.createdAt,
      p.updatedAt,
    );
  }

  static toTransactionCreatePersistence(domain: Transaction): Prisma.TransactionCreateInput {
    return {
      id: domain.id,
      type: domain.type,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      account: { connect: { id: domain.accountId } },
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      description: domain.description,
      metadata: domain.metadata as Prisma.InputJsonValue,
      transactionDate: domain.transactionDate,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  // ===== ACCOUNT MAPPERS =====

  static toAccountDomain(p: AccountPersistence.Base | any): Account | null {
    if (!p) return null;

    return new Account(
      p.id,
      p.name,
      p.type as AccountType,
      Number(p.balance),
      p.currency,
      p.status as AccountStatus,
      MapperUtils.nullToUndefined(p.description),
      p.createdAt,
      p.updatedAt,
      p.version,
    );
  }

  static toAccountCreatePersistence(domain: Account): Prisma.AccountUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      balance: domain.balance,
      currency: domain.currency,
      status: domain.status,
      description: MapperUtils.undefinedToNull(domain.description),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
      version: domain.version,
    };
  }

  static toAccountUpdatePersistence(domain: Account): Prisma.AccountUncheckedUpdateInput {
    return {
      name: domain.name,
      balance: domain.balance,
      status: domain.status,
      description: MapperUtils.undefinedToNull(domain.description),
      updatedAt: new Date(),
    };
  }

  // ===== EXPENSE MAPPERS =====

  static toExpenseDomain(p: ExpensePersistence.Base | any): Expense | null {
    if (!p) return null;

    return new Expense(
      p.id,
      p.category as ExpenseCategory,
      Number(p.amount),
      p.currency,
      p.status as ExpenseStatus,
      p.description,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType),
      p.requestedBy,
      MapperUtils.nullToUndefined(p.approvedBy),
      MapperUtils.nullToUndefined(p.accountId),
      MapperUtils.nullToUndefined(p.transactionId),
      MapperUtils.nullToUndefined(p.receiptUrl),
      p.expenseDate,
      MapperUtils.nullToUndefined(p.approvedDate),
      MapperUtils.nullToUndefined(p.paidDate),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toExpenseCreatePersistence(domain: Expense): Prisma.ExpenseUncheckedCreateInput {
    return {
      id: domain.id,
      category: domain.category,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      description: domain.description,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      requestedBy: domain.requestedBy,
      approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
      accountId: MapperUtils.undefinedToNull(domain.accountId),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      receiptUrl: MapperUtils.undefinedToNull(domain.receiptUrl),
      expenseDate: domain.expenseDate,
      approvedDate: MapperUtils.undefinedToNull(domain.approvedDate),
      paidDate: MapperUtils.undefinedToNull(domain.paidDate),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toExpenseUpdatePersistence(domain: Expense): Prisma.ExpenseUncheckedUpdateInput {
    return {
      status: domain.status,
      approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
      accountId: MapperUtils.undefinedToNull(domain.accountId),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      approvedDate: MapperUtils.undefinedToNull(domain.approvedDate),
      paidDate: MapperUtils.undefinedToNull(domain.paidDate),
      updatedAt: new Date(),
    };
  }

  // ===== EARNING MAPPERS =====

  static toEarningDomain(p: EarningPersistence.Base | any): Earning | null {
    if (!p) return null;

    return new Earning(
      p.id,
      p.category as EarningCategory,
      Number(p.amount),
      p.currency,
      p.status as EarningStatus,
      p.description,
      p.source,
      MapperUtils.nullToUndefined(p.referenceId),
      MapperUtils.nullToUndefined(p.referenceType),
      MapperUtils.nullToUndefined(p.accountId),
      MapperUtils.nullToUndefined(p.transactionId),
      p.earningDate,
      MapperUtils.nullToUndefined(p.receivedDate),
      p.createdAt,
      p.updatedAt,
    );
  }

  static toEarningCreatePersistence(domain: Earning): Prisma.EarningUncheckedCreateInput {
    return {
      id: domain.id,
      category: domain.category,
      amount: domain.amount,
      currency: domain.currency,
      status: domain.status,
      description: domain.description,
      source: domain.source,
      referenceId: MapperUtils.undefinedToNull(domain.referenceId),
      referenceType: MapperUtils.undefinedToNull(domain.referenceType),
      accountId: MapperUtils.undefinedToNull(domain.accountId),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      earningDate: domain.earningDate,
      receivedDate: MapperUtils.undefinedToNull(domain.receivedDate),
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
    };
  }

  static toEarningUpdatePersistence(domain: Earning): Prisma.EarningUncheckedUpdateInput {
    return {
      status: domain.status,
      accountId: MapperUtils.undefinedToNull(domain.accountId),
      transactionId: MapperUtils.undefinedToNull(domain.transactionId),
      receivedDate: MapperUtils.undefinedToNull(domain.receivedDate),
      updatedAt: new Date(),
    };
  }
}
