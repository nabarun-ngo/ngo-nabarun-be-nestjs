# Finance Module Implementation Guide

## Overview
This document outlines the implementation of the finance module to match the legacy system exactly. All endpoints, DTOs, and database schema have been aligned with the legacy API.

## Database Schema Changes

### Prisma Schema Updates

#### Donation Model
- Updated `type` enum: Changed from `ONE_TIME` to `ONETIME` (legacy)
- Updated `status` enum: Now includes `PENDING`, `PAYMENT_FAILED`, `PAY_LATER`, `UPDATE_MISTAKE` (removed `FAILED`)
- Added legacy fields:
  - `isGuest` (Boolean)
  - `startDate`, `endDate` (DateTime, for regular donations)
  - `raisedOn`, `paidOn` (DateTime, legacy aliases)
  - `confirmedBy`, `confirmedOn` (User reference and date)
  - `paymentMethod` (String: CASH, NETBANKING, UPI)
  - `paidToAccountId` (Account reference)
  - `forEventId` (Event reference)
  - `paidUsingUPI` (String: GPAY, PAYTM, PHONEPE, BHARATPAY, UPI_OTH)
  - `isPaymentNotified` (Boolean)
  - `transactionRef` (String, legacy alias)
  - `remarks`, `cancelletionReason`, `laterPaymentReason`, `paymentFailureDetail` (String)
  - `additionalFields` (JSON)

#### Account Model
- Updated `type` enum: Changed to `PRINCIPAL`, `GENERAL`, `DONATION`, `PUBLIC_DONATION` (legacy)
- Updated `status` enum: Changed to `ACTIVE`, `INACTIVE`, `BLOCKED` (legacy)
- Added legacy fields:
  - `accountHolderName` (String)
  - `accountHolderId` (User reference)
  - `activatedOn` (DateTime)
  - `bankDetail` (JSON: BankDetail structure)
  - `upiDetail` (JSON: UPIDetail structure)
- Added relation to UserProfile for account holder

### Migration Required
Run the following to create and apply the migration:
```bash
npx prisma migrate dev --name add_legacy_finance_fields
```

## DTOs Created

### 1. Account DTOs (`account.dto.ts`)
- `AccountDetailDto` - Matches legacy `AccountDetail`
- `AccountDetailFilterDto` - Filter for listing accounts
- `CreateAccountDto` - Create account request
- `UpdateAccountDto` - Update account request
- `BankDetailDto` - Bank account details
- `UPIDetailDto` - UPI payment details
- Enums: `AccountType`, `AccountStatus`

### 2. Expense DTOs (`expense.dto.ts`)
- `ExpenseDetailDto` - Matches legacy `ExpenseDetail`
- `ExpenseDetailFilterDto` - Filter for listing expenses
- `CreateExpenseDto` - Create expense request
- `UpdateExpenseDto` - Update expense request
- `ExpenseItemDetailDto` - Expense line items
- Enums: `ExpenseStatus`, `ExpenseCategory`, `ExpenseRefType`

### 3. Transaction DTOs (`transaction.dto.ts`)
- `TransactionDetailDto` - Matches legacy `TransactionDetail`
- `TransactionDetailFilterDto` - Filter for listing transactions
- `CreateTransactionDto` - Create transaction request
- Enums: `TransactionType`, `TransactionStatus`, `TransactionRefType`

### 4. Payment DTOs (`payment.dto.ts`)
- `PaymentMethod` enum: CASH, NETBANKING, UPI
- `UPIPaymentType` enum: GPAY, PAYTM, PHONEPE, BHARATPAY, UPI_OTH
- `AdditionalFieldDto` - Custom fields structure

## Controllers Created

### 1. Donation Controller (`donation.controller.ts`)
**Base Path:** `/api/donation`

Endpoints (matching legacy):
- `POST /api/donation/create` - Create new donation
- `PUT /api/donation/:id/update` - Update donation details
- `POST /api/donation/:id/payment` - Process payment for donation
- `GET /api/donation/:id/documents` - Get documents for donation
- `GET /api/donation/:id/changes` - Get donation changes/history
- `GET /api/donation/:donorId/summary` - Get donation summary for donor
- `GET /api/donation/:donorId/list` - Get donations by donor
- `GET /api/donation/self/list` - Get own donations
- `GET /api/donation/list` - List all donations
- `GET /api/donation/guest/list` - List guest donations

