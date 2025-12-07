# Error Handling & Retry - Quick Reference

## 🎯 Quick Start

### 1. Import Error Classes
```typescript
import {
  NetworkJobError,
  ValidationJobError,
  DatabaseJobError,
  ExternalServiceJobError,
  RateLimitJobError,
  TimeoutJobError,
} from '../errors/job-errors';
```

### 2. Use in Job Processor
```typescript
@ProcessJob({
  name: JobName.SEND_EMAIL,
  attempts: 3,
  retryStrategy: RetryStrategy.EXPONENTIAL,
  timeout: 30000,
  onRetry: async (attempt, error) => {
    console.log(`Retry ${attempt}: ${error.message}`);
  },
})
async sendEmail(job: Job): Promise<JobResult> {
  try {
    await this.emailService.send(job.data);
    return { success: true };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new NetworkJobError('Service unavailable');
    }
    throw error;
  }
}
```

---

## 📋 Error Types Cheat Sheet

| Error Type | Retryable? | Use Case |
|-----------|-----------|----------|
| `TransientJobError` | ✅ Yes | Temporary failures |
| `PermanentJobError` | ❌ No | Permanent failures |
| `NetworkJobError` | ✅ Yes | Connection issues |
| `DatabaseJobError` | ✅ Yes | DB timeouts, locks |
| `ValidationJobError` | ❌ No | Invalid data |
| `ExternalServiceJobError` | ✅ Yes | API failures |
| `RateLimitJobError` | ✅ Yes | Rate limits |
| `TimeoutJobError` | ✅ Yes | Operation timeouts |
| `BusinessLogicJobError` | ❌ No | Business rules |
| `ResourceNotFoundJobError` | ❌ No | Missing resources |
| `InsufficientResourcesJobError` | ✅ Yes | Out of memory |

---

## 🔄 Retry Strategies

### Exponential (Default)
```typescript
@ProcessJob({
  retryStrategy: RetryStrategy.EXPONENTIAL,
  attempts: 4,
})
// Delays: 2s, 4s, 8s, 16s
```

### Linear
```typescript
@ProcessJob({
  retryStrategy: RetryStrategy.LINEAR,
  attempts: 4,
})
// Delays: 2s, 4s, 6s, 8s
```

### Fixed
```typescript
@ProcessJob({
  retryStrategy: RetryStrategy.FIXED,
  attempts: 4,
})
// Delays: 2s, 2s, 2s, 2s
```

### Fibonacci
```typescript
@ProcessJob({
  retryStrategy: RetryStrategy.FIBONACCI,
  attempts: 4,
})
// Delays: 2s, 4s, 6s, 10s
```

---

## ⚙️ Configuration Options

### Basic
```typescript
@ProcessJob({
  name: JobName.MY_JOB,
  attempts: 3,                    // Max retry attempts
  backoff: {
    type: 'exponential',
    delay: 2000,                  // Base delay in ms
  },
})
```

### Advanced
```typescript
@ProcessJob({
  name: JobName.MY_JOB,
  attempts: 5,
  retryStrategy: RetryStrategy.EXPONENTIAL,
  retryConfig: 'critical',        // Use predefined config
  maxRetryDelay: 120000,          // Cap delay at 2 minutes
  retryJitter: true,              // Add randomness
  timeout: 60000,                 // Job timeout: 1 minute
  priority: JobPriority.HIGH,
  
  // Callbacks
  onRetry: async (attempt, error) => {
    console.log(`Retry ${attempt}`);
  },
  onFailed: async (error, attempts) => {
    console.error(`Failed after ${attempts}`);
  },
  
  // Error filtering
  retryableErrors: ['NETWORK_ERROR', 'DATABASE_ERROR'],
  nonRetryableErrors: ['VALIDATION_ERROR'],
})
```

---

## 🎨 Common Patterns

### Pattern 1: Email Sending
```typescript
@ProcessJob({
  name: JobName.SEND_EMAIL,
  attempts: 3,
  retryStrategy: RetryStrategy.EXPONENTIAL,
  timeout: 30000,
})
async sendEmail(job: Job): Promise<JobResult> {
  try {
    if (!isValidEmail(job.data.email)) {
      throw new ValidationJobError('Invalid email');
    }
    await emailService.send(job.data);
    return { success: true };
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      throw new NetworkJobError('SMTP unavailable');
    }
    throw error;
  }
}
```

### Pattern 2: Database Operation
```typescript
@ProcessJob({
  name: JobName.UPDATE_USER,
  attempts: 5,
  retryConfig: 'critical',
  timeout: 60000,
})
async updateUser(job: Job): Promise<JobResult> {
  try {
    await db.user.update(job.data);
    return { success: true };
  } catch (error) {
    if (error.code === 'P2025') {
      throw new ValidationJobError('User not found');
    }
    if (error.name === 'PrismaClientKnownRequestError') {
      throw new DatabaseJobError('DB error');
    }
    throw error;
  }
}
```

