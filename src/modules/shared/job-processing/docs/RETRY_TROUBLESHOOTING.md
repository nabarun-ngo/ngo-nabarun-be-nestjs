# Why Failed Jobs Are Not Retrying - Diagnosis & Fix

## 🔍 Problem Identified

**BullMQ requires you to THROW errors to trigger retries, not return error results.**

### Current Issue

Your job processor signature is:
```typescript
export type JobProcessor<T = any> = (job: Job<T>) => Promise<JobResult>;
```

This creates confusion because:
1. ❌ Returning `{ success: false, error: {...} }` = Job **succeeds** (no retry)
2. ✅ Throwing an error = Job **fails** (triggers retry)

---

## ✅ Correct Implementation

### Option 1: Throw Errors (Recommended)

```typescript
@ProcessJob({
  name: JobName.UPDATE_USER_ROLE,
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000,
  },
})
async updateUserRole(job: Job<{ userId: string; newRoles: Role[] }>) {
  // Just throw the error - BullMQ will handle retries
  throw new TransientJobError("Job failed");
  
  // Or for real implementation:
  try {
    await this.assignRoleUseCase.execute({
      userId: job.data.userId,
      newRoles: job.data.newRoles
    });
    // Success - return anything or nothing
    return { success: true };
  } catch (error) {
    // Throw to trigger retry
    throw new TransientJobError(error.message);
  }
}
```

### Option 2: Remove JobResult (Cleaner)

Change the processor signature to match BullMQ's expectations:

```typescript
// In job.interface.ts - CHANGE THIS:
export type JobProcessor<T = any> = (job: Job<T>) => Promise<JobResult>;

// TO THIS:
export type JobProcessor<T = any> = (job: Job<T>) => Promise<any>;
```

Then your jobs can be simpler:

```typescript
async updateUserRole(job: Job<{ userId: string; newRoles: Role[] }>) {
  await this.assignRoleUseCase.execute({
    userId: job.data.userId,
    newRoles: job.data.newRoles
  });
  // Success - return anything
  return { updated: true };
  
  // If error occurs, it will be thrown automatically
  // and BullMQ will retry
}
```

---

## 🎯 Why Your Current Code Should Work

Your current code:
```typescript
throw new TransientJobError("Job failed");
```

**This SHOULD trigger retries!** Let me check if there's another issue...

---

## 🔍 Potential Issues

### 1. Check BullMQ Worker Configuration

The worker needs to be configured with retry settings. Let me verify:

```typescript
// In job-processor-registry.service.ts
this.worker = new Worker(
  'default',
  async (job: BullJob) => this.processJob(job),
  {
    connection: this.defaultQueue.opts.connection,
    concurrency,
    lockDuration: 30000,
    lockRenewTime: 15000,
    stalledInterval: 60000,
    maxStalledCount: 2,
    // These are important for retries:
    removeOnComplete: {
      age: 3600 * 24 * 1,
      count: 1000,
    },
    removeOnFail: {
      age: 3600 * 24 * 7,
      count: 500,
    },
  },
);
```

### 2. Check Job Options When Adding

When you add the job, make sure retry options are set:

```typescript
await jobProcessingService.addJob(
  JobName.UPDATE_USER_ROLE,
  { userId: '123', newRoles: [] },
  {
    attempts: 3,  // This is crucial!
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
);
```

### 3. Check if Error is Being Caught Somewhere

Make sure the error isn't being caught and swallowed:

```typescript
// In job-processor-registry.service.ts processJob method
try {
  result = await processorData.processor(job as unknown as Job);
  // ...
} catch (error) {
  // This should re-throw the error for BullMQ to handle
  throw error;  // ← Make sure this is here!
}
```

---

## 🧪 Testing Retries

### Test 1: Verify Job Configuration

Check the job in Redis to see if retry settings are applied:

```typescript
const job = await queue.getJob(jobId);
console.log('Job attempts:', job.opts.attempts);
console.log('Job backoff:', job.opts.backoff);
console.log('Attempts made:', job.attemptsMade);
```

### Test 2: Check Job State

```typescript
const job = await queue.getJob(jobId);
const state = await job.getState();
console.log('Job state:', state); // Should be 'failed' or 'waiting' for retry
```

### Test 3: Monitor Logs

Look for these log messages:

```
Processing: update-user-role:123 (attempt 1/3)
Failed: update-user-role:123 after 100ms (attempt 1/3) - Job failed
Processing: update-user-role:123 (attempt 2/3)  ← Should see this!
Failed: update-user-role:123 after 100ms (attempt 2/3) - Job failed
Processing: update-user-role:123 (attempt 3/3)  ← And this!
```

---

## 🔧 Quick Fix

### Update Your Job Handler

```typescript
import { Injectable, Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { JobName, ProcessJob } from "src/modules/shared/job-processing/decorators/process-job.decorator";
import { Role } from "../../domain/model/role.model";
import { AssignRoleUseCase } from "../use-cases/assign-role.use-case";
import { TransientJobError } from "src/modules/shared/job-processing/errors/job-errors";

@Injectable()
export class UserJobsHandler {
  private readonly logger = new Logger(UserJobsHandler.name);

  constructor(
    private readonly assignRoleUseCase: AssignRoleUseCase,
  ) { }

  @ProcessJob({
    name: JobName.UPDATE_USER_ROLE,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    onRetry: async (attempt, error) => {
      console.log(`🔄 Retry attempt ${attempt}: ${error.message}`);
    },
    onFailed: async (error, attempts) => {
      console.error(`❌ Job failed after ${attempts} attempts: ${error.message}`);
    },
  })
  async updateUserRole(job: Job<{ userId: string; newRoles: Role[] }>) {
    this.logger.log(`Processing user role update for user: ${job.data.userId}`);
    
    try {
      await this.assignRoleUseCase.execute({
        userId: job.data.userId,
        newRoles: job.data.newRoles
      });
      
      this.logger.log(`✅ Successfully updated roles for user: ${job.data.userId}`);
      return { success: true };
    } catch (error) {
      this.logger.error(`❌ Error updating roles: ${error.message}`);
      
      // Throw to trigger retry
      throw new TransientJobError(
        `Failed to update user roles: ${error.message}`,
        { userId: job.data.userId }
      );
    }
  }
}
```

---

## 📊 Debugging Checklist

- [ ] Job has `attempts: 3` configured
- [ ] Job has `backoff` configured
- [ ] Error is being **thrown**, not returned
- [ ] Worker is running and processing jobs
- [ ] Check logs for retry attempts
- [ ] Check Redis for job state
- [ ] Verify `onRetry` callback is being called

---

## 🎯 Most Likely Issue

Based on your code, the most likely issue is:

**The job options might not be passed when adding the job.**

Check where you're adding the job:

```typescript
// Make sure you're passing options!
await jobProcessingService.addJob(
  JobName.UPDATE_USER_ROLE,
  { userId: '123', newRoles: [] },
  {
    attempts: 3,  // ← This must be here!
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  }
);
```

If you're not passing options when adding the job, the `@ProcessJob` decorator options won't be used automatically - they're just metadata!

---

## ✅ Solution

You need to ensure job options are applied when the job is added. Let me check your job-processing.service.ts to see if it's using the decorator metadata...
