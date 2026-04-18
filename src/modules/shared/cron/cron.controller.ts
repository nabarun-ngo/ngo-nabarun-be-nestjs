// src/cron/cron.controller.ts
import { Controller, Post, Headers, Param, Get, Query, Body } from '@nestjs/common';
import { CronSchedulerService } from './cron-scheduler.service';
import { ApiBearerAuth, ApiBody, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { UseApiKey } from '../auth/application/decorators/use-api-key.decorator';
import { SuccessResponse } from 'src/shared/models/response-model';
import { ApiAutoPagedResponse, ApiAutoResponse } from 'src/shared/decorators/api-auto-response.decorator';
import { CronExecutionDto, CronJobDto, SchedulerLogDto } from './cron-job.dto';
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

    @Get('jobs')
    @RequirePermissions('read:cron')
    @ApiAutoResponse(CronJobDto, { description: 'OK', wrapInSuccessResponse: true, isArray: true })
    async getScheduledJobs() {
        return new SuccessResponse(
            await this.schedulerService.getScheduledJobs()
        );
    }

    @Get('trigger-logs')
    @RequirePermissions('read:cron')
    @ApiQuery({ name: 'pageIndex', required: false, type: Number })
    @ApiQuery({ name: 'pageSize', required: false, type: Number })
    @ApiAutoPagedResponse(SchedulerLogDto, { description: 'OK', wrapInSuccessResponse: true, isArray: true })
    async getTriggerLogs(
        @Query('pageIndex') pageIndex?: number,
        @Query('pageSize') pageSize?: number
    ) {
        return new SuccessResponse(
            await this.schedulerService.getGlobalCronTriggerLogs(pageIndex, pageSize)
        );
    }

    //#region Deprecated Methods
    /**
     * @deprecated We are using Job Processing Service for this
     * @param name 
     * @returns 
     */
    @Post('run/:name')
    @RequirePermissions('update:cron')
    @ApiAutoResponse(String, { description: 'OK', wrapInSuccessResponse: true })
    @ApiBody({ type: Object })
    async runScheduledJob(@Param('name') name: string, @Body() body: Record<string, any>) {
        await this.schedulerService.runScheduledJob(name, body)
        return new SuccessResponse('Job executed successfully');
    }

    // /**
    //  * @deprecated We are using Job Processing Service for this
    //  * @param name 
    //  * @param pageIndex 
    //  * @param pageSize 
    //  * @returns 
    //  */
    // @Get('executions/:name')
    // @RequirePermissions('read:cron')
    // @ApiQuery({ name: 'pageIndex', required: false, type: Number })
    // @ApiQuery({ name: 'pageSize', required: false, type: Number })
    // @ApiAutoPagedResponse(CronExecutionDto, { description: 'OK', wrapInSuccessResponse: true, isArray: true })
    // async getCronLogs(@Param('name') name: string,
    //     @Query('pageIndex') pageIndex?: number,
    //     @Query('pageSize') pageSize?: number) {
    //     return new SuccessResponse(
    //         await this.schedulerService.getCronLogs(name, pageIndex, pageSize)
    //     );
    // }
    //#endregion
}