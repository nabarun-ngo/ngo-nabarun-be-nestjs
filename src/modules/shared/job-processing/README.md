# Job Processing Module

A comprehensive job processing module for NestJS applications using BullMQ for reliable job queuing and processing.

## Features

- **Job Processing**: Process jobs with automatic retry, backoff strategies, and concurrency control
- **Job Monitoring**: Comprehensive monitoring and metrics for job queues
- **TTL-based Cleanup**: Automatic job cleanup using Redis TTL (Time To Live) - no periodic scheduling needed
- **Configurable Retention**: Set job retention periods via environment variables
- **Decorators**: Easy-to-use decorators for job processors
- **Type Safety**: Full TypeScript support with interfaces and type definitions
- **Error Handling**: Robust error handling and logging
- **Queue Management**: Pause, resume, and clean job queues

## Installation

The module is already included in the project. Make sure to install the required dependencies:

```bash
npm install @nestjs/bullmq bullmq ioredis
```

## Configuration

Add the following environment variables to your `.env` file:

```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DB=0

# Job Processing TTL Configuration
JOB_RETENTION_COMPLETED_DAYS=2    # Keep completed jobs for 2 days
JOB_RETENTION_FAILED_DAYS=7       # Keep failed jobs for 7 days
JOB_RETENTION_COMPLETED_COUNT=100 # Keep last 100 completed jobs
JOB_RETENTION_FAILED_COUNT=50     # Keep last 50 failed jobs
```

## Usage

### 1. Import the Module

Add the `JobProcessingModule` to your `app.module.ts`:

```typescript
import { JobProcessingModule } from './infrastructure/job-processing/job-processing.module';

@Module({
  imports: [
    // ... other modules
    JobProcessingModule,
  ],
})
export class AppModule {}
```

### 2. Create Job Processors

Create a service with job processors using the `@ProcessJob` decorator:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ProcessJob } from '../infrastructure/job-processing/decorators/process-job.decorator';
import { Job, JobResult } from '../infrastructure/job-processing/interfaces/job.interface';

@Injectable()
export class EmailJobProcessor {
  private readonly logger = new Logger(EmailJobProcessor.name);

  @ProcessJob({
    name: 'send-email',
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processEmailJob(job: Job<EmailJobData>): Promise<JobResult> {
    try {
      // Your job processing logic here
      await this.sendEmail(job.data);
      
      return {
        success: true,
        data: { messageId: `email-${job.id}` },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
```

### 3. Add Jobs Programmatically

Use the `JobProcessingService` to add jobs programmatically:

```typescript
import { JobProcessingService } from '../infrastructure/job-processing/services/job-processing.service';

@Injectable()
export class SomeService {
  constructor(
    private readonly jobProcessingService: JobProcessingService,
  ) {}

  async sendWelcomeEmail(userId: string) {
    await this.jobProcessingService.addJob('send-email', {
      to: 'user@example.com',
      subject: 'Welcome!',
      body: 'Welcome to our platform!',
    }, {
      priority: 10,
      delay: 5000, // Send after 5 seconds
    });
  }
}
```

### 5. Monitor Jobs

Use the monitoring endpoints to track job performance:

```typescript
// Get job metrics
GET /jobs/metrics

// Get failed jobs
GET /jobs/failed

// Get queue health
GET /jobs/health

// Get job details
GET /jobs/details/{jobId}
```

## API Endpoints

The module provides a comprehensive REST API for job management:

### Job Monitoring
- `GET /jobs/metrics` - Get overall job metrics
- `GET /jobs/metrics/:jobName` - Get metrics for a specific job type
- `GET /jobs/performance` - Get performance metrics
- `GET /jobs/failed` - Get failed jobs
- `GET /jobs/details/:jobId` - Get detailed job information
- `GET /jobs/health` - Get queue health status
- `GET /jobs/statistics` - Get comprehensive statistics
- `GET /jobs/ttl/config` - Get TTL configuration for job cleanup

### Job Management
- `POST /jobs/pause` - Pause the queue
- `POST /jobs/resume` - Resume the queue
- `DELETE /jobs/:jobId` - Remove a specific job
- `POST /jobs/clean` - Manual cleanup (TTL handles automatic cleanup)


## Job Options

When adding jobs, you can specify various options:

```typescript
interface JobOptions {
  delay?: number;           // Delay before processing (ms)
  priority?: number;        // Job priority (higher = more priority)
  attempts?: number;        // Number of retry attempts
  backoff?: {               // Backoff strategy for retries
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number; // Number of completed jobs to keep
  removeOnFail?: number;     // Number of failed jobs to keep
  jobId?: string;           // Custom job ID
}
```

## Error Handling

The module provides comprehensive error handling:

- Automatic retry with configurable backoff strategies
- Detailed error logging
- Failed job tracking and monitoring
- Graceful error recovery

## Examples

See the `examples/` directory for complete examples:
- `email-job.processor.ts` - Email sending jobs
- `data-processing-job.processor.ts` - Data processing jobs
- `notification-job.processor.ts` - Notification jobs

## TTL-based Job Cleanup

The module uses **Redis TTL (Time To Live)** for automatic job cleanup, which is more efficient than periodic scheduling:

### How TTL Cleanup Works

1. **Automatic**: Jobs are automatically removed from Redis when they expire
2. **Configurable**: Set retention periods via environment variables
3. **Efficient**: No background processes or cron jobs needed
4. **Reliable**: Redis handles the cleanup automatically

### TTL Configuration

```env
# Job Retention Settings
JOB_RETENTION_COMPLETED_DAYS=2    # Completed jobs expire after 2 days
JOB_RETENTION_FAILED_DAYS=7       # Failed jobs expire after 7 days
JOB_RETENTION_COMPLETED_COUNT=100 # Keep last 100 completed jobs
JOB_RETENTION_FAILED_COUNT=50     # Keep last 50 failed jobs
```

### Benefits of TTL Approach

- ✅ **No CPU overhead** from periodic cleanup jobs
- ✅ **Automatic cleanup** handled by Redis
- ✅ **Memory efficient** - jobs are removed immediately when expired
- ✅ **Configurable** retention periods
- ✅ **Reliable** - Redis guarantees cleanup

## Best Practices

1. **Use appropriate concurrency levels** based on your system resources
2. **Set reasonable retry limits** to avoid infinite retry loops
3. **Monitor job performance** using the provided metrics
4. **Configure TTL settings** based on your needs (default: 2 days completed, 7 days failed)
5. **Use job priorities** for important tasks
6. **Handle errors gracefully** in your job processors
7. **Log job progress** for better debugging

## Troubleshooting

### Common Issues

1. **Redis Connection Issues**: Ensure Redis is running and accessible
2. **Memory Issues**: Clean old jobs regularly
3. **High Failure Rate**: Check your job processor logic and error handling
4. **Queue Paused**: Check if the queue is paused and resume if needed

### Monitoring

Use the health endpoint to monitor queue status:
```bash
curl http://localhost:3000/jobs/health
```

This will return the queue health status and any potential issues.
