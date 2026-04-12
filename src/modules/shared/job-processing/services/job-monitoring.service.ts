import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, JobType, Queue, FlowJob } from 'bullmq';
import { JobDetail, JobMetrics, JobPerformanceMetrics, QueueHealth } from '../dto/job.dto';
import { PagedResult } from 'src/shared/models/paged-result';
import { config } from 'src/config/app.config';



@Injectable()
export class JobMonitoringService {

  private readonly logger = new Logger(JobMonitoringService.name);

  // Cache for metrics to reduce Redis calls
  private metricsCache: { data: JobMetrics; timestamp: number } | null = null;
  private readonly METRICS_CACHE_TTL = 60000; // 1 minute cache

  constructor(@InjectQueue(config.jobProcessing.queueName) private readonly defaultQueue: Queue) { }

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
      const [waiting, active, completed, failed, delayed, waitingChildren] = await Promise.all([
        this.defaultQueue.getWaitingCount(),
        this.defaultQueue.getActiveCount(),
        this.defaultQueue.getCompletedCount(),
        this.defaultQueue.getFailedCount(),
        this.defaultQueue.getDelayedCount(),
        this.defaultQueue.getWaitingChildrenCount(),
      ]);

      const total = waiting + active + completed + failed + delayed + waitingChildren;
      const successRate = total > 0 ? (completed / total) * 100 : 0;
      const failureRate = total > 0 ? (failed / total) * 100 : 0;

