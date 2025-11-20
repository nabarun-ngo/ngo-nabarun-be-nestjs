import { Prisma } from '@prisma/client';

/**
 * Finance Module Persistence Types
 * Defines type-safe Prisma query result types for all finance entities
 */

// ===== ACCOUNT TYPES =====
export namespace AccountPersistence {
  export type Base = Prisma.AccountGetPayload<{
    select: {
      id: true;
      name: true;
      type: true;
      balance: true;
      currency: true;
      status: true;
      description: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithTransactions = Prisma.AccountGetPayload<{
    include: {
      transactions: true;
    };
  }>;
}

// ===== DONATION TYPES =====
export namespace DonationPersistence {
  export type Base = Prisma.DonationGetPayload<{
    select: {
      id: true;
      type: true;
      amount: true;
      currency: true;
      status: true;
      donorId: true;
      donorName: true;
      donorEmail: true;
      description: true;
      raisedDate: true;
      paidDate: true;
      transactionId: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithDonor = Prisma.DonationGetPayload<{
    include: {
      donor: true;
    };
  }>;

  export type WithTransaction = Prisma.DonationGetPayload<{
    include: {
      transaction: true;
    };
  }>;
}

// ===== TRANSACTION TYPES =====
export namespace TransactionPersistence {
  export type Base = Prisma.TransactionGetPayload<{
    select: {
      id: true;
      type: true;
      amount: true;
      currency: true;
      status: true;
      accountId: true;
      referenceId: true;
      referenceType: true;
      description: true;
      metadata: true;
      transactionDate: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithAccount = Prisma.TransactionGetPayload<{
    include: {
      account: true;
    };
  }>;
}

// ===== EXPENSE TYPES =====
export namespace ExpensePersistence {
  export type Base = Prisma.ExpenseGetPayload<{
    select: {
      id: true;
      category: true;
      amount: true;
      currency: true;
      status: true;
      description: true;
      referenceId: true;
      referenceType: true;
      requestedBy: true;
      approvedBy: true;
      accountId: true;
      transactionId: true;
      receiptUrl: true;
      expenseDate: true;
      approvedDate: true;
      paidDate: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithAccount = Prisma.ExpenseGetPayload<{
    include: {
      account: true;
    };
  }>;
}

// ===== EARNING TYPES =====
export namespace EarningPersistence {
  export type Base = Prisma.EarningGetPayload<{
    select: {
      id: true;
      category: true;
      amount: true;
      currency: true;
      status: true;
      description: true;
      source: true;
      referenceId: true;
      referenceType: true;
      accountId: true;
      transactionId: true;
      earningDate: true;
      receivedDate: true;
      createdAt: true;
      updatedAt: true;
      version: true;
      deletedAt: true;
    };
  }>;

  export type WithAccount = Prisma.EarningGetPayload<{
    include: {
      account: true;
    };
  }>;
}
