import { Injectable, Logger } from '@nestjs/common';
import { JobProcessingService } from '../services/job-processing.service';
import { JobMonitoringService } from '../services/job-monitoring.service';

@Injectable()
export class JobProcessingExampleService {
  private readonly logger = new Logger(JobProcessingExampleService.name);

  constructor(
    private readonly jobProcessingService: JobProcessingService,
    private readonly jobMonitoringService: JobMonitoringService,
  ) {}

  /**
   * Example: Add a simple job
   */
  async addSimpleJob() {
    try {
      const job = await this.jobProcessingService.addJob('send-email', {
        to: 'user@example.com',
        subject: 'Test Email',
        body: 'This is a test email',
      }, {
        priority: 10,
        delay: 1000, // Send after 1 second
      });

      this.logger.log(`Simple job added with ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add simple job', error);
      throw error;
    }
  }

  /**
   * Example: Add a data processing job
   */
  async addDataProcessingJob(filePath: string) {
    try {
      const job = await this.jobProcessingService.addJob('process-data-file', {
        filePath,
        processType: 'csv',
        outputFormat: 'json',
        options: {
          delimiter: ',',
          encoding: 'utf-8',
          skipHeader: false,
        },
      }, {
        priority: 5,
        attempts: 2,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      });

      this.logger.log(`Data processing job added with ID: ${job.id}`);
      return job;
    } catch (error) {
      this.logger.error('Failed to add data processing job', error);
      throw error;
    }
  }


  /**
   * Example: Get job statistics
   */
  async getJobStatistics() {
    try {
      const stats = await this.jobMonitoringService.getQueueStatistics();
      this.logger.log('Job statistics retrieved:', stats);
      return stats;
    } catch (error) {
      this.logger.error('Failed to get job statistics', error);
      throw error;
    }
  }

  /**
   * Example: Monitor job health
   */
  async checkJobHealth() {
    try {
      const health = await this.jobMonitoringService.getQueueHealth();
      this.logger.log('Job queue health:', health);
      return health;
    } catch (error) {
      this.logger.error('Failed to check job health', error);
      throw error;
    }
  }

  /**
   * Example: Clean up old jobs
   */
  async cleanupOldJobs() {
    try {
      await this.jobMonitoringService.cleanOldJobs({
        completed: 50,
        failed: 25,
        age: 24 * 60 * 60 * 1000, // 24 hours
      });
      this.logger.log('Old jobs cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to clean up old jobs', error);
      throw error;
    }
  }

  /**
   * Example: Pause and resume queue
   */
  async pauseQueue() {
    try {
      await this.jobProcessingService.pauseQueue();
      this.logger.log('Queue paused successfully');
    } catch (error) {
      this.logger.error('Failed to pause queue', error);
      throw error;
    }
  }

  async resumeQueue() {
    try {
      await this.jobProcessingService.resumeQueue();
      this.logger.log('Queue resumed successfully');
    } catch (error) {
      this.logger.error('Failed to resume queue', error);
      throw error;
    }
  }

  /**
   * Example: Get failed jobs
   */
  async getFailedJobs() {
    try {
      const failedJobs = await this.jobMonitoringService.getFailedJobs(10);
      this.logger.log(`Found ${failedJobs.length} failed jobs`);
      return failedJobs;
    } catch (error) {
      this.logger.error('Failed to get failed jobs', error);
      throw error;
    }
  }

  /**
   * Example: Get job details
   */
  async getJobDetails(jobId: string) {
    try {
      const jobDetails = await this.jobMonitoringService.getJobDetails(jobId);
      this.logger.log(`Job details for ${jobId}:`, jobDetails);
      return jobDetails;
    } catch (error) {
      this.logger.error(`Failed to get job details for ${jobId}`, error);
      throw error;
    }
  }
}
