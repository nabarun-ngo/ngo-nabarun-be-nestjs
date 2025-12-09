# Finance Module Migration Guide

This guide explains how to migrate finance data from MongoDB to PostgreSQL using the `migrate-finance.js` script.

## Overview

The migration script handles three main collections:
1. **Accounts** - Financial accounts with bank and UPI details
2. **Donations** - Contribution records from donors (both members and guests)
3. **Transactions** - Financial transactions between accounts

## Prerequisites

1. **Environment Variables**: Ensure the following are set in your `.env` file:
   ```env
   MONGODB_URL=mongodb://your-mongo-host:27017
   MONGO_DB=nabarun_stage
   POSTGRES_URL=postgresql://user:password@host:port/database
   ```

2. **Dependencies**: Make sure you have the required packages:
   ```bash
   npm install mongodb @prisma/client uuid
   ```

3. **User Migration**: Run the user migration first, as donations may reference user profiles:
   ```bash
   node scripts/migrate-users.js
   ```

## MongoDB Collections

The script expects the following MongoDB collections:

### 1. Accounts Collection (`accounts`)
Maps to PostgreSQL `accounts` table with fields:
- Account details (name, type, status, balance)
- Bank details (account holder, bank name, IFSC, etc.)
- UPI details (payee name, UPI ID, mobile number)

### 2. Donations Collection (`contributions`)
Maps to PostgreSQL `donations` table with fields:
- Donation details (amount, type, status)
- Donor information (name, email, phone)
- Payment details (method, transaction reference)
- Guest vs. member donations

### 3. Transactions Collection (`transactions`)
Maps to PostgreSQL `transactions` table with fields:
- Transaction details (amount, type, status)
- Account references (from/to accounts)
- Reference to source (donation, expense, etc.)

## Field Mappings

### Account Mapping
| MongoDB Field | PostgreSQL Field | Notes |
|--------------|------------------|-------|
| `_id` | `id` | Converted from ObjectId |
| `accountName` | `name` | Required |
| `accountType` | `type` | PRINCIPAL, GENERAL, DONATION, PUBLIC_DONATION |
| `accountStatus` | `status` | ACTIVE, INACTIVE, BLOCKED |
| `currentBalance` | `balance` | Converted from Double |
| `bankAccountHolderName` | `bankDetail` (JSON) | Stored in JSON object |
| `upiPayeeName` | `upiDetail` (JSON) | Stored in JSON object |
| `userId` | `accountHolderId` | Foreign key to user_profiles |

### Donation Mapping
| MongoDB Field | PostgreSQL Field | Notes |
|--------------|------------------|-------|
| `_id` | `id` | Converted from ObjectId |
| `type` | `type` | REGULAR, ONETIME |
| `status` | `status` | RAISED, PAID, PENDING, etc. |
| `amount` | `amount` | Converted from Double |
| `userId` | `donorId` | For member donations |
| `guestFullNameOrOrgName` | `donorName` | For guest donations |
| `guestEmailAddress` | `donorEmail` | For guest donations |
| `guestContactNumber` | `donorPhone` | For guest donations |
| `isGuest` | `isGuest` | Boolean flag |
| `raisedOn` | `raisedOn` | Date field |
| `paidOn` | `paidOn` | Date field |
| `accountId` | `paidToAccountId` | Foreign key to accounts |
| `paymentConfirmedBy` | `confirmedById` | Foreign key to user_profiles |

### Transaction Mapping
| MongoDB Field | PostgreSQL Field | Notes |
|--------------|------------------|-------|
| `_id` | `id` | Converted from ObjectId |
| `transactionType` | `type` | DONATION, EXPENSE, EARNING, TRANSFER |
| `status` | `status` | PENDING, COMPLETED, FAILED, REVERSED |
| `transactionAmt` | `amount` | Converted from Double |
| `fromAccount` | `fromAccountId` | Foreign key to accounts |
| `toAccount` | `toAccountId` | Foreign key to accounts |
| `transactionDate` | `transactionDate` | Date field |
| `transactionDescription` | `description` | Text field |

## Running the Migration

### Full Migration
To run the complete migration (accounts, donations, and transactions):

```bash
node scripts/migrate-finance.js
```

This will:
1. Migrate all accounts
2. Migrate all donations (with foreign key validation)
3. Migrate all transactions (with account validation)
4. Run verification checks
5. Display a summary report

### Verification Only
To verify an existing migration without re-running it:

```bash
node scripts/migrate-finance.js --verify
```

This will:
- Compare record counts between MongoDB and PostgreSQL
- Check sample records for data integrity
- Display verification results

## Migration Process

The script follows this order:

