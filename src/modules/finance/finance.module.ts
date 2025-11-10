import { Module } from '@nestjs/common';
//import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { DonationController } from './presentation/controllers/donation.controller';

// Use Cases
import { CreateRegularDonationUseCase } from './application/use-cases/create-regular-donation.use-case';
import { CreateOneTimeDonationUseCase } from './application/use-cases/create-one-time-donation.use-case';
import { ProcessDonationPaymentUseCase } from './application/use-cases/process-donation-payment.use-case';

// Repositories
import { DONATION_REPOSITORY } from './domain/repositories/donation.repository.interface';
import { TRANSACTION_REPOSITORY } from './domain/repositories/transaction.repository.interface';
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository.interface';
import { EXPENSE_REPOSITORY } from './domain/repositories/expense.repository.interface';
import { EARNING_REPOSITORY } from './domain/repositories/earning.repository.interface';

import DonationRepository from './infrastructure/persistence/donation.repository';
import TransactionRepository from './infrastructure/persistence/transaction.repository';
import AccountRepository from './infrastructure/persistence/account.repository';
import ExpenseRepository from './infrastructure/persistence/expense.repository';
import EarningRepository from './infrastructure/persistence/earning.repository';

// Handlers
import { MonthlyDonationsJobHandler } from './application/handlers/monthly-donations-job.handler';

/**
 * Finance Module
 * Manages donations, expenses, earnings, transactions, and accounts
 * 
 * Features:
 * - Regular donations (monthly subscriptions for internal users)
 * - One-time donations (from guests or members)
 * - Automated monthly donation raising (1st of each month)
 * - Expense tracking and approval workflow
 * - Earning/income tracking
 * - Transaction management
 * - Account management
 */
@Module({
  controllers: [
    DonationController,
    // TODO: Add more controllers
    // TransactionController,
    // AccountController,
    // ExpenseController,
    // EarningController,
  ],
  imports: [
    //ScheduleModule.forRoot(), // Required for cron jobs
  ],
  providers: [
    // ===== DONATION =====
    CreateRegularDonationUseCase,
    CreateOneTimeDonationUseCase,
    ProcessDonationPaymentUseCase,
    {
      provide: DONATION_REPOSITORY,
      useClass: DonationRepository,
    },

    // ===== TRANSACTION =====
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },

    // ===== ACCOUNT =====
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: AccountRepository,
    },

    // ===== EXPENSE =====
    {
      provide: EXPENSE_REPOSITORY,
      useClass: ExpenseRepository,
    },

    // ===== EARNING =====
    {
      provide: EARNING_REPOSITORY,
      useClass: EarningRepository,
    },

    // ===== HANDLERS =====
    MonthlyDonationsJobHandler,
  ],
  exports: [
    DONATION_REPOSITORY,
    TRANSACTION_REPOSITORY,
    ACCOUNT_REPOSITORY,
    EXPENSE_REPOSITORY,
    EARNING_REPOSITORY,
  ],
})
export class FinanceModule {}
