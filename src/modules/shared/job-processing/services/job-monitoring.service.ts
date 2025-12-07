import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export interface JobMetrics {
  total: number;
  completed: number;
  failed: number;
  active: number;
  waiting: number;
  delayed: number;
  successRate: number;
  failureRate: number;
}

export interface JobPerformanceMetrics {
  averageProcessingTime: number;
  fastestJob: number;
  slowestJob: number;
  totalProcessingTime: number;
}

@Injectable()
export class JobMonitoringService {
  private readonly logger = new Logger(JobMonitoringService.name);

  // Cache for metrics to reduce Redis calls
  private metricsCache: { data: JobMetrics; timestamp: number } | null = null;
  private readonly METRICS_CACHE_TTL = 60000; // 1 minute cache

  constructor(@InjectQueue('default') private readonly defaultQueue: Queue) { }

  /**
   * Get comprehensive job metrics (optimized with caching and count methods)
   */
  async getJobMetrics(): Promise<JobMetrics> {
    try {
      // Check cache first
      const now = Date.now();
      if (this.metricsCache && (now - this.metricsCache.timestamp) < this.METRICS_CACHE_TTL) {
        this.logger.debug('Returning cached metrics');
        return this.metricsCache.data;
      }

      // Use count methods instead of fetching full arrays - MUCH more efficient!
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.defaultQueue.getWaitingCount(),
        this.defaultQueue.getActiveCount(),
        this.defaultQueue.getCompletedCount(),
        this.defaultQueue.getFailedCount(),
        this.defaultQueue.getDelayedCount(),
      ]);

      const total = waiting + active + completed + failed + delayed;
      const successRate = total > 0 ? (completed / total) * 100 : 0;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      const metrics = {
        total,
        completed,
        failed,
        active,
        waiting,
        delayed,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
      };

      // Update cache
      this.metricsCache = { data: metrics, timestamp: now };

