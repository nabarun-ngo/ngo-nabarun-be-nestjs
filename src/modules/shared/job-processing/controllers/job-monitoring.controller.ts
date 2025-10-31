import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JobProcessingService } from '../services/job-processing.service';
import { JobMonitoringService } from '../services/job-monitoring.service';

@ApiTags('Job Monitoring')
@Controller('jobs')
export class JobMonitoringController {
  constructor(
    private readonly jobProcessingService: JobProcessingService,
    private readonly jobMonitoringService: JobMonitoringService,
  ) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get job metrics' })
  @ApiResponse({ status: 200, description: 'Job metrics retrieved successfully' })
  async getJobMetrics() {
    return await this.jobMonitoringService.getJobMetrics();
  }

  @Get('metrics/:jobName')
  @ApiOperation({ summary: 'Get job metrics by name' })
  @ApiParam({ name: 'jobName', description: 'Name of the job' })
  @ApiResponse({ status: 200, description: 'Job metrics retrieved successfully' })
  async getJobMetricsByName(@Param('jobName') jobName: string) {
    return await this.jobMonitoringService.getJobMetricsByName(jobName);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get job performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getJobPerformanceMetrics() {
    return await this.jobMonitoringService.getJobPerformanceMetrics();
  }

  @Get('failed')
  @ApiOperation({ summary: 'Get failed jobs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of failed jobs to return' })
  @ApiResponse({ status: 200, description: 'Failed jobs retrieved successfully' })
  async getFailedJobs(@Query('limit') limit?: number) {
    return await this.jobMonitoringService.getFailedJobs(limit);
  }

  @Get('details/:jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'jobId', description: 'ID of the job' })
  @ApiResponse({ status: 200, description: 'Job details retrieved successfully' })
  async getJobDetails(@Param('jobId') jobId: string) {
    return await this.jobMonitoringService.getJobDetails(jobId);
  }

  @Get('health')
  @ApiOperation({ summary: 'Get queue health status' })
  @ApiResponse({ status: 200, description: 'Queue health status retrieved successfully' })
  async getQueueHealth() {
    return await this.jobMonitoringService.getQueueHealth();
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStatistics() {
    return await this.jobMonitoringService.getQueueStatistics();
  }


  @Post('clean')
  @ApiOperation({ summary: 'Clean old jobs (manual cleanup - TTL handles automatic cleanup)' })
  @ApiResponse({ status: 200, description: 'Jobs cleaned successfully' })
  async cleanOldJobs(@Body() options: { completed?: number; failed?: number; age?: number }) {
    return await this.jobMonitoringService.cleanOldJobs(options);
  }

  @Post('pause')
  @ApiOperation({ summary: 'Pause the queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  async pauseQueue() {
    await this.jobProcessingService.pauseQueue();
    return { message: 'Queue paused successfully' };
  }

  @Post('resume')
  @ApiOperation({ summary: 'Resume the queue' })
  @ApiResponse({ status: 200, description: 'Queue resumed successfully' })
  async resumeQueue() {
    await this.jobProcessingService.resumeQueue();
    return { message: 'Queue resumed successfully' };
  }


  @Delete(':jobId')
  @ApiOperation({ summary: 'Remove a job' })
  @ApiParam({ name: 'jobId', description: 'ID of the job to remove' })
  @ApiResponse({ status: 200, description: 'Job removed successfully' })
  async removeJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.removeJob(jobId);
    return { message: `Job '${jobId}' removed successfully` };
  }

  @Get('ttl/config')
  @ApiOperation({ summary: 'Get TTL configuration for job cleanup' })
  @ApiResponse({ status: 200, description: 'TTL configuration retrieved successfully' })
  async getTTLConfig() {
    const completedJobsDays = parseInt(process.env.JOB_RETENTION_COMPLETED_DAYS || '2');
    const failedJobsDays = parseInt(process.env.JOB_RETENTION_FAILED_DAYS || '7');
    const completedJobsCount = parseInt(process.env.JOB_RETENTION_COMPLETED_COUNT || '100');
    const failedJobsCount = parseInt(process.env.JOB_RETENTION_FAILED_COUNT || '50');
    
    return {
      message: 'Jobs are automatically cleaned using TTL (Time To Live)',
      retention: {
        completedJobsDays,
        failedJobsDays,
        completedJobsCount,
        failedJobsCount,
      },
      ttl: {
        completedTTL: `${completedJobsDays} days`,
        failedTTL: `${failedJobsDays} days`,
        maxTTL: `${Math.max(completedJobsDays, failedJobsDays)} days`,
      },
    };
  }
}
