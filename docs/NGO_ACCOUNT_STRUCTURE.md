# NGO Account Structure - Logical Account Types

## Overview
This document defines the logical account structure for an NGO following nonprofit accounting principles. Accounts are categorized by their accounting nature and purpose.

## Account Categories

### 1. ASSET ACCOUNTS (What the NGO owns)

#### 1.1 Cash & Bank Accounts
- **CASH_ON_HAND**: Physical cash held by NGO
- **BANK_ACCOUNT**: Bank accounts (can link to physical BankAccount)
- **PETTY_CASH**: Small amounts for daily expenses

#### 1.2 Receivables
- **DONATIONS_RECEIVABLE**: Pledged donations not yet received
- **GRANTS_RECEIVABLE**: Approved grants pending disbursement
- **OTHER_RECEIVABLES**: Other amounts owed to NGO

#### 1.3 Investments
- **INVESTMENTS**: Short-term and long-term investments
- **FIXED_DEPOSITS**: Fixed deposits with banks

#### 1.4 Fixed Assets
- **FIXED_ASSETS**: Property, equipment, vehicles (if tracking in ledger)

---

### 2. LIABILITY ACCOUNTS (What the NGO owes)

#### 2.1 Payables
- **ACCOUNTS_PAYABLE**: Money owed to vendors/suppliers
- **EXPENSES_PAYABLE**: Approved expenses not yet paid
- **SALARIES_PAYABLE**: Unpaid salaries

#### 2.2 Loans & Borrowings
- **LOANS_PAYABLE**: Loans taken by NGO
- **BORROWINGS**: Other borrowings

#### 2.3 Grants & Donations Payable
- **GRANTS_PAYABLE**: Grants approved but not yet disbursed
- **DONATIONS_PAYABLE**: Donations committed but not yet paid

---

### 3. NET ASSETS / EQUITY ACCOUNTS

#### 3.1 Unrestricted Net Assets
- **UNRESTRICTED_FUNDS**: General funds without restrictions
- **OPERATING_RESERVE**: Operating reserve fund
- **EMERGENCY_RESERVE**: Emergency/contingency fund

#### 3.2 Temporarily Restricted Net Assets
- **RESTRICTED_FUNDS**: Funds with time/use restrictions
- **PROJECT_FUNDS**: Funds restricted to specific projects

#### 3.3 Permanently Restricted Net Assets
- **ENDOWMENT_FUNDS**: Permanent endowments

---

### 4. REVENUE / INCOME ACCOUNTS

#### 4.1 Donation Income
- **DONATION_INCOME**: General donation income (currently using PRINCIPAL)
- **REGULAR_DONATION_INCOME**: Monthly subscription donations
- **ONE_TIME_DONATION_INCOME**: One-time donations
- **CORPORATE_DONATIONS**: Corporate donations
- **FOREIGN_DONATIONS**: Foreign donations

#### 4.2 Grant Income
- **GRANT_INCOME**: Grant revenue
- **GOVERNMENT_GRANTS**: Government grants
- **FOUNDATION_GRANTS**: Foundation grants
- **INTERNATIONAL_GRANTS**: International grants

#### 4.3 Program Service Revenue
- **SERVICE_REVENUE**: Revenue from services provided
- **PROGRAM_FEES**: Fees from programs

#### 4.4 Other Income
- **INTEREST_INCOME**: Interest earned
- **SPONSORSHIP_INCOME**: Sponsorship revenue
- **OTHER_INCOME**: Miscellaneous income

---

### 5. EXPENSE ACCOUNTS

#### 5.1 Program Expenses
- **PROGRAM_EXPENSES**: Direct program costs
- **PROJECT_EXPENSES**: Project-specific expenses
- **EVENT_EXPENSES**: Event-related expenses
- **BENEFICIARY_EXPENSES**: Direct beneficiary support

#### 5.2 Administrative Expenses
- **ADMINISTRATIVE_EXPENSES**: General administrative costs
- **SALARIES_ADMIN**: Administrative staff salaries
- **OFFICE_EXPENSES**: Office rent, utilities, supplies
- **LEGAL_FEES**: Legal and compliance costs
- **AUDIT_FEES**: Audit and accounting fees

#### 5.3 Fundraising Expenses
- **FUNDRAISING_EXPENSES**: Fundraising costs
- **MARKETING_EXPENSES**: Marketing and promotion
- **CAMPAIGN_EXPENSES**: Fundraising campaign costs

#### 5.4 Other Expenses
- **BANK_CHARGES**: Bank fees and charges
- **DEPRECIATION**: Asset depreciation (if tracked)
- **OTHER_EXPENSES**: Miscellaneous expenses

---

## Recommended Account Type Enum Structure

```typescript
export enum AccountType {
  // ===== ASSET ACCOUNTS =====
  CASH_ON_HAND = 'CASH_ON_HAND',
  BANK_ACCOUNT = 'BANK_ACCOUNT',
  PETTY_CASH = 'PETTY_CASH',
  DONATIONS_RECEIVABLE = 'DONATIONS_RECEIVABLE',
  GRANTS_RECEIVABLE = 'GRANTS_RECEIVABLE',
  INVESTMENTS = 'INVESTMENTS',
  FIXED_DEPOSITS = 'FIXED_DEPOSITS',
  
  // ===== LIABILITY ACCOUNTS =====
  ACCOUNTS_PAYABLE = 'ACCOUNTS_PAYABLE',
  EXPENSES_PAYABLE = 'EXPENSES_PAYABLE',
  SALARIES_PAYABLE = 'SALARIES_PAYABLE',
  LOANS_PAYABLE = 'LOANS_PAYABLE',
  
  // ===== NET ASSETS =====
  UNRESTRICTED_FUNDS = 'UNRESTRICTED_FUNDS',
  OPERATING_RESERVE = 'OPERATING_RESERVE',
  RESTRICTED_FUNDS = 'RESTRICTED_FUNDS',
  PROJECT_FUNDS = 'PROJECT_FUNDS',
  ENDOWMENT_FUNDS = 'ENDOWMENT_FUNDS',
  
  // ===== REVENUE ACCOUNTS =====
  DONATION_INCOME = 'DONATION_INCOME',
  REGULAR_DONATION_INCOME = 'REGULAR_DONATION_INCOME',
  ONE_TIME_DONATION_INCOME = 'ONE_TIME_DONATION_INCOME',
  GRANT_INCOME = 'GRANT_INCOME',
  SERVICE_REVENUE = 'SERVICE_REVENUE',
  INTEREST_INCOME = 'INTEREST_INCOME',
  SPONSORSHIP_INCOME = 'SPONSORSHIP_INCOME',
  OTHER_INCOME = 'OTHER_INCOME',
  
  // ===== EXPENSE ACCOUNTS =====
  PROGRAM_EXPENSES = 'PROGRAM_EXPENSES',
  PROJECT_EXPENSES = 'PROJECT_EXPENSES',
  EVENT_EXPENSES = 'EVENT_EXPENSES',
  ADMINISTRATIVE_EXPENSES = 'ADMINISTRATIVE_EXPENSES',
  FUNDRAISING_EXPENSES = 'FUNDRAISING_EXPENSES',
  SALARIES_ADMIN = 'SALARIES_ADMIN',
  OFFICE_EXPENSES = 'OFFICE_EXPENSES',
  OTHER_EXPENSES = 'OTHER_EXPENSES',
  
  // ===== OPERATIONAL ACCOUNTS (Legacy/Current) =====
  PRINCIPAL = 'PRINCIPAL',           // Main organizational account (maps to UNRESTRICTED_FUNDS or DONATION_INCOME)
  DONATION = 'DONATION',             // Cashier account (maps to BANK_ACCOUNT or CASH_ON_HAND)
  PUBLIC_DONATION = 'PUBLIC_DONATION', // Public collection account (maps to BANK_ACCOUNT)
  WALLET = 'WALLET',                 // Individual wallet (personal account)
}
```

## Account Classification

### By Accounting Nature:
- **ASSET**: CASH_ON_HAND, BANK_ACCOUNT, RECEIVABLES, INVESTMENTS
- **LIABILITY**: PAYABLES, LOANS_PAYABLE
- **EQUITY**: UNRESTRICTED_FUNDS, RESTRICTED_FUNDS, RESERVES
- **REVENUE**: DONATION_INCOME, GRANT_INCOME, SERVICE_REVENUE
- **EXPENSE**: PROGRAM_EXPENSES, ADMINISTRATIVE_EXPENSES, FUNDRAISING_EXPENSES

### By Ownership/Management:
- **ORGANIZATIONAL** (No accountHolder): All income, expense, equity accounts
- **OPERATIONAL** (Has accountHolder): CASH_ON_HAND, BANK_ACCOUNT, PETTY_CASH (managed by staff)
- **INDIVIDUAL** (Has accountHolder): WALLET (personal accounts)

## Donation Flow Example

```
Donor pays ₹1000
  ↓
1. BANK_ACCOUNT (DONATION type - Cashier's account)
   → CREDITED ₹1000 (cash received)
   
2. DONATION_INCOME (or PRINCIPAL for now)
   → DEBITED ₹1000 (income recorded)
```

## Expense Flow Example

```
Expense of ₹500 for program
  ↓
1. PROGRAM_EXPENSES
   → DEBITED ₹500 (expense recorded)
   
2. BANK_ACCOUNT (or CASH_ON_HAND)
   → CREDITED ₹500 (cash paid out)
```

## Migration Strategy

1. **Phase 1**: Keep current types (PRINCIPAL, DONATION, PUBLIC_DONATION, WALLET) for backward compatibility
2. **Phase 2**: Add new account types gradually
3. **Phase 3**: Map old accounts to new types:
   - PRINCIPAL → DONATION_INCOME or UNRESTRICTED_FUNDS
   - DONATION → BANK_ACCOUNT (with accountHolder)
   - PUBLIC_DONATION → BANK_ACCOUNT (with accountHolder)
   - WALLET → WALLET (unchanged)

## Recommendations

1. **Start Simple**: Begin with essential accounts:
   - DONATION_INCOME (replaces PRINCIPAL for income)
   - BANK_ACCOUNT (replaces DONATION/PUBLIC_DONATION)
   - PROGRAM_EXPENSES
   - ADMINISTRATIVE_EXPENSES

2. **Separate Physical from Logical**: 
   - Create BankAccount entity for physical bank details
   - Link Account to BankAccount when needed

3. **Account Holder Rules**:
   - Asset accounts (CASH, BANK): Require accountHolder (who manages it)
   - Income/Expense accounts: No accountHolder (organizational)
   - Equity accounts: No accountHolder (organizational)

4. **Reporting**: Group accounts by category for financial reports:
   - Balance Sheet: Assets, Liabilities, Net Assets
   - Income Statement: Revenue, Expenses