      return metrics;
    } catch (error) {
      this.logger.error('Failed to get job metrics', error);
      throw error;
    }
  }

  /**
   * Get job performance metrics (optimized to limit data fetching)
   */
  async getJobPerformanceMetrics(): Promise<JobPerformanceMetrics> {
    try {
      // Only fetch last 100 completed jobs instead of ALL jobs - huge optimization!
      const completedJobs = await this.defaultQueue.getCompleted(0, 99);

      if (completedJobs.length === 0) {
        return {
          averageProcessingTime: 0,
          fastestJob: 0,
          slowestJob: 0,
          totalProcessingTime: 0,
        };
      }

      const processingTimes = completedJobs
        .map((job) => {
          const finishedOn = (job as any).finishedOn;
          const processedOn = (job as any).processedOn;
          return finishedOn && processedOn ? finishedOn - processedOn : 0;
        })
        .filter((time) => time > 0);

      if (processingTimes.length === 0) {
        return {
          averageProcessingTime: 0,
          fastestJob: 0,
          slowestJob: 0,
          totalProcessingTime: 0,
        };
      }

      const totalProcessingTime = processingTimes.reduce(
        (sum, time) => sum + time,
        0,
      );
      const averageProcessingTime =
        totalProcessingTime / processingTimes.length;
      const fastestJob = Math.min(...processingTimes);
      const slowestJob = Math.max(...processingTimes);

      return {
        averageProcessingTime: Math.round(averageProcessingTime),
        fastestJob,
        slowestJob,
        totalProcessingTime,
      };
    } catch (error) {
      this.logger.error('Failed to get job performance metrics', error);
      throw error;
    }
  }

  /**
   * Get job metrics by name
   * WARNING: This method is expensive as it needs to fetch jobs to filter by name.
   * Consider using separate queues per job type for better performance.
   */
  async getJobMetricsByName(jobName: string): Promise<JobMetrics> {
    try {
      this.logger.warn(`getJobMetricsByName is expensive - consider using separate queues for job type: ${jobName}`);

      // We need to fetch jobs to filter by name - this is expensive
      // Using smaller ranges to limit data transfer
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.defaultQueue.getWaiting(0, 999),    // Limit to 1000 jobs
        this.defaultQueue.getActive(0, 999),     // Limit to 1000 jobs
        this.defaultQueue.getCompleted(0, 999),  // Limit to 1000 jobs
        this.defaultQueue.getFailed(0, 999),     // Limit to 1000 jobs
        this.defaultQueue.getDelayed(0, 999),    // Limit to 1000 jobs
      ]);

      const filterByName = (jobs: any[]) =>
        jobs.filter((job) => job.name === jobName);

      const waitingJobs = filterByName(waiting);
      const activeJobs = filterByName(active);
      const completedJobs = filterByName(completed);
      const failedJobs = filterByName(failed);
      const delayedJobs = filterByName(delayed);

      const total =
        waitingJobs.length +
        activeJobs.length +
        completedJobs.length +
        failedJobs.length +
        delayedJobs.length;
      const successRate = total > 0 ? (completedJobs.length / total) * 100 : 0;
      const failureRate = total > 0 ? (failedJobs.length / total) * 100 : 0;

      return {
        total,
        completed: completedJobs.length,
        failed: failedJobs.length,
        active: activeJobs.length,
        waiting: waitingJobs.length,
        delayed: delayedJobs.length,
        successRate: Math.round(successRate * 100) / 100,
        failureRate: Math.round(failureRate * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Failed to get job metrics for: ${jobName}`, error);
      throw error;
    }
  }

  /**
   * Get failed jobs with error details
   */
  async getFailedJobs(limit = 50) {
    try {
      const failedJobs = await this.defaultQueue.getFailed(0, limit - 1);

      return failedJobs.map((job) => ({
        id: job.id,
        name: job.name,
        data: job.data,
        error: (job as any).failedReason,
        failedAt: (job as any).finishedOn,
        attempts: (job as any).attemptsMade,
        maxAttempts: job.opts.attempts,
      }));
    } catch (error) {
      this.logger.error('Failed to get failed jobs', error);
      throw error;
    }
  }

  /**
   * Get job by ID with detailed information
   */
  async getJobDetails(jobId: string) {
    try {
      const job = await this.defaultQueue.getJob(jobId);

      if (!job) {
        return null;
      }

      const state = await job.getState();

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        opts: job.opts,
        state,
        progress: job.progress,
        returnvalue: (job as any).returnvalue,
        failedReason: (job as any).failedReason,
        processedOn: (job as any).processedOn,
        finishedOn: (job as any).finishedOn,
        timestamp: (job as any).timestamp,
        attemptsMade: (job as any).attemptsMade,
        delay: (job as any).delay,
        ttl: (job as any).ttl,
      };
    } catch (error) {
      this.logger.error(`Failed to get job details: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Get queue health status
   */
  async getQueueHealth() {
    try {
      const metrics = await this.getJobMetrics();
      const isPaused = await this.defaultQueue.isPaused();

      const healthStatus = {
        status: 'healthy',
        isPaused,
        metrics,
        issues: [] as string[],
      };

      // Check for potential issues
      if (metrics.failureRate > 50) {
        healthStatus.status = 'unhealthy';
        healthStatus.issues.push('High failure rate detected');
      }

      if (metrics.waiting > 1000) {
        healthStatus.status = 'degraded';
        healthStatus.issues.push('High number of waiting jobs');
      }

      if (isPaused) {
        healthStatus.status = 'paused';
        healthStatus.issues.push('Queue is paused');
      }

      return healthStatus;
    } catch (error) {
      this.logger.error('Failed to get queue health', error);
      return {
        status: 'error',
        isPaused: false,
        metrics: null,
        issues: ['Failed to retrieve queue health data'],
      };
    }
  }

  /**
   * Clean old jobs based on criteria (manual cleanup - TTL handles automatic cleanup)
   */
  async cleanOldJobs(options?: {
    completed?: number;
    failed?: number;
    age?: number; // in milliseconds
  }) {
    try {
      // Get retention settings from environment variables
      const completedJobsDays = parseInt(
        process.env.JOB_RETENTION_COMPLETED_DAYS || '2',
      );
      const failedJobsDays = parseInt(
        process.env.JOB_RETENTION_FAILED_DAYS || '7',
      );
      const completedJobsCount = parseInt(
        process.env.JOB_RETENTION_COMPLETED_COUNT || '100',
      );
      const failedJobsCount = parseInt(
        process.env.JOB_RETENTION_FAILED_COUNT || '50',
      );

      // Use provided options or fall back to environment defaults
      const completedCount = options?.completed ?? completedJobsCount;
      const failedCount = options?.failed ?? failedJobsCount;

      // Convert days to seconds for BullMQ
      const completedAge = options?.age ?? completedJobsDays * 24 * 60 * 60;
      const failedAge = options?.age ?? failedJobsDays * 24 * 60 * 60;

      await Promise.all([
        this.defaultQueue.clean(completedAge, completedCount, 'completed'),
        this.defaultQueue.clean(failedAge, failedCount, 'failed'),
      ]);

      this.logger.log(
        `Manually cleaned old jobs - completed: ${completedCount} (${completedJobsDays} days), failed: ${failedCount} (${failedJobsDays} days). Note: TTL handles automatic cleanup.`,
      );
    } catch (error) {
      this.logger.error('Failed to clean old jobs', error);
      throw error;
    }
  }

  /**
   * Get queue statistics for monitoring dashboard
   */
  async getQueueStatistics() {
    try {
      const [metrics, performance, health] = await Promise.all([
        this.getJobMetrics(),
        this.getJobPerformanceMetrics(),
        this.getQueueHealth(),
      ]);

      return {
        metrics,
        performance,
        health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue statistics', error);
      throw error;
    }
  }
}