1. **Accounts First**: Migrated first as they are referenced by donations and transactions
2. **Donations Second**: Migrated with validation of donor and account references
3. **Transactions Last**: Migrated with validation of account references

### Batch Processing
- Records are processed in batches of 100 to optimize performance
- Progress is logged every 10 records
- Existing records are skipped to allow resuming failed migrations

### Error Handling
- Invalid foreign key references are handled gracefully
- Missing users/accounts result in null values or guest flags
- Errors are logged with details for troubleshooting
- Migration continues even if individual records fail

## Data Validation

The script performs the following validations:

### For Donations:
- Checks if `donorId` exists in `user_profiles`, sets to null if not found
- Checks if `paidToAccountId` exists in `accounts`, sets to null if not found
- Checks if `confirmedById` exists in `user_profiles`, sets to null if not found
- Automatically sets `isGuest = true` if donor user not found

### For Transactions:
- Validates both `fromAccountId` and `toAccountId` exist in `accounts`
- Skips transactions with missing account references
- Logs warnings for skipped transactions

## Output and Logging

The script provides detailed logging:

```
=== Migrating Accounts ===
Found 50 accounts to migrate
Progress: 10/50 (10 success, 0 failed)
Progress: 20/50 (20 success, 0 failed)
...
Accounts Migration Complete: 50 success, 0 failed

=== Migrating Donations ===
Found 500 donations to migrate
Progress: 10/500 (10 success, 0 failed)
...
Donations Migration Complete: 495 success, 5 failed

=== Overall Migration Summary ===
Accounts: 50 success, 0 failed
Donations: 495 success, 5 failed
Transactions: 200 success, 10 failed

Donation Errors:
  - John Doe (507f1f77bcf86cd799439011): Foreign key constraint failed
```

## Troubleshooting

### Common Issues

1. **Foreign Key Violations**
   - **Cause**: Referenced user or account doesn't exist
   - **Solution**: Run user migration first, or the script will handle it by setting fields to null

2. **Duplicate Key Errors**
   - **Cause**: Record already exists in PostgreSQL
   - **Solution**: Script automatically skips existing records

3. **Invalid Date Formats**
   - **Cause**: MongoDB date field in unexpected format
   - **Solution**: Script handles multiple date formats, logs errors for invalid dates

4. **Missing Required Fields**
   - **Cause**: MongoDB document missing required fields
   - **Solution**: Script provides defaults where possible, logs errors otherwise

### Debugging

To debug specific issues:

1. Check the error logs for specific record IDs
2. Query MongoDB for the problematic record:
   ```javascript
   db.contributions.findOne({ _id: ObjectId("507f1f77bcf86cd799439011") })
   ```
3. Check PostgreSQL for partial data:
   ```sql
   SELECT * FROM donations WHERE id = '507f1f77bcf86cd799439011';
   ```

## Post-Migration Verification

After migration, verify the data:

1. **Count Verification**:
   ```sql
   SELECT COUNT(*) FROM accounts;
   SELECT COUNT(*) FROM donations;
   SELECT COUNT(*) FROM transactions;
   ```

2. **Data Integrity**:
   ```sql
   -- Check for orphaned donations (invalid account references)
   SELECT COUNT(*) FROM donations 
   WHERE paid_to_account_id IS NOT NULL 
   AND paid_to_account_id NOT IN (SELECT id FROM accounts);

   -- Check for orphaned transactions
   SELECT COUNT(*) FROM transactions 
   WHERE from_account_id NOT IN (SELECT id FROM accounts)
   OR to_account_id NOT IN (SELECT id FROM accounts);
   ```

3. **Sample Data**:
   ```sql
   -- Check a few donations
   SELECT * FROM donations LIMIT 10;
   
   -- Check account balances
   SELECT name, balance, status FROM accounts;
   ```

## Rollback

If you need to rollback the migration:

```sql
-- Delete all migrated finance data
DELETE FROM transactions;
DELETE FROM donations;
DELETE FROM accounts;

-- Reset sequences if needed
ALTER SEQUENCE accounts_id_seq RESTART WITH 1;
ALTER SEQUENCE donations_id_seq RESTART WITH 1;
ALTER SEQUENCE transactions_id_seq RESTART WITH 1;
```

## Notes

- The script uses UUIDs for IDs, preserving MongoDB ObjectIds where possible
- All monetary amounts are stored as `Decimal(15,2)` for precision
- Dates are converted from MongoDB's `$date` format to JavaScript Date objects
- JSON fields (bankDetail, upiDetail, metadata) are stringified before storage
- The script is idempotent - you can run it multiple times safely

## Support

For issues or questions:
1. Check the error logs in the console output
2. Review the MongoDB schema vs PostgreSQL schema mappings
3. Verify environment variables are set correctly
4. Ensure all dependencies are installed
