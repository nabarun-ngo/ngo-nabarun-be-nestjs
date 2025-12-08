# Finance Migration Quick Reference

## Quick Start

```bash
# 1. Set environment variables in .env
MONGODB_URL=mongodb://localhost:27017
MONGO_DB=nabarun_stage
POSTGRES_URL=postgresql://user:pass@localhost:5432/nabarun

# 2. Run user migration first (if not done)
node scripts/migrate-users.js

# 3. Run finance migration
node scripts/migrate-finance.js

# 4. Verify migration (optional)
node scripts/migrate-finance.js --verify
```

## MongoDB Collections → PostgreSQL Tables

| MongoDB Collection | PostgreSQL Table | Records |
|-------------------|------------------|---------|
| `accounts` | `accounts` | Account details with bank/UPI info |
| `contributions` | `donations` | Donation records (member & guest) |
| `transactions` | `transactions` | Financial transactions |

## Key Field Transformations

### Accounts
- `currentBalance` (Double) → `balance` (Decimal)
- Bank fields → `bankDetail` (JSON)
- UPI fields → `upiDetail` (JSON)

### Donations
- `isGuest` determines donor field mapping
- Guest: `guestFullNameOrOrgName` → `donorName`
- Member: `userId` → `donorId` (FK to users)
- `customFields` → `additionalFields` (JSON)

### Transactions
- `transactionAmt` → `amount`
- `fromAccount`/`toAccount` → account FKs
- Validates account existence before creating

## Status Mappings

### Account Status
- ACTIVE, INACTIVE, BLOCKED

### Donation Status
- RAISED, PAID, PENDING, PAYMENT_FAILED, PAY_LATER, CANCELLED, UPDATE_MISTAKE

### Transaction Status
- PENDING, COMPLETED, FAILED, REVERSED

## Common Commands

```bash
# Full migration with verification
node scripts/migrate-finance.js

# Verification only
node scripts/migrate-finance.js --verify

# Check MongoDB counts
mongosh "mongodb://localhost:27017/nabarun_stage" --eval "
  db.accounts.countDocuments();
  db.contributions.countDocuments();
  db.transactions.countDocuments();
"

# Check PostgreSQL counts
psql -d nabarun -c "
  SELECT 'accounts' as table, COUNT(*) FROM accounts
  UNION ALL
  SELECT 'donations', COUNT(*) FROM donations
  UNION ALL
  SELECT 'transactions', COUNT(*) FROM transactions;
"
```

## Error Handling

| Error Type | Handling |
|-----------|----------|
| Missing donor user | Set `donorId = null`, `isGuest = true` |
| Missing account | Set account FK to `null` or skip transaction |
| Duplicate ID | Skip (already migrated) |
| Invalid date | Set to `null` or current date |

## Validation Checks

✅ Donor user exists → Use `donorId`  
❌ Donor user missing → Use guest fields  

✅ Account exists → Create transaction  
❌ Account missing → Skip transaction  

✅ Confirmer exists → Set `confirmedById`  
❌ Confirmer missing → Set to `null`  

## Migration Order

1. **Accounts** (no dependencies)
2. **Donations** (depends on: users, accounts)
3. **Transactions** (depends on: accounts)

## Batch Size

- Default: 100 records per batch
- Progress logged every 10 records
- Adjust `BATCH_SIZE` constant if needed

## Data Types

| MongoDB | PostgreSQL |
|---------|-----------|
| ObjectId | UUID (string) |
| Double | Decimal(15,2) |
| Date | DateTime |
| String | VarChar/Text |
| Object | JSON (stringified) |

## Verification Queries

```sql
-- Check donation-account relationships
SELECT d.id, d.donor_name, a.name as account_name
FROM donations d
LEFT JOIN accounts a ON d.paid_to_account_id = a.id
WHERE d.paid_to_account_id IS NOT NULL
LIMIT 10;

-- Check transaction validity
SELECT t.id, t.description, 
       fa.name as from_account, 
       ta.name as to_account
FROM transactions t
JOIN accounts fa ON t.from_account_id = fa.id
JOIN accounts ta ON t.to_account_id = ta.id
LIMIT 10;

-- Check guest vs member donations
SELECT 
  is_guest,
  COUNT(*) as count,
  SUM(amount) as total_amount
FROM donations
GROUP BY is_guest;
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Check MongoDB/PostgreSQL URLs in .env |
| Foreign key error | Run user migration first |
| Out of memory | Reduce BATCH_SIZE |
| Slow migration | Increase BATCH_SIZE, check indexes |
| Data mismatch | Run verification, check field mappings |

## Rollback

```sql
-- WARNING: This deletes all finance data!
TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE donations CASCADE;
TRUNCATE TABLE accounts CASCADE;
```

## Performance Tips

- Run during off-peak hours
- Ensure database indexes exist
- Monitor memory usage
- Use `--verify` to check without re-migrating
- Keep MongoDB and PostgreSQL on same network for speed
