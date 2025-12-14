import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JobProcessingService } from '../services/job-processing.service';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { JobDetail } from '../interfaces/job.interface';

@ApiTags(JobController.name)
@Controller('jobs')
@ApiBearerAuth('jwt') // Matches the 'jwt' security definition from main.ts
export class JobController {
  constructor(
    private readonly jobProcessingService: JobProcessingService,
    private readonly jobMonitoringService: JobMonitoringService,
  ) { }

  @Get()
  @ApiOperation({ summary: 'Get failed jobs' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of failed jobs to return' })
  @ApiQuery({ name: 'status', required: true, description: 'Status of the failed jobs to return' })
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Failed jobs retrieved successfully', isArray: true, wrapInSuccessResponse: true })
  async getJobs(
    @Query('status') status: 'completed' | 'failed',
    @Query('limit') limit?: number) {
    return new SuccessResponse(
      await this.jobMonitoringService.getJobs(status, limit)
    );
  }

  @Get('details/:jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'jobId', description: 'ID of the job' })
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Job details retrieved successfully', isArray: false, wrapInSuccessResponse: true })
  async getJobDetails(@Param('jobId') jobId: string) {
    return new SuccessResponse(
      await this.jobMonitoringService.getJobDetails(jobId)
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics retrieved successfully' })
  async getQueueStatistics() {
    return new SuccessResponse(
      await this.jobMonitoringService.getQueueStatistics()
    );
  }


  @Post('clean')
  @ApiOperation({ summary: 'Clean old jobs (manual cleanup - TTL handles automatic cleanup)' })
  @ApiResponse({ status: 200, description: 'Jobs cleaned successfully' })
  async cleanOldJobs(@Body() options: { completed?: number; failed?: number; age?: number }) {
    return new SuccessResponse(
      await this.jobMonitoringService.cleanOldJobs(options)
    );
  }

  @Post('queue/:operation')
  @ApiOperation({ summary: 'Pause the queue' })
  @ApiResponse({ status: 200, description: 'Options : pause, resume' })
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
    return new SuccessResponse({ message: 'Queue paused successfully' });
  }


  @Delete(':jobId')
  @ApiOperation({ summary: 'Remove a job' })
  @ApiParam({ name: 'jobId', description: 'ID of the job to remove' })
  @ApiResponse({ status: 200, description: 'Job removed successfully' })
  async removeJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.removeJob(jobId);
    return new SuccessResponse({ message: `Job '${jobId}' removed successfully` });
  }

  @Post('retry/:jobId')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'jobId', description: 'ID of the failed job to retry' })
  @ApiResponse({ status: 200, description: 'Job queued for retry successfully' })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 400, description: 'Job is not in failed state' })
  async retryJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.retryJob(jobId);
    return new SuccessResponse({
      message: `Job '${jobId}' has been queued for retry`,
      jobId,
    });
  }

  @Post('retry-all-failed')
  @ApiOperation({ summary: 'Retry all failed jobs' })
  @ApiResponse({ status: 200, description: 'All failed jobs queued for retry' })
  async retryAllFailedJobs() {
    const result = await this.jobProcessingService.retryAllFailedJobs();
    return new SuccessResponse({
      message: `Retry operation complete`,
      retriedCount: result.retriedCount,
      failedCount: result.failedCount,
      total: result.retriedCount + result.failedCount,
    });
  }


}