      const metrics: JobMetrics = {
        total,
        completed,
        failed,
        active,
        waiting,
        waitingChildren,
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
        } as JobPerformanceMetrics;
      }

      const processingTimes = completedJobs
        .map((job) => {
          const finishedOn = job.finishedOn;
          const processedOn = job.processedOn;
          return finishedOn && processedOn ? finishedOn - processedOn : 0;
        })
        .filter((time) => time > 0);

      if (processingTimes.length === 0) {
        return {
          averageProcessingTime: 0,
          fastestJob: 0,
          slowestJob: 0,
          totalProcessingTime: 0,
        } as JobPerformanceMetrics;
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
      } as JobPerformanceMetrics;
    } catch (error) {
      this.logger.error('Failed to get job performance metrics', error);
      throw error;
    }
  }

  /**
   * Get failed jobs with error details
   */
  async getJobs(pageIndex: number, pageSize: number, filter: {
    status: JobType;
    name?: string;
  }) {
    try {

      const page = pageIndex || 0;
      const size = pageSize || 10;
      const start = page * size;
      const end = (page * size) + size - 1;
      const jobs = await this.defaultQueue.getJobs(filter.status, start, end);
      const count = await this.defaultQueue.getJobCounts(filter.status);
      //console.log(`Start: ${start}, End: ${end}, Count: ${jobs.length}, Total Count: ${count[filter.status!]}`);

      const jobDetails = await Promise.all(jobs
        .filter((job) => filter?.name ? job.name === filter.name : true)
        .map(async (job) => await this.toJobDetail(job)));
      return new PagedResult(
        jobDetails,
        count[filter.status!],
        page,
        size,
      )
    } catch (error) {
      this.logger.error('Failed to get jobs', error);
      throw error;
    }
  }

  private async toJobDetail(job: Job<any, any, string>, logs?: string[]): Promise<JobDetail> {
    return {
      id: job.id,
      name: job.name,
      data: job.data,
      opts: job.opts,
      state: await job.getState(),
      progress: job.progress ?? 0,
      returnvalue: job.returnvalue,
      failedReason: job.failedReason ?? '',
      processedOn: job.processedOn ? new Date(job.processedOn) : undefined,
      finishedOn: job.finishedOn ? new Date(job.finishedOn) : undefined,
      timestamp: job.timestamp ? new Date(job.timestamp) : undefined,
      attemptsMade: job.attemptsMade,
      delay: job.delay,
      stacktrace: job.stacktrace,
      logs: logs ?? (await this.defaultQueue.getJobLogs(job.id!)).logs,
      parent: job.parent ? { id: job.parent.id as string, queue: job.opts.parent?.queue || '' } : undefined,
      // Fetch children if this job is a parent
      children: await this.getChildrenDetails(job),
    };
  }

  /**
   * Helper to fetch children details for a parent job
   */
  private async getChildrenDetails(job: Job): Promise<JobDetail[] | undefined> {
    try {
      // In BullMQ, parent jobs have dependencies (children)
      const dependencies = await job.getDependencies();

      if (!dependencies || Object.keys(dependencies).length === 0) {
        return undefined;
      }

      const children: JobDetail[] = [];

      // dependencies is an object where keys are queue names and values are arrays of job IDs
      const depEntries = Object.entries(dependencies);
      for (const [queueName, jobIds] of depEntries) {
        if (!Array.isArray(jobIds)) continue;
        for (const childId of jobIds) {
          const childJob = await this.defaultQueue.getJob(childId);
          if (childJob) {
            // Recursively convert to JobDetail (but limit depth to avoid infinite recursion/perf issues)
            // For now, let's just do one level deep to avoid complexity
            children.push({
              id: childJob.id,
              name: childJob.name,
              data: childJob.data,
              opts: childJob.opts,
              state: await childJob.getState(),
              progress: childJob.progress ?? 0,
              returnvalue: childJob.returnvalue,
              failedReason: childJob.failedReason ?? '',
              processedOn: childJob.processedOn ? new Date(childJob.processedOn) : undefined,
              finishedOn: childJob.finishedOn ? new Date(childJob.finishedOn) : undefined,
              timestamp: childJob.timestamp ? new Date(childJob.timestamp) : undefined,
              attemptsMade: childJob.attemptsMade,
              delay: childJob.delay,
              stacktrace: childJob.stacktrace,
            });
          }
        }
      }

      return children.length > 0 ? children : undefined;
    } catch (error) {
      this.logger.debug(`Could not fetch children for job ${job.id}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Get job by ID with detailed information
   */
  async getJobDetails(jobId: string) {
    try {
      const job = await this.defaultQueue.getJob(jobId);
      const jobLogs = await this.defaultQueue.getJobLogs(jobId);

      if (!job) {
        throw new Error('Job not found');
      }
      return this.toJobDetail(job, jobLogs.logs);
    } catch (error) {
      this.logger.error(`Failed to get job details: ${jobId}`, error);
      throw error;
    }
  }

  /**
   * Get queue health status
   */
  async getQueueHealth(): Promise<QueueHealth> {
    try {
      const metrics = await this.getJobMetrics();
      const isPaused = await this.defaultQueue.isPaused();

      const healthStatus: QueueHealth = {
        status: 'healthy',
        isPaused,
        issues: [] as string[],
      };

      // Check for potential issues
      if (metrics.failureRate > 50) {
        healthStatus.status = 'unhealthy';
        healthStatus.issues.push('High failure rate detected');
      }

      if (metrics.waiting > 100) {
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
        issues: ['Failed to retrieve queue health data'],
      };
    }
  }

  /**
   * Clean old jobs based on criteria (manual cleanup - TTL handles automatic cleanup)
   */
  async cleanOldJobs() {
    try {
      // Get retention settings from environment variables
      const completedJobsCount = config.jobProcessing.removeOnComplete.count;
      // Convert days to seconds for BullMQ
      const completedAge = config.jobProcessing.removeOnComplete.age;
      const failedJobsCount = config.jobProcessing.removeOnFail.count;
      const failedAge = config.jobProcessing.removeOnFail.age;

      await Promise.all([
        this.defaultQueue.clean(completedAge, completedJobsCount, 'completed'),
        this.defaultQueue.clean(failedAge, failedJobsCount, 'failed'),
      ]);

      const message = `Manually cleaned old jobs`;
      this.logger.log(message);
      return message;
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
