# Finance Module

## Overview

The Finance Module manages all financial operations including donations, expenses, earnings, transactions, and accounts. It supports both regular monthly donations (subscriptions) and one-time donations from guests or members. All endpoints, DTOs, and the database schema have been aligned with the legacy system.

## Features

### 💰 Donations
- **Regular Donations**: Monthly subscription donations for internal users.
- **One-Time Donations**: Single donations from guests or internal members.
- **Automatic Monthly Raising**: Cron job raises donations on the 1st of every month.
- **Payment Processing**: Links donations to transactions and accounts.
- **Status Tracking**: RAISED → PAID → COMPLETED workflow. Includes statuses like PENDING, PAYMENT_FAILED, PAY_LATER, and UPDATE_MISTAKE to match legacy logic.
- **Legacy Compatibility**: Includes fields like `isGuest`, `raisedOn`, `paidOn`, `paymentMethod`, `paidUsingUPI`, etc.

### 💳 Transactions
- **Multi-Type Support**: DONATION, EXPENSE, EARNING, TRANSFER.
- **Account Linking**: All transactions are linked to accounts.
- **Reference Tracking**: Links to the source (donation, expense, or earning).
- **Immutable Records**: Transactions cannot be modified after creation.

### 🏦 Accounts
- **Account Types**: PRINCIPAL, GENERAL, DONATION, PUBLIC_DONATION.
- **Balance Tracking**: Real-time balance updates.
- **Account Status**: ACTIVE, INACTIVE, BLOCKED.
- **Details**: Maintains bank and UPI details in JSON format.

### 📊 Expenses
- **Categories**: PROJECT, EVENT, ADHOC, OPERATIONAL, ADMINISTRATIVE.
- **Approval Workflow**: PENDING → APPROVED → PAID. (Legacy statuses: DRAFT, SUBMITTED, FINALIZED, SETTLED, REJECTED).
- **Receipt Management**: URL storage for receipts/invoices.

### 📈 Earnings
- **Categories**: SERVICE, PRODUCT, GRANT, SPONSORSHIP, OTHER.
- **Source Tracking**: Record earning sources.
- **Status Management**: PENDING → RECEIVED.

## Architecture

The module follows Domain-Driven Design (DDD):
- `domain/`: Business logic, domain entities (Donation, Transaction, Account, Expense, Earning), repositories, events, and value objects.
- `application/`: Use cases and handlers (e.g., `monthly-donations-job.handler.ts`).
- `infrastructure/`: Persistence, Prisma repositories, and mappers.
- `presentation/`: API layer (Controllers).

## Database Schema Highlights

- **Donation Model**: Supports `ONETIME` types, comprehensive legacy fields (`isGuest`, `paidToAccountId`, `forEventId`, etc.), and JSON fields for `additionalFields`.
- **Account Model**: Holds relations to `UserProfile` as account holders, stores `bankDetail` and `upiDetail` as JSON.
- **Activity Expense (Junction)**: Links `Expense` entities directly to Project Activities, supporting percentage-based or absolute allocation amounts.

## Automated Auditing (Zero-Touch Approach)

We use a **Prisma Extension** to automatically capture audit logs for financial models without requiring any changes to business logic or Use Cases.

### How it works:
1. **Context Capture**: A middleware and the AuthGuard automatically populate the current User ID, IP address, and User Agent into a secure `TraceContext` (using Node.js `AsyncLocalStorage`).
2. **Database Interception**: A custom Prisma Extension (`prismaAuditExtension`) listens for all `create`, `update`, `upsert`, and `delete` operations on financial models.
3. **Delta Logging**: For updates, the extension logs exactly what fields were changed, avoiding extra database lookups.

### Why this is better:
- **Zero Maintenance**: No need to inject `AuditService` or call `.log()` in new Use Cases.
- **Performance**: Uses data already present in Prisma operation arguments.
- **Reliability**: Works seamlessly even in background cron jobs.

*(Note: For manual overrides, `AuditService.log()` can still be used directly).*

## API Endpoints

### Donations (`/api/donation`)
- `POST /create` - Create new donation (matches legacy)
- `PUT /:id/update` - Update donation details
- `POST /:id/payment` - Process payment
- `GET /self/list` - Get own donations
- `GET /guest/list` - List guest donations

### Accounts (`/api/account`)
- `POST /create` - Create new account
- `PUT /:id/update` - Update account details
- `GET /list` - List all accounts
- `POST /:id/transaction/create` - Create transaction
- `POST /expense/create` - Create expense
- `POST /expense/:id/settle` - Settle expense

## Next Steps / TODOs

### Domain & Use Case Implementation
- Complete `CreateDonationUseCase`, `ProcessDonationPaymentUseCase`, `GetDonorSummaryUseCase`, etc.
- Implement domain logic for Accounts and Expenses to match legacy behavior.
- Ensure all controllers (which may currently throw "Not implemented") are connected to their respective use cases.

### Additional Features
- Recurring expense tracking
- Budget management
- Financial reports (monthly, yearly) and CSV/Excel exports
- Payment gateway integration
- Email/SMS notifications for donations and reminders

## Configuration

- **Cron Schedule**: Monthly donation job runs on the 1st of every month at midnight UTC (`@Cron('0 0 1 * *')`).
- **Currency**: Default is USD (or INR as per implementation).

## Testing
```bash
# Run all finance module tests
npm test -- finance
# E2E tests
npm run test:e2e -- finance
```
