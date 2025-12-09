import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JobProcessingService } from '../services/job-processing.service';
import { JobMonitoringService } from '../services/job-monitoring.service';

@ApiTags(JobMonitoringController.name)
@Controller('jobs')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class JobMonitoringController {
  constructor(
    private readonly jobProcessingService: JobProcessingService,
    private readonly jobMonitoringService: JobMonitoringService,
  ) { }

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

  @Post('queue/:operation')
  @ApiOperation({ summary: 'Pause the queue' })
  @ApiResponse({ status: 200, description: 'Queue paused successfully' })
  async pauseQueue(@Param('operation') operation: string) {
    switch (operation) {
      case 'pause':
        await this.jobProcessingService.pauseQueue();
        break;
      case 'resume':
        await this.jobProcessingService.resumeQueue();
        break;
      default:
        throw new Error('Invalid operation');
    }
    return { message: 'Queue paused successfully' };
  }


  @Delete(':jobId')
  @ApiOperation({ summary: 'Remove a job' })
  @ApiParam({ name: 'jobId', description: 'ID of the job to remove' })
  @ApiResponse({ status: 200, description: 'Job removed successfully' })
  async removeJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.removeJob(jobId);
    return { message: `Job '${jobId}' removed successfully` };
  }

  @Post('retry/:jobId')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'jobId', description: 'ID of the failed job to retry' })
  @ApiResponse({ status: 200, description: 'Job queued for retry successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'Job is not in failed state' })
  async retryJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.retryJob(jobId);
    return {
      message: `Job '${jobId}' has been queued for retry`,
      jobId,
    };
  }

  @Post('retry-all-failed')
  @ApiOperation({ summary: 'Retry all failed jobs' })
  @ApiResponse({ status: 200, description: 'All failed jobs queued for retry' })
  async retryAllFailedJobs() {
    const result = await this.jobProcessingService.retryAllFailedJobs();
    return {
      message: `Retry operation complete`,
      retriedCount: result.retriedCount,
      failedCount: result.failedCount,
      total: result.retriedCount + result.failedCount,
    };
  }


}