### 2. Account Controller (`account.controller.ts`)
**Base Path:** `/api/account`

Endpoints (matching legacy):
- `POST /api/account/create` - Create new account
- `PUT /api/account/:id/update` - Update account details
- `PUT /api/account/:id/update/self` - Update own account details
- `GET /api/account/list` - List all accounts
- `GET /api/account/self/list` - List own accounts
- `POST /api/account/:id/transaction/create` - Create transaction for account
- `GET /api/account/:id/transaction/list` - List transactions for account
- `GET /api/account/:id/transaction/self/list` - List own transactions for account
- `POST /api/account/expense/create` - Create expense
- `PUT /api/account/expense/:id/update` - Update expense
- `POST /api/account/expense/:id/settle` - Settle expense
- `POST /api/account/expense/:id/finalize` - Finalize expense
- `GET /api/account/expense/list` - List all expenses
- `GET /api/account/expense/list/self` - List own expenses

## Next Steps - Implementation Required

### 1. Domain Model Updates
Update domain models to support new fields:
- `Donation` model - Add methods for new statuses and fields
- `Account` model - Add bank/UPI detail handling
- `Expense` model - Align with legacy structure
- `Transaction` model - Align with legacy structure

### 2. Use Cases to Create
For Donations:
- `CreateDonationUseCase`
- `UpdateDonationUseCase`
- `ProcessDonationPaymentUseCase`
- `ListDonationsUseCase`
- `GetDonationUseCase`
- `GetDonationDocumentsUseCase`
- `GetDonationChangesUseCase`
- `GetDonorSummaryUseCase`

For Accounts:
- `CreateAccountUseCase`
- `UpdateAccountUseCase`
- `ListAccountsUseCase`
- `GetAccountUseCase`
- `CreateTransactionUseCase`
- `ListTransactionsUseCase`

For Expenses:
- `CreateExpenseUseCase`
- `UpdateExpenseUseCase`
- `SettleExpenseUseCase`
- `FinalizeExpenseUseCase`
- `ListExpensesUseCase`

### 3. Repository Updates
Update repositories to:
- Support new fields in queries
- Handle JSON fields (bankDetail, upiDetail, additionalFields)
- Support new filter criteria
- Map between domain and persistence models correctly

### 4. Mapper Updates
Update `finance-infra.mapper.ts` to:
- Map new Donation fields (raisedOn, paidOn, transactionRef, etc.)
- Map Account fields (bankDetail, upiDetail, accountHolder)
- Map Expense fields
- Map Transaction fields

### 5. Database Migration
1. Generate migration: `npx prisma migrate dev --name add_legacy_finance_fields`
2. Review the generated migration SQL
3. Apply migration: `npx prisma migrate deploy` (for production)

## Field Mapping Notes

### Donation Field Mappings
- Domain `raisedDate` → DTO `raisedOn` (legacy name)
- Domain `paidDate` → DTO `paidOn` (legacy name)
- Domain `transactionId` → DTO `transactionRef` (legacy name)
- Keep both for backward compatibility during transition

### Account Field Mappings
- `bankDetail` and `upiDetail` stored as JSON in database
- Map to/from DTOs using `BankDetailDto` and `UPIDetailDto`

### Status Enum Mappings
- DonationStatus: Use legacy values (RAISED, PAID, PENDING, PAYMENT_FAILED, PAY_LATER, CANCELLED, UPDATE_MISTAKE)
- AccountStatus: Use legacy values (ACTIVE, INACTIVE, BLOCKED)
- ExpenseStatus: Use legacy values (DRAFT, SUBMITTED, FINALIZED, SETTLED, REJECTED)

## Testing Checklist

- [ ] Run Prisma migration successfully
- [ ] Verify all DTOs are properly registered in Swagger
- [ ] Test donation endpoints match legacy structure
- [ ] Test account endpoints match legacy structure
- [ ] Test expense endpoints match legacy structure
- [ ] Verify enum values match legacy exactly
- [ ] Test field mappings (raisedOn/raisedDate, etc.)
- [ ] Verify JSON fields (bankDetail, upiDetail) serialize correctly

## Notes

- All controllers currently throw "Not implemented" - these need to be implemented with use cases
- Domain models may need updates to support new business logic
- Consider adding validation for new fields
- Ensure backward compatibility during migration period


