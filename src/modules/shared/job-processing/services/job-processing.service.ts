import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { JobData, JobOptions, JobResult, Job } from '../interfaces/job.interface';

@Injectable()
export class JobProcessingService {
  private readonly logger = new Logger(JobProcessingService.name);

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
  ) {}

  /**
   * Add a job to the default queue
   */
  async addJob<T = JobData>(
    name: string,
    data: T,
    options?: JobOptions,
  ): Promise<Job<T>> {
    try {
      this.logger.log(`Adding job: ${name} with data: ${JSON.stringify(data)}`);
      
      // Set TTL based on job type and configuration
      const jobOptions = this.setJobTTL(options);
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
      const job = await queue.add(name, data, options);
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
   * Get jobs by status
   */
  async getJobsByStatus(
    status: 'waiting' | 'active' | 'completed' | 'failed' | 'delayed',
    start = 0,
    end = -1,
  ): Promise<Job[]> {
    try {
      let jobs: Job[];
      switch (status) {
        case 'waiting':
          jobs = await this.defaultQueue.getWaiting(start, end);
          break;
        case 'active':
          jobs = await this.defaultQueue.getActive(start, end);
          break;
        case 'completed':
          jobs = await this.defaultQueue.getCompleted(start, end);
          break;
        case 'failed':
          jobs = await this.defaultQueue.getFailed(start, end);
          break;
        case 'delayed':
          jobs = await this.defaultQueue.getDelayed(start, end);
          break;
        default:
          throw new Error(`Invalid status: ${status}`);
      }
      return jobs;
    } catch (error) {
      this.logger.error(`Failed to get jobs with status: ${status}`, error);
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
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.defaultQueue.getWaiting(),
        this.defaultQueue.getActive(),
        this.defaultQueue.getCompleted(),
        this.defaultQueue.getFailed(),
        this.defaultQueue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
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
      removeOnComplete: {
        age: completedAge,
        count: completedJobsCount
      },
      // Set TTL for failed jobs (7 days by default)
      removeOnFail: {
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
