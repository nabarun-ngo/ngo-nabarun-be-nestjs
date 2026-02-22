import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobData, JobOptions, JobResult, Job } from '../interfaces/job.interface';
import { JobName } from 'src/shared/job-names';
import { ProcessJobOptions } from '../decorators/process-job.decorator';
import { JobProcessorRegistry } from './job-processor-registry.service';

@Injectable()
export class JobProcessingService {
  private readonly logger = new Logger(JobProcessingService.name);

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
    @Inject(forwardRef(() => JobProcessorRegistry))
    private readonly registry: JobProcessorRegistry,
  ) { }

  /**
   * Add a job to the default queue
   */
  async addJob<T = JobData>(
    name: JobName,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    try {
      this.logger.log(`Adding job: ${name} with data: ${JSON.stringify(data)}`);

      // 1. Get default options from the processor decorator
      const processorData = this.registry.getProcessor(name);
      const defaults: Partial<ProcessJobOptions> = processorData?.options || {};

      // 2. Merge options: Instance Override > Decorator Default > Service Defaults
      const mergedOptions: JobOptions = {
        attempts: options?.attempts ?? defaults.attempts,
        backoff: options?.backoff ?? (defaults.backoff as any),
        priority: options?.priority ?? defaults.priority,
        // timeout is handled manually by the registry/worker during processing
        ...options,
      };

      // 3. Set TTL based on job type and configuration
      const jobOptions = this.setJobTTL(mergedOptions);

      const job = await this.defaultQueue.add(name, data, jobOptions);
      this.logger.log(`Job added successfully with ID: ${job.id}`);
      return job as Job<T>;
    } catch (error) {
      this.logger.error(`Failed to add job: ${name}`, error);
      throw error;
    }
  }

  /**
   * Add a job to a specific queue
   */
  async addJobToQueue<T = JobData>(
    queueName: string,
    name: string,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    try {
      this.logger.log(`Adding job: ${name} to queue: ${queueName}`);
      const queue = this.getQueue(queueName);

      // Try to get defaults if it's a known JobName
      const processorData = this.registry.getProcessor(name);
      const defaults: Partial<ProcessJobOptions> = processorData?.options || {};

      const mergedOptions: JobOptions = {
        attempts: options?.attempts ?? defaults.attempts,
        backoff: options?.backoff ?? (defaults.backoff as any),
        priority: options?.priority ?? defaults.priority,
        ...options,
      };

      const job = await queue.add(name, data, mergedOptions);
      this.logger.log(`Job added successfully with ID: ${job.id}`);
      return job as Job<T>;
    } catch (error) {
      this.logger.error(`Failed to add job: ${name} to queue: ${queueName}`, error);
      throw error;
    }
  }

  /**
   * Get a job by ID
   */
  async getJob<T = JobData>(jobId: string): Promise<Job<T> | undefined> {
    try {
      const job = await this.defaultQueue.getJob(jobId);
      return job as Job<T> | undefined;
    } catch (error) {
      this.logger.error(`Failed to get job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Get a job from a specific queue
   */
  async getJobFromQueue<T = JobData>(
    queueName: string,
    jobId: string,
  ): Promise<Job<T> | undefined> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      return job as Job<T> | undefined;
    } catch (error) {
      this.logger.error(`Failed to get job: ${jobId} from queue: ${queueName}`, error);
      throw error;
    }
  }

  /**
   * Remove a job
   */
  async removeJob(jobId: string): Promise<void> {
    try {
      const job = await this.defaultQueue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Job removed: ${jobId}`);
      } else {
        this.logger.warn(`Job not found: ${jobId}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Retry a failed job
   */
  async retryJob(jobId: string): Promise<void> {
    try {
      const job = await this.defaultQueue.getJob(jobId);

      if (!job) {
        this.logger.warn(`Job not found: ${jobId}`);
        throw new Error(`Job ${jobId} not found`);
      }

      const state = await job.getState();

      if (state !== 'failed') {
        this.logger.warn(`Job ${jobId} is not in failed state (current state: ${state})`);
        throw new Error(`Job ${jobId} is not in failed state. Current state: ${state}`);
      }

      // Retry the job
      await job.retry();
      this.logger.log(`Job ${jobId} has been queued for retry`);
    } catch (error) {
      this.logger.error(`Failed to retry job: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Retry all failed jobs
   */
  async retryAllFailedJobs(): Promise<{ retriedCount: number; failedCount: number }> {
    try {
      const failedJobs = await this.defaultQueue.getFailed();
      let retriedCount = 0;
      let failedCount = 0;

      this.logger.log(`Found ${failedJobs.length} failed jobs to retry`);

      for (const job of failedJobs) {
        try {
          await job.retry();
          retriedCount++;
          this.logger.log(`Retried job: ${job.id}`);
        } catch (error) {
          failedCount++;
          this.logger.error(`Failed to retry job ${job.id}: ${error.message}`);
        }
      }

      this.logger.log(`Retry complete: ${retriedCount} succeeded, ${failedCount} failed`);

      return { retriedCount, failedCount };
    } catch (error) {
      this.logger.error('Failed to retry all failed jobs', error);
      throw error;
    }
  }

  /**
   * Remove a job from a specific queue
   */
  async removeJobFromQueue(queueName: string, jobId: string): Promise<void> {
    try {
      const queue = this.getQueue(queueName);
      const job = await queue.getJob(jobId);
      if (job) {
        await job.remove();
        this.logger.log(`Job removed: ${jobId} from queue: ${queueName}`);
      } else {
        this.logger.warn(`Job not found: ${jobId} in queue: ${queueName}`);
      }
    } catch (error) {
      this.logger.error(`Failed to remove job: ${jobId} from queue: ${queueName}`, error);
      throw error;
    }
  }

  /**
   * Clean completed and failed jobs
   */
  async cleanJobs(grace: number = 0, status: 'completed' | 'failed' = 'completed'): Promise<void> {
    try {
      // Get retention settings from environment variables
      const completedJobsDays = parseInt(process.env.JOB_RETENTION_COMPLETED_DAYS || '2');
      const failedJobsDays = parseInt(process.env.JOB_RETENTION_FAILED_DAYS || '7');
      const completedJobsCount = parseInt(process.env.JOB_RETENTION_COMPLETED_COUNT || '100');
      const failedJobsCount = parseInt(process.env.JOB_RETENTION_FAILED_COUNT || '50');

      const age = status === 'completed'
        ? completedJobsDays * 24 * 60 * 60
        : failedJobsDays * 24 * 60 * 60;

      const count = status === 'completed' ? completedJobsCount : failedJobsCount;
      await this.defaultQueue.clean(grace, count, status);
      this.logger.log(`Cleaned ${status} jobs`);
    } catch (error) {
      this.logger.error(`Failed to clean ${status} jobs`, error);
      throw error;
    }
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    try {
      await this.defaultQueue.pause();
      this.logger.log('Queue paused');
    } catch (error) {
      this.logger.error('Failed to pause queue', error);
      throw error;
    }
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    try {
      await this.defaultQueue.resume();
      this.logger.log('Queue resumed');
    } catch (error) {
      this.logger.error('Failed to resume queue', error);
      throw error;
    }
  }

  /**
   * Check if queue is paused
   */
  async isQueuePaused(): Promise<boolean> {
    try {
      return await this.defaultQueue.isPaused();
    } catch (error) {
      this.logger.error('Failed to check queue pause status', error);
      throw error;
    }
  }

  /**
   * Get queue statistics (optimized with count methods)
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      // Use count methods instead of fetching arrays - much more efficient!
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.defaultQueue.getWaitingCount(),
        this.defaultQueue.getActiveCount(),
        this.defaultQueue.getCompletedCount(),
        this.defaultQueue.getFailedCount(),
        this.defaultQueue.getDelayedCount(),
      ]);

      return {
        waiting,
        active,
        completed,
        failed,
        delayed,
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats', error);
      throw error;
    }
  }

  /**
   * Set TTL for jobs based on configuration
   */
  private setJobTTL(options?: JobOptions): JobOptions {
    // Get retention settings from environment variables
    const completedJobsDays = parseInt(process.env.JOB_RETENTION_COMPLETED_DAYS || '2');
    const failedJobsDays = parseInt(process.env.JOB_RETENTION_FAILED_DAYS || '7');
    const completedJobsCount = parseInt(process.env.JOB_RETENTION_COMPLETED_COUNT || '100');
    const failedJobsCount = parseInt(process.env.JOB_RETENTION_FAILED_COUNT || '50');

    // Convert days to seconds for BullMQ
    const completedAge = completedJobsDays * 24 * 60 * 60;
    const failedAge = failedJobsDays * 24 * 60 * 60;

    return {
      ...options,
      // Set TTL for completed jobs (2 days by default)
      removeOnComplete: options?.removeOnComplete ?? {
        age: completedAge,
        count: completedJobsCount
      },
      // Set TTL for failed jobs (7 days by default)
      removeOnFail: options?.removeOnFail ?? {
        age: failedAge,
        count: failedJobsCount
      },
    };
  }

  /**
   * Get a queue instance by name
   * This is a placeholder - in a real implementation, you'd manage multiple queues
   */
  private getQueue(queueName: string): Queue {
    // For now, return the default queue
    // In a real implementation, you'd have a queue registry
    return this.defaultQueue;
  }
}
