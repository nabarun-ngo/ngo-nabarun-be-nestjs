import { Module } from '@nestjs/common';
//import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { DonationController } from './presentation/controllers/donation.controller';
import { AccountController } from './presentation/controllers/account.controller';
import { ExpenseController } from './presentation/controllers/expense.controller';
import { TransactionController } from './presentation/controllers/transaction.controller';
import { EarningController } from './presentation/controllers/earning.controller';

// Use Cases
import { CreateRegularDonationUseCase } from './application/use-cases/create-regular-donation.use-case';
import { CreateOneTimeDonationUseCase } from './application/use-cases/create-one-time-donation.use-case';
import { CreateDonationUseCase } from './application/use-cases/create-donation.use-case';
import { UpdateDonationUseCase } from './application/use-cases/update-donation.use-case';
import { ProcessDonationPaymentUseCase } from './application/use-cases/process-donation-payment.use-case';
import { ListDonationsUseCase } from './application/use-cases/list-donations.use-case';
import { GetDonationUseCase } from './application/use-cases/get-donation.use-case';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account.use-case';
import { ListAccountsUseCase } from './application/use-cases/list-accounts.use-case';
import { GetAccountUseCase } from './application/use-cases/get-account.use-case';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { SettleExpenseUseCase } from './application/use-cases/settle-expense.use-case';
import { FinalizeExpenseUseCase } from './application/use-cases/finalize-expense.use-case';
import { ListExpensesUseCase } from './application/use-cases/list-expenses.use-case';
import { GetExpenseUseCase } from './application/use-cases/get-expense.use-case';
import { CreateTransactionUseCase } from './application/use-cases/create-transaction.use-case';
import { ListTransactionsUseCase } from './application/use-cases/list-transactions.use-case';
import { GetTransactionUseCase } from './application/use-cases/get-transaction.use-case';
import { CreateEarningUseCase } from './application/use-cases/create-earning.use-case';
import { UpdateEarningUseCase } from './application/use-cases/update-earning.use-case';
import { ListEarningsUseCase } from './application/use-cases/list-earnings.use-case';
import { GetEarningUseCase } from './application/use-cases/get-earning.use-case';

// Services
import { DonationService } from './application/services/donation.service';
import { AccountService } from './application/services/account.service';
import { ExpenseService } from './application/services/expense.service';
import { TransactionService } from './application/services/transaction.service';
import { EarningService } from './application/services/earning.service';

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
    AccountController,
    ExpenseController,
    TransactionController,
    EarningController,
  ],
  imports: [
    //ScheduleModule.forRoot(), // Required for cron jobs
  ],
  providers: [
    // ===== DONATION =====
    CreateRegularDonationUseCase,
    CreateOneTimeDonationUseCase,
    CreateDonationUseCase,
    UpdateDonationUseCase,
    ProcessDonationPaymentUseCase,
    ListDonationsUseCase,
    GetDonationUseCase,
    DonationService,
    {
      provide: DONATION_REPOSITORY,
      useClass: DonationRepository,
    },

    // ===== ACCOUNT =====
    CreateAccountUseCase,
    UpdateAccountUseCase,
    ListAccountsUseCase,
    GetAccountUseCase,
    AccountService,
    {
      provide: ACCOUNT_REPOSITORY,
      useClass: AccountRepository,
    },

    // ===== EXPENSE =====
    CreateExpenseUseCase,
    UpdateExpenseUseCase,
    SettleExpenseUseCase,
    FinalizeExpenseUseCase,
    ListExpensesUseCase,
    GetExpenseUseCase,
    {
      provide: EXPENSE_REPOSITORY,
      useClass: ExpenseRepository,
    },

    // ===== TRANSACTION =====
    CreateTransactionUseCase,
    ListTransactionsUseCase,
    GetTransactionUseCase,
    TransactionService,
    {
      provide: TRANSACTION_REPOSITORY,
      useClass: TransactionRepository,
    },

    // ===== EXPENSE =====
    ExpenseService,

    // ===== EARNING =====
    CreateEarningUseCase,
    UpdateEarningUseCase,
    ListEarningsUseCase,
    GetEarningUseCase,
    EarningService,
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