### Pattern 3: External API Call
```typescript
@ProcessJob({
  name: JobName.CALL_API,
  attempts: 4,
  retryStrategy: RetryStrategy.FIBONACCI,
  timeout: 45000,
})
async callAPI(job: Job): Promise<JobResult> {
  try {
    const response = await api.call(job.data);
    return { success: true, data: response };
  } catch (error) {
    if (error.response?.status === 429) {
      throw new RateLimitJobError('Rate limit', 60000);
    }
    if (error.response?.status >= 500) {
      throw new ExternalServiceJobError('Server error');
    }
    if (error.code === 'ECONNABORTED') {
      throw new TimeoutJobError('API timeout');
    }
    throw error;
  }
}
```

---

## 🚨 Error Handling Best Practices

### ✅ DO
```typescript
// Specific error types
throw new NetworkJobError('Connection failed', { 
  host: 'api.example.com' 
});

// Provide context
throw new ValidationJobError('Invalid email', {
  email: job.data.email,
  userId: job.data.userId,
});

// Use timeouts
@ProcessJob({
  timeout: 30000,
  attempts: 3,
})

// Implement callbacks
@ProcessJob({
  onRetry: async (attempt, error) => {
    await notifyTeam(error);
  },
})
```

### ❌ DON'T
```typescript
// Generic errors
throw new Error('Something went wrong');

// No context
throw new ValidationJobError('Invalid');

// No timeout for long operations
@ProcessJob({
  // Missing timeout!
})

// Ignore errors
try {
  await operation();
} catch (error) {
  // Don't swallow errors!
}
```

---

## 📊 Monitoring

### Get Error Statistics
```typescript
import { JobErrorHandler } from '../services/job-error-handler.service';

constructor(private errorHandler: JobErrorHandler) {}

getStats() {
  const report = this.errorHandler.createErrorReport();
  console.log('Total errors:', report.totalErrors);
  console.log('By type:', report.errorsByType);
  console.log('Recent:', report.recentErrors);
}
```

### Error Report Example
```json
{
  "totalErrors": 42,
  "errorsByType": {
    "NetworkJobError": 15,
    "DatabaseJobError": 10,
    "ValidationJobError": 8
  },
  "recentErrors": [
    {
      "key": "send-email:NETWORK_ERROR",
      "count": 5,
      "lastOccurrence": "2025-12-07T12:00:00Z",
      "errorType": "NetworkJobError"
    }
  ]
}
```

---

## 🔧 Predefined Retry Configs

### Use Predefined Configs
```typescript
// Default
@ProcessJob({
  retryConfig: 'default',
  // 3 attempts, 2s base, exponential
})

// Critical (more retries)
@ProcessJob({
  retryConfig: 'critical',
  // 5 attempts, 1s base, exponential
})

// Background (longer delays)
@ProcessJob({
  retryConfig: 'background',
  // 3 attempts, 5s base, exponential
})

// Real-time (quick retries)
@ProcessJob({
  retryConfig: 'realtime',
  // 2 attempts, 500ms base, fixed
})

// External API
@ProcessJob({
  retryConfig: 'external_api',
  // 4 attempts, 3s base, exponential
})
```

---

## 🎯 Priority Levels

```typescript
enum JobPriority {
  CRITICAL = 1,    // Highest priority
  HIGH = 2,
  NORMAL = 3,      // Default
  LOW = 4,
  BACKGROUND = 5,  // Lowest priority
}

@ProcessJob({
  priority: JobPriority.CRITICAL,
})
```

---

## 📝 Migration Checklist

- [ ] Import error classes
- [ ] Replace generic errors with specific types
- [ ] Add timeout for long operations
- [ ] Configure retry strategy
- [ ] Add onRetry callback for monitoring
- [ ] Add onFailed callback for alerts
- [ ] Test error scenarios
- [ ] Monitor error statistics

---

## 🆘 Common Issues

### Issue: Job not retrying
**Solution:** Check if error is marked as retryable
```typescript
// ❌ Won't retry
throw new ValidationJobError('Invalid');

// ✅ Will retry
throw new NetworkJobError('Connection failed');
```

### Issue: Too many retries
**Solution:** Reduce attempts or use non-retryable error
```typescript
@ProcessJob({
  attempts: 2, // Reduce from 5
})
```

### Issue: Job timing out
**Solution:** Increase timeout or optimize operation
```typescript
@ProcessJob({
  timeout: 120000, // Increase to 2 minutes
})
```

---

## 📚 See Also

- [ERROR_HANDLING_GUIDE.md](./ERROR_HANDLING_GUIDE.md) - Full documentation
- [example-job-processor.ts](./examples/example-job-processor.ts) - Complete examples
- [README.md](./README.md) - Module overview
