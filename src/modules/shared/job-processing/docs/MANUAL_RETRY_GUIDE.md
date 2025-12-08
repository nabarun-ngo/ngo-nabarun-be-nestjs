# Manual Job Retry - Quick Guide

## 🎯 New Endpoints Added

### 1. Retry a Single Failed Job

**Endpoint:** `POST /jobs/retry/:jobId`

**Description:** Manually retry a specific failed job

**Usage:**
```bash
curl -X POST http://localhost:3000/jobs/retry/123
```

**Response:**
```json
{
  "message": "Job '123' has been queued for retry",
  "jobId": "123"
}
```

**Error Responses:**
- `404` - Job not found
- `400` - Job is not in failed state

---

### 2. Retry All Failed Jobs

**Endpoint:** `POST /jobs/retry-all-failed`

**Description:** Retry all failed jobs in the queue

**Usage:**
```bash
curl -X POST http://localhost:3000/jobs/retry-all-failed
```

**Response:**
```json
{
  "message": "Retry operation complete",
  "retriedCount": 5,
  "failedCount": 0,
  "total": 5
}
```

---

## 📋 Complete Workflow

### Step 1: Check Failed Jobs

```bash
# Get list of failed jobs
GET /jobs/failed?limit=50
```

**Response:**
```json
[
  {
    "id": "123",
    "name": "update-user-role",
    "data": { "userId": "abc" },
    "error": "Job failed",
    "failedAt": 1234567890,
    "attempts": 3,
    "maxAttempts": 3
  }
]
```

### Step 2: Get Job Details (Optional)

```bash
# Get detailed info about a specific job
GET /jobs/details/123
```

### Step 3: Retry the Job

```bash
# Option A: Retry single job
POST /jobs/retry/123

# Option B: Retry all failed jobs
POST /jobs/retry-all-failed
```

### Step 4: Monitor the Retry

```bash
# Check job metrics
GET /jobs/metrics

# Check job details again
GET /jobs/details/123
```

---

## 🔍 How It Works

### Single Job Retry

1. **Validates** job exists
2. **Checks** job is in "failed" state
3. **Queues** job for retry
4. **Processes** job with original data and options

### Bulk Retry

1. **Fetches** all failed jobs
2. **Iterates** through each job
3. **Retries** each job individually
4. **Reports** success/failure count

---

## ⚠️ Important Notes

### Retry Behavior

- **Resets attempt counter** - Job starts fresh with attempt 1
- **Uses original data** - Same job data as original
- **Uses original options** - Same retry/backoff configuration
- **Immediate execution** - Job is queued immediately

### Limitations

- Can only retry jobs in "failed" state
- Cannot retry jobs that have been removed
- Cannot retry jobs in "completed", "active", or "waiting" states

---

## 💡 Use Cases

### When to Use Single Job Retry

- ✅ Specific job failed due to temporary issue
- ✅ You fixed the underlying problem
- ✅ You want to test if fix works
- ✅ Job contains important data that must succeed

### When to Use Bulk Retry

- ✅ Service was down temporarily
- ✅ Database connection was lost
- ✅ External API was unavailable
- ✅ You deployed a fix for all failed jobs

---

## 🧪 Testing

### Test Single Retry

```bash
# 1. Get a failed job ID
curl http://localhost:3000/jobs/failed?limit=1

# 2. Retry it
curl -X POST http://localhost:3000/jobs/retry/YOUR_JOB_ID

# 3. Check if it succeeded
curl http://localhost:3000/jobs/details/YOUR_JOB_ID
```

### Test Bulk Retry

```bash
# 1. Check how many failed jobs exist
curl http://localhost:3000/jobs/metrics

# 2. Retry all
curl -X POST http://localhost:3000/jobs/retry-all-failed

# 3. Verify metrics updated
curl http://localhost:3000/jobs/metrics
```

---

## 📊 Monitoring

### Check Retry Success

```bash
# Before retry
GET /jobs/metrics
# Response: { failed: 10, completed: 100, ... }

# Retry all
POST /jobs/retry-all-failed

# After retry (wait a few seconds)
GET /jobs/metrics
# Response: { failed: 0, completed: 110, ... }
```

### Track Individual Job

```bash
# Get job state
GET /jobs/details/123

# Possible states:
# - "waiting" - Queued for processing
# - "active" - Currently processing
# - "completed" - Successfully completed
# - "failed" - Failed (can retry)
# - "delayed" - Scheduled for future
```

---

## 🎯 Best Practices

### 1. Investigate Before Retry

```bash
# Check why it failed
GET /jobs/details/123

# Look at error message
# Fix underlying issue
# Then retry
POST /jobs/retry/123
```

### 2. Retry in Batches

```bash
# Don't retry all at once if you have thousands
# Instead, retry in smaller batches

# Get failed jobs
GET /jobs/failed?limit=100

# Retry each individually
for jobId in failedJobs:
  POST /jobs/retry/{jobId}
```

### 3. Monitor After Retry

```bash
# Wait a few seconds
sleep 5

# Check if jobs succeeded
GET /jobs/metrics

# Check for new failures
GET /jobs/failed
```

---

## 🔧 Troubleshooting

### Job Not Found

**Error:** `Job 123 not found`

**Solutions:**
- Job may have been cleaned up (check TTL settings)
- Job ID might be incorrect
- Check if job exists: `GET /jobs/details/123`

### Job Not in Failed State

**Error:** `Job 123 is not in failed state. Current state: completed`

**Solutions:**
- Job already succeeded
- Job is currently processing
- Job is waiting in queue
- Only failed jobs can be retried

### Retry Keeps Failing

**Problem:** Job fails again after retry

**Solutions:**
1. Check error message: `GET /jobs/details/123`
2. Fix underlying issue (database, API, etc.)
3. Verify job data is correct
4. Check if service is running
5. Review job processor code

---

## 📝 API Summary

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/jobs/failed` | GET | List failed jobs |
| `/jobs/details/:jobId` | GET | Get job details |
| `/jobs/retry/:jobId` | POST | Retry single job |
| `/jobs/retry-all-failed` | POST | Retry all failed jobs |
| `/jobs/metrics` | GET | Get job metrics |

---

## ✅ Quick Commands

```bash
# List failed jobs
curl http://localhost:3000/jobs/failed

# Retry specific job
curl -X POST http://localhost:3000/jobs/retry/YOUR_JOB_ID

# Retry all failed jobs
curl -X POST http://localhost:3000/jobs/retry-all-failed

# Check metrics
curl http://localhost:3000/jobs/metrics
```

---

**You can now manually retry failed jobs!** 🎉
