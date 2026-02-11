## Automated Auditing (Zero-Touch Approach)

We use a **Prisma Extension** to automatically capture audit logs for financial models without requiring any changes to your business logic or Use Cases.

### How it works:
1. **Context Capture**: A middleware and the AuthGuard automatically populate the current User ID, IP address, and User Agent into a secure `TraceContext` (using Node.js `AsyncLocalStorage`).
2. **Database Interception**: Our custom Prisma Extension (`prismaAuditExtension`) listens for all `create`, `update`, `upsert`, and `delete` operations on financial models (`Account`, `Donation`, `Expense`, `Transaction`, `Earning`).
3. **Delta Logging**: For updates, the extension logs exactly what fields were changed. This satisfies the requirement to avoid extra database lookups. The "previous version" is simply the state recorded in the previous audit log entry.

### Why this is better:
- **Zero Maintenance**: You don't need to inject `AuditService` or call `.log()` in new Use Cases. It works for all models automatically.
- **Performance**: It uses the data already present in the Prisma operation arguments, avoiding additional "SELECT" queries.
- **Reliability**: Even if an update happens in a background cron job or a shared utility, it will be caught by the database layer.

## Manual Overrides
If you ever need to add manual remarks or force a specific audit entry, you can still use the `AuditService.log()` method directly, but for 99% of use cases, the automation is sufficient.
