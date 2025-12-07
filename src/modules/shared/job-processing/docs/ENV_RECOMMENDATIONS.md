# Recommended Environment Variables for Upstash Free Tier

## Current Settings (Too Aggressive)
```env
JOB_RETENTION_COMPLETED_DAYS=2
JOB_RETENTION_FAILED_DAYS=7
JOB_RETENTION_COMPLETED_COUNT=100
JOB_RETENTION_FAILED_COUNT=50
```

## Recommended Settings (Optimized for Free Tier)
```env
# Job Processing Configuration
JOB_RETENTION_COMPLETED_DAYS=1    # Keep completed jobs for 1 day (reduced from 2)
JOB_RETENTION_FAILED_DAYS=3       # Keep failed jobs for 3 days (reduced from 7)
JOB_RETENTION_COMPLETED_COUNT=50  # Keep last 50 completed jobs (reduced from 100)
JOB_RETENTION_FAILED_COUNT=25     # Keep last 25 failed jobs (reduced from 50)
```

## Why These Changes?

### Completed Jobs: 2 days → 1 day
- **Reasoning:** Completed jobs are successful, you rarely need to review them
- **Impact:** Reduces storage and cleanup overhead
- **Trade-off:** You lose historical data after 1 day instead of 2

### Failed Jobs: 7 days → 3 days
- **Reasoning:** 3 days is enough time to investigate and fix issues
- **Impact:** Reduces storage significantly
- **Trade-off:** You need to investigate failures within 3 days

### Completed Count: 100 → 50
- **Reasoning:** Combined with 1-day retention, 50 jobs is sufficient
- **Impact:** Faster cleanup operations
- **Trade-off:** Less historical data in Redis

### Failed Count: 50 → 25
- **Reasoning:** If you have more than 25 failures, you have bigger problems
- **Impact:** Reduces storage and cleanup overhead
- **Trade-off:** Only keeps 25 most recent failures

## Additional Optimizations (Optional)

### If You Need Even More Savings

```env
# Ultra-aggressive settings (use only if desperate)
JOB_RETENTION_COMPLETED_DAYS=0    # Delete completed jobs immediately
JOB_RETENTION_FAILED_DAYS=1       # Keep failed jobs for 1 day only
JOB_RETENTION_COMPLETED_COUNT=10  # Keep only last 10 completed jobs
JOB_RETENTION_FAILED_COUNT=10     # Keep only last 10 failed jobs
```

⚠️ **Warning:** These ultra-aggressive settings mean you'll have very little historical data for debugging.

## How to Apply

1. **Update your `.env` file** with the recommended settings
2. **Restart your application** to apply the changes
3. **Monitor Upstash dashboard** for 24-48 hours
4. **Adjust as needed** based on your actual usage patterns

## Monitoring Your Settings

After applying these changes, check:
- Are you staying under 500k commands/month?
- Do you have enough historical data for debugging?
- Are cleanup operations running smoothly?

If you're still over the limit, consider the ultra-aggressive settings or implement additional optimizations from `OPTIMIZATION_GUIDE.md`.
