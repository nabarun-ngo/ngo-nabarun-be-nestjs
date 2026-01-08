// src/cron/cron.controller.ts
import { Controller, Post, Headers, Param, Get } from '@nestjs/common';
import { CronSchedulerService } from './cron-scheduler.service';
import { ApiBearerAuth, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UseApiKey } from '../auth/application/decorators/use-api-key.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';

@ApiTags(CronController.name)
@Controller('cron')
@ApiSecurity('api-key')
@ApiBearerAuth('jwt')
export class CronController {
    constructor(private schedulerService: CronSchedulerService) { }

    @Post('trigger')
    @UseApiKey()
    async executeCron(
        @Headers('x-cloudscheduler-scheduletime') scheduleTime?: string, // ISO 8601 format
    ) {
        return new SuccessResponse(
            await this.schedulerService.triggerScheduledJobs(scheduleTime)
        );
    }

    @Post('run/:name')
    async runScheduledJob(@Param('name') name: string) {
        return new SuccessResponse(
            await this.schedulerService.runScheduledJob(name)
        );
    }

    @Get('jobs')
    async getScheduledJobs() {
        return new SuccessResponse(
            await this.schedulerService.getScheduledJobs()
        );
    }


}