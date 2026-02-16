// src/cron/cron.controller.ts
import { Controller, Post, Headers, Param, Get } from '@nestjs/common';
import { CronSchedulerService } from './cron-scheduler.service';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UseApiKey } from '../auth/application/decorators/use-api-key.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { CronJobDto } from './cron-job.dto';
import { RequirePermissions } from '../auth/application/decorators/require-permissions.decorator';

@ApiTags(CronController.name)
@Controller('cron')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
export class CronController {
    constructor(private schedulerService: CronSchedulerService) { }

    @Post('trigger')
    @UseApiKey()
    @RequirePermissions('update:cron')
    async executeCron(
        @Headers('x-cloudscheduler-scheduletime') scheduleTime?: string, // ISO 8601 format
    ) {
        return new SuccessResponse(
            await this.schedulerService.triggerScheduledJobs(scheduleTime)
        );
    }

    @Post('run/:name')
    @RequirePermissions('update:cron')
    @ApiAutoResponse(SuccessResponse, { description: 'OK', wrapInSuccessResponse: true })
    async runScheduledJob(@Param('name') name: string) {
        await this.schedulerService.runScheduledJob(name)
        return new SuccessResponse();
    }

    @Get('jobs')
    @RequirePermissions('read:cron')
    @ApiAutoResponse(CronJobDto, { description: 'OK', wrapInSuccessResponse: true, isArray: true })
    async getScheduledJobs() {
        return new SuccessResponse(
            await this.schedulerService.getScheduledJobs()
        );
    }
    @Get('logs/:name')
    @RequirePermissions('read:cron')
    @ApiAutoResponse(SuccessResponse, { description: 'OK', wrapInSuccessResponse: true, isArray: true })
    async getCronLogs(@Param('name') name: string) {
        return new SuccessResponse(
            await this.schedulerService.getCronLogs(name)
        );
    }
}