import { Module } from '@nestjs/common';
//import { ScheduleModule } from '@nestjs/schedule';

// Controllers
import { DonationController } from './presentation/controllers/donation.controller';
import { AccountController } from './presentation/controllers/account.controller';
import { ExpenseController } from './presentation/controllers/expense.controller';
import { JournalEntryController } from './presentation/controllers/journal-entry.controller';
import { LedgerController } from './presentation/controllers/ledger.controller';
import { FiscalPeriodController } from './presentation/controllers/fiscal-period.controller';

// Use Cases
import { CreateDonationUseCase } from './application/use-cases/create-donation.use-case';
import { UpdateDonationUseCase } from './application/use-cases/update-donation.use-case';
import { ProcessDonationPaymentUseCase } from './application/use-cases/process-donation-payment.use-case';
import { CreateAccountUseCase } from './application/use-cases/create-account.use-case';
import { UpdateAccountUseCase } from './application/use-cases/update-account.use-case';
import { CreateExpenseUseCase } from './application/use-cases/create-expense.use-case';
import { UpdateExpenseUseCase } from './application/use-cases/update-expense.use-case';
import { SettleExpenseUseCase } from './application/use-cases/settle-expense.use-case';
import { FinalizeExpenseUseCase } from './application/use-cases/finalize-expense.use-case';
import { CreateEarningUseCase } from './application/use-cases/create-earning.use-case';
import { UpdateEarningUseCase } from './application/use-cases/update-earning.use-case';
import { GenerateDonationSummaryReportUseCase } from './application/use-cases/generate-donation-summary.use-case';
import { GetTrialBalanceUseCase } from './application/use-cases/get-trial-balance.use-case';
import { GetLedgerByAccountUseCase } from './application/use-cases/get-ledger-by-account.use-case';
import { GenerateTrialBalanceExcelUseCase } from './application/use-cases/generate-trial-balance-excel.use-case';
import { GenerateLedgerByAccountExcelUseCase } from './application/use-cases/generate-ledger-by-account-excel.use-case';
import { PostToLedgerUseCase } from './application/use-cases/post-to-ledger.use-case';
import { ReverseJournalEntryUseCase } from './application/use-cases/reverse-journal-entry.use-case';
import { BackfillLedgerEntryUseCase } from './application/use-cases/backfill-ledger-entry.use-case';

// Services
import { DonationService } from './application/services/donation.service';
import { AccountService } from './application/services/account.service';
import { ExpenseService } from './application/services/expense.service';
import { EarningService } from './application/services/earning.service';

// Repositories
import { DONATION_REPOSITORY } from './domain/repositories/donation.repository.interface';
import { ACCOUNT_REPOSITORY } from './domain/repositories/account.repository.interface';
import { EXPENSE_REPOSITORY } from './domain/repositories/expense.repository.interface';
import { EARNING_REPOSITORY } from './domain/repositories/earning.repository.interface';
import { JOURNAL_ENTRY_REPOSITORY } from './domain/repositories/journal-entry.repository.interface';
import { LEDGER_ENTRY_REPOSITORY } from './domain/repositories/ledger-entry.repository.interface';
import { FISCAL_PERIOD_REPOSITORY } from './domain/repositories/fiscal-period.repository.interface';

import DonationRepository from './infrastructure/persistence/donation.repository';
import AccountRepository from './infrastructure/persistence/account.repository';
import ExpenseRepository from './infrastructure/persistence/expense.repository';
import EarningRepository from './infrastructure/persistence/earning.repository';
import JournalEntryRepository from './infrastructure/persistence/journal-entry.repository';
import LedgerEntryRepository from './infrastructure/persistence/ledger-entry.repository';
import FiscalPeriodRepository from './infrastructure/persistence/fiscal-period.repository';

// Handlers
import { UserModule } from '../user/user.module';
import { MetadataService } from './infrastructure/external/metadata.service';
import { FirebaseModule } from '../shared/firebase/firebase.module';
import { DonationsEventHandler } from './application/handlers/donation-event.handler';
import { DonationJobsHandler } from './application/handlers/donation-jobs.handler';
import { DocumentGeneratorModule } from '../shared/document-generator/document-generator.module';
import { FinanceReportService } from './application/services/report.service';
import { DMSModule } from '../shared/dms/dms.module';
import { FinanceReportController } from './presentation/controllers/finance-report.controller';


/**
 * Finance Module
 * Manages donations, expenses, earnings, journal/ledger (double-entry), and accounts
 * 
 * Features:
 * - Regular donations (monthly subscriptions for internal users)
 * - One-time donations (from guests or members)
 * - Automated monthly donation raising (1st of each month)
 * - Expense tracking and approval workflow
 * - Earning/income tracking
 * - Journal/ledger (double-entry) and account activity
 * - Account management
 */
@Module({
  controllers: [
    DonationController,
    AccountController,
    ExpenseController,
    JournalEntryController,
    LedgerController,
    FiscalPeriodController,
    //EarningController,
    FinanceReportController,
  ],
  imports: [
    UserModule,
    FirebaseModule,
    DocumentGeneratorModule,
    DMSModule,
  ],
  providers: [
    // ===== DONATION =====
    CreateDonationUseCase,
    UpdateDonationUseCase,
    ProcessDonationPaymentUseCase,
    GenerateDonationSummaryReportUseCase,
    GetTrialBalanceUseCase,
    GetLedgerByAccountUseCase,
    GenerateTrialBalanceExcelUseCase,
    GenerateLedgerByAccountExcelUseCase,
    PostToLedgerUseCase,
    ReverseJournalEntryUseCase,
    BackfillLedgerEntryUseCase,
    DonationService,
    {
      provide: DONATION_REPOSITORY,
      useClass: DonationRepository,
    },

    // ===== ACCOUNT =====
    CreateAccountUseCase,
    UpdateAccountUseCase,
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
    ExpenseService,
    {
      provide: EXPENSE_REPOSITORY,
      useClass: ExpenseRepository,
    },

    // ===== EARNING =====
    CreateEarningUseCase,
    UpdateEarningUseCase,
    EarningService,
    {
      provide: EARNING_REPOSITORY,
      useClass: EarningRepository,
    },

    // ===== JOURNAL / LEDGER / FISCAL PERIOD (audit-ready accounting) =====
    {
      provide: JOURNAL_ENTRY_REPOSITORY,
      useClass: JournalEntryRepository,
    },
    {
      provide: LEDGER_ENTRY_REPOSITORY,
      useClass: LedgerEntryRepository,
    },
    {
      provide: FISCAL_PERIOD_REPOSITORY,
      useClass: FiscalPeriodRepository,
    },

    // ===== HANDLERS =====
    MetadataService,
    DonationsEventHandler,
    DonationJobsHandler,
    FinanceReportService
  ],
  exports: [
    DONATION_REPOSITORY,
    ACCOUNT_REPOSITORY,
    EXPENSE_REPOSITORY,
    EARNING_REPOSITORY,
    JOURNAL_ENTRY_REPOSITORY,
    LEDGER_ENTRY_REPOSITORY,
    FISCAL_PERIOD_REPOSITORY,
    CreateDonationUseCase,
    PostToLedgerUseCase,
  ],
})
export class FinanceModule { }
