# Enhanced Error Handling and Retry Mechanisms

## Overview

The job processing module now includes comprehensive error handling and retry mechanisms with:
- **Typed error classes** for better error categorization
- **Advanced retry strategies** (exponential, linear, fibonacci, fixed)
- **Configurable retry logic** with jitter and backoff
- **Timeout support** for long-running jobs
- **Error tracking and monitoring**
- **Callback hooks** for retry and failure events

---

## Error Classes

### Base Error Class: `JobError`

All job errors extend from `JobError`, which provides:
- `isRetryable`: Whether the error should trigger a retry
- `errorCode`: Unique error code for categorization
- `context`: Additional error context

### Error Types

#### 1. **TransientJobError** (Retryable)
Temporary errors that should be retried.
```typescript
throw new TransientJobError('Temporary service unavailable', { 
  service: 'payment-api' 
});
```

#### 2. **PermanentJobError** (Not Retryable)
Permanent errors that won't be fixed by retrying.
```typescript
throw new PermanentJobError('Invalid configuration', { 
  config: 'missing-api-key' 
});
```

#### 3. **NetworkJobError** (Retryable)
Network-related errors.
```typescript
throw new NetworkJobError('Connection refused', { 
  host: 'api.example.com' 
});
```

#### 4. **DatabaseJobError** (Retryable)
Database-related errors.
```typescript
throw new DatabaseJobError('Query timeout', { 
  query: 'SELECT * FROM users' 
});
```

#### 5. **ValidationJobError** (Not Retryable)
Data validation errors.
```typescript
throw new ValidationJobError('Invalid email format', { 
  email: 'invalid@' 
});
```

#### 6. **ExternalServiceJobError** (Retryable)
External service errors.
```typescript
throw new ExternalServiceJobError('API rate limit exceeded', { 
  service: 'stripe' 
});
```

#### 7. **RateLimitJobError** (Retryable with delay)
Rate limiting errors with optional retry-after.
```typescript
throw new RateLimitJobError('Rate limit exceeded', 60000, { 
  limit: 100,
  window: '1 minute'
});
```

#### 8. **TimeoutJobError** (Retryable)
Timeout errors.
```typescript
throw new TimeoutJobError('Operation timed out', { 
  timeout: 30000 
});
```

#### 9. **BusinessLogicJobError** (Not Retryable)
Business logic errors.
```typescript
throw new BusinessLogicJobError('Insufficient balance', { 
  balance: 100,
  required: 500
});
```

#### 10. **ResourceNotFoundJobError** (Not Retryable)
Resource not found errors.
```typescript
throw new ResourceNotFoundJobError('User not found', { 
  userId: '123' 
});
```

#### 11. **InsufficientResourcesJobError** (Retryable)
Insufficient resources errors.
```typescript
throw new InsufficientResourcesJobError('Out of memory', { 
  available: '100MB',
  required: '500MB'
});
```

---

## Retry Strategies

### Available Strategies

1. **Exponential Backoff** (Default)
   - Delay doubles with each retry
   - Formula: `baseDelay * (2 ^ attemptNumber)`
   - Example: 2s, 4s, 8s, 16s

2. **Linear Backoff**
   - Delay increases linearly
   - Formula: `baseDelay * attemptNumber`
   - Example: 2s, 4s, 6s, 8s

3. **Fixed Delay**
   - Same delay for all retries
   - Formula: `baseDelay`
   - Example: 2s, 2s, 2s, 2s

4. **Fibonacci Backoff**
   - Delay follows fibonacci sequence
   - Formula: `baseDelay * fibonacci(attemptNumber)`
   - Example: 2s, 4s, 6s, 10s

### Predefined Retry Configs

```typescript
// Default config
{
  strategy: RetryStrategy.EXPONENTIAL,
  maxAttempts: 3,
  baseDelay: 2000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  jitter: true,
}

// Critical jobs (more retries)
{
  strategy: RetryStrategy.EXPONENTIAL,
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 120000,
  backoffMultiplier: 2,
  jitter: true,
}

// Background jobs (longer delays)
{
  strategy: RetryStrategy.EXPONENTIAL,
  maxAttempts: 3,
  baseDelay: 5000,
  maxDelay: 300000,
  backoffMultiplier: 3,
  jitter: true,
}

// Real-time jobs (quick retries)
{
  strategy: RetryStrategy.FIXED,
  maxAttempts: 2,
  baseDelay: 500,
  maxDelay: 2000,
  jitter: false,
}

// External API calls
{
  strategy: RetryStrategy.EXPONENTIAL,
  maxAttempts: 4,
  baseDelay: 3000,
  maxDelay: 60000,
  backoffMultiplier: 2,
  jitter: true,
}
```

