import { Controller, Get, Post, Param, Query, Body, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JobProcessingService } from '../services/job-processing.service';
import { JobMonitoringService } from '../services/job-monitoring.service';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { RequirePermissions } from '../../auth/application/decorators/require-permissions.decorator';
import { JobDetail } from '../dto/job.dto';
import { PagedResult } from 'src/shared/models/paged-result';

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
  @ApiQuery({ name: 'pageIndex', required: true, description: 'Page index of the failed jobs to return' })
  @ApiQuery({ name: 'pageSize', required: true, description: 'Page size of the failed jobs to return' })
  @ApiQuery({
    name: 'status', required: true, description: 'Status of the failed jobs to return',
    enum: ['completed', 'failed', 'paused', 'delayed', 'paused', 'active']
  })
  @ApiQuery({ name: 'name', required: false, description: 'Name of the failed jobs to return' })
  @RequirePermissions('read:jobs')
  @ApiAutoPagedResponse(JobDetail, { status: 200, description: 'Failed jobs retrieved successfully', isArray: true, wrapInSuccessResponse: true })
  async getJobs(
    @Query('pageIndex') pageIndex: number,
    @Query('pageSize') pageSize: number,
    @Query('status') status: 'completed' | 'failed' | 'paused' | 'delayed' | 'paused' | 'active',
    @Query('name') name?: string) {
    const result = await this.jobMonitoringService.getJobs(pageIndex, pageSize, { status, name });
    return new SuccessResponse(
      result
    );
  }

  @Get('details/:jobId')
  @ApiOperation({ summary: 'Get job details by ID' })
  @ApiParam({ name: 'jobId', description: 'ID of the job' })
  @RequirePermissions('read:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Job details retrieved successfully', isArray: false, wrapInSuccessResponse: true })
  async getJobDetails(@Param('jobId') jobId: string) {
    return new SuccessResponse(
      await this.jobMonitoringService.getJobDetails(jobId)
    );
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Get comprehensive queue statistics' })
  @RequirePermissions('read:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Queue statistics retrieved successfully', isArray: false, wrapInSuccessResponse: true })
  async getQueueStatistics() {
    return new SuccessResponse(
      await this.jobMonitoringService.getQueueStatistics()
    );
  }


  @Post('clean')
  @ApiOperation({ summary: 'Clean old jobs (manual cleanup - TTL handles automatic cleanup)' })
  @RequirePermissions('delete:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Jobs cleaned successfully', isArray: false, wrapInSuccessResponse: true })
  async cleanOldJobs(@Body() options: { completed?: number; failed?: number; age?: number }) {
    return new SuccessResponse(
      await this.jobMonitoringService.cleanOldJobs(options)
    );
  }

  @Post('queue/:operation')
  @ApiOperation({ summary: 'Pause the queue' })
  @RequirePermissions('update:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Options : pause, resume', isArray: false, wrapInSuccessResponse: true })
  @ApiParam({ name: 'operation', required: true, description: 'Operation to trigger', enum: ['pause', 'resume'] })
  async pauseQueue(@Param('operation') operation: string) {
    console.log(operation)
    switch (operation) {
      case 'pause':
        await this.jobProcessingService.pauseQueue();
        break;
      case 'resume':
        await this.jobProcessingService.resumeQueue();
        break;
      default:
        throw new BusinessException('Invalid operation');
    }
    return new SuccessResponse({ message: 'Queue paused successfully' });
  }


  @Delete(':jobId')
  @ApiOperation({ summary: 'Remove a job' })
  @ApiParam({ name: 'jobId', description: 'ID of the job to remove' })
  @RequirePermissions('delete:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Job removed successfully', isArray: false, wrapInSuccessResponse: true })
  async removeJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.removeJob(jobId);
    return new SuccessResponse({ message: `Job '${jobId}' removed successfully` });
  }

  @Post('retry/:jobId')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiParam({ name: 'jobId', description: 'ID of the failed job to retry' })
  @RequirePermissions('update:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'Job queued for retry successfully', isArray: false, wrapInSuccessResponse: true })
  async retryJob(@Param('jobId') jobId: string) {
    await this.jobProcessingService.retryJob(jobId);
    return new SuccessResponse({
      message: `Job '${jobId}' has been queued for retry`,
      jobId,
    });
  }

  @Post('retry-all-failed')
  @ApiOperation({ summary: 'Retry all failed jobs' })
  @RequirePermissions('update:jobs')
  @ApiAutoResponse(JobDetail, { status: 200, description: 'All failed jobs queued for retry', isArray: false, wrapInSuccessResponse: true })
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