---

## Usage Examples

### Basic Error Handling

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ProcessJob, JobName } from '../decorators/process-job.decorator';
import { Job, JobResult } from '../interfaces/job.interface';
import { NetworkJobError, ValidationJobError } from '../errors/job-errors';

@Injectable()
export class EmailJobProcessor {
  private readonly logger = new Logger(EmailJobProcessor.name);

  @ProcessJob({
    name: JobName.SEND_ONBOARDING_EMAIL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async sendEmail(job: Job<{ email: string; userId: string }>): Promise<JobResult> {
    try {
      // Validate input
      if (!this.isValidEmail(job.data.email)) {
        // This won't be retried
        throw new ValidationJobError('Invalid email format', {
          email: job.data.email,
        });
      }

      // Send email
      await this.emailService.send(job.data.email);

      return {
        success: true,
        data: { sent: true },
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        // This will be retried
        throw new NetworkJobError('Email service unavailable', {
          service: 'smtp.example.com',
        });
      }
      throw error;
    }
  }
}
```

### Advanced Configuration with Callbacks

```typescript
@ProcessJob({
  name: JobName.UPDATE_USER_ROLE,
  attempts: 5,
  retryStrategy: RetryStrategy.EXPONENTIAL,
  retryConfig: 'critical', // Use predefined critical config
  maxRetryDelay: 120000, // Cap at 2 minutes
  retryJitter: true,
  timeout: 30000, // 30 second timeout
  priority: JobPriority.HIGH,
  
  // Callback when retry happens
  onRetry: async (attemptNumber, error) => {
    console.log(`Retry attempt ${attemptNumber}: ${error.message}`);
    // Could send notification, log to external service, etc.
  },
  
  // Callback when job finally fails
  onFailed: async (error, attemptsMade) => {
    console.error(`Job failed after ${attemptsMade} attempts: ${error.message}`);
    // Send alert, create incident ticket, etc.
  },
  
  // Only retry specific errors
  retryableErrors: ['NETWORK_ERROR', 'DATABASE_ERROR', 'TIMEOUT_ERROR'],
  
  // Never retry these errors
  nonRetryableErrors: ['VALIDATION_ERROR', 'BUSINESS_LOGIC_ERROR'],
})
async updateUserRole(job: Job<{ userId: string; role: string }>): Promise<JobResult> {
  // Your job logic here
}
```

### Using Timeout

```typescript
@ProcessJob({
  name: JobName.TASK_AUTOMATIC,
  attempts: 3,
  timeout: 60000, // 60 second timeout
  backoff: {
    type: 'exponential',
    delay: 5000,
  },
})
async processLongRunningTask(job: Job): Promise<JobResult> {
  // If this takes longer than 60 seconds, it will timeout
  // and be retried (if attempts remain)
  await this.longRunningOperation();
  
  return { success: true };
}
```

### Custom Retry Logic

```typescript
import { RetryStrategyManager } from '../strategies/retry-strategy.manager';

@Injectable()
export class CustomJobProcessor {
  constructor(private retryManager: RetryStrategyManager) {}

  @ProcessJob({
    name: JobName.CUSTOM_JOB,
    attempts: 4,
    retryStrategy: RetryStrategy.FIBONACCI,
    retryJitter: true,
  })
  async processCustomJob(job: Job): Promise<JobResult> {
    try {
      // Your logic
      await this.doSomething();
      return { success: true };
    } catch (error) {
      // Categorize error for better retry logic
      if (error.statusCode === 429) {
        throw new RateLimitJobError(
          'Rate limit exceeded',
          60000, // Retry after 60 seconds
          { endpoint: '/api/resource' }
        );
      }
      throw error;
    }
  }
}
```

---

## Error Monitoring

### Get Error Statistics

```typescript
import { JobErrorHandler } from '../services/job-error-handler.service';

@Injectable()
export class MonitoringService {
  constructor(private errorHandler: JobErrorHandler) {}

  async getErrorReport() {
    const report = this.errorHandler.createErrorReport();
    
    console.log('Total errors:', report.totalErrors);
    console.log('Errors by type:', report.errorsByType);
    console.log('Recent errors:', report.recentErrors);
    
    return report;
  }
}
```

### Error Report Structure

```typescript
{
  totalErrors: 42,
  errorsByType: {
    'NetworkJobError': 15,
    'DatabaseJobError': 10,
    'ValidationJobError': 8,
    'TimeoutJobError': 9
  },
  recentErrors: [
    {
      key: 'send-email:NETWORK_ERROR',
      count: 5,
      lastOccurrence: '2025-12-07T12:00:00Z',
      errorType: 'NetworkJobError'
    },
    // ... more errors
  ]
}
```

---

## Best Practices

### 1. Use Specific Error Types
```typescript
// ❌ Bad
throw new Error('Something went wrong');

// ✅ Good
throw new NetworkJobError('Connection timeout', { 
  host: 'api.example.com',
  timeout: 30000 
});
```

### 2. Provide Context
```typescript
// ❌ Bad
throw new ValidationJobError('Invalid data');

// ✅ Good
throw new ValidationJobError('Invalid email format', {
  email: job.data.email,
  userId: job.data.userId,
  validationRule: 'RFC5322'
});
```

### 3. Choose Appropriate Retry Strategy
```typescript
// Real-time operations: Fixed, few retries
@ProcessJob({
  name: JobName.REALTIME_NOTIFICATION,
  attempts: 2,
  backoff: { type: 'fixed', delay: 500 },
})

// Background tasks: Exponential, more retries
@ProcessJob({
  name: JobName.DATA_SYNC,
  attempts: 5,
  backoff: { type: 'exponential', delay: 5000 },
  maxRetryDelay: 300000, // 5 minutes max
})
```

### 4. Use Timeouts for Long Operations
```typescript
@ProcessJob({
  name: JobName.EXTERNAL_API_CALL,
  timeout: 30000, // Prevent hanging
  attempts: 3,
})
```

### 5. Implement Callbacks for Critical Jobs
```typescript
@ProcessJob({
  name: JobName.PAYMENT_PROCESSING,
  attempts: 5,
  onRetry: async (attempt, error) => {
    await notificationService.sendAlert({
      type: 'payment_retry',
      attempt,
      error: error.message,
    });
  },
  onFailed: async (error, attempts) => {
    await incidentService.createTicket({
      severity: 'critical',
      title: 'Payment processing failed',
      description: `Failed after ${attempts} attempts: ${error.message}`,
    });
  },
})
```

---

## Migration Guide

### Updating Existing Job Processors

**Before:**
```typescript
@ProcessJob({
  name: JobName.SEND_EMAIL,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
})
async sendEmail(job: Job): Promise<JobResult> {
  try {
    await this.emailService.send(job.data);
    return { success: true };
  } catch (error) {
    return { success: false, error: { message: error.message } };
  }
}
```

**After:**
```typescript
@ProcessJob({
  name: JobName.SEND_EMAIL,
  attempts: 3,
  retryStrategy: RetryStrategy.EXPONENTIAL,
  retryJitter: true,
  timeout: 30000,
  onRetry: async (attempt, error) => {
    this.logger.warn(`Email send retry ${attempt}: ${error.message}`);
  },
})
async sendEmail(job: Job): Promise<JobResult> {
  try {
    await this.emailService.send(job.data);
    return { success: true };
  } catch (error) {
    // Throw specific error types for better retry logic
    if (error.code === 'ECONNREFUSED') {
      throw new NetworkJobError('Email service unavailable', {
        service: 'smtp.example.com',
      });
    }
    throw error;
  }
}
```

---

## Testing

### Testing Error Handling

```typescript
import { Test } from '@nestjs/testing';
import { NetworkJobError, ValidationJobError } from '../errors/job-errors';

describe('EmailJobProcessor', () => {
  it('should throw ValidationJobError for invalid email', async () => {
    const job = { data: { email: 'invalid' } };
    
    await expect(processor.sendEmail(job))
      .rejects
      .toThrow(ValidationJobError);
  });

  it('should throw NetworkJobError on connection failure', async () => {
    emailService.send.mockRejectedValue(new Error('ECONNREFUSED'));
    
    const job = { data: { email: 'test@example.com' } };
    
    await expect(processor.sendEmail(job))
      .rejects
      .toThrow(NetworkJobError);
  });
});
```

---

## Summary

The enhanced error handling and retry mechanisms provide:

✅ **Better error categorization** with typed error classes  
✅ **Flexible retry strategies** (exponential, linear, fibonacci, fixed)  
✅ **Configurable retry logic** with jitter and backoff  
✅ **Timeout support** to prevent hanging jobs  
✅ **Error tracking and monitoring** for better observability  
✅ **Callback hooks** for custom retry and failure handling  
✅ **Automatic error detection** with smart retry decisions  

This makes your job processing more reliable, observable, and maintainable!
