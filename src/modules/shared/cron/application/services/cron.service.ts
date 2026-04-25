import { Injectable, Logger } from '@nestjs/common';
import { CronExpressionParser } from 'cron-parser';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { JobName } from 'src/shared/job-names';
import { CronConfigService } from '../../infrastructure/services/cron-config.service';
import { CronLogStorageService } from '../../infrastructure/services/cron-log-storage.service';
import { CronJobDto, QueueDto, SchedulerLogDto } from '../../presentation/dtos/cron-job.dto';
import { JobProcessingService } from 'src/modules/shared/job-processing/infrastructure/services/job-processing.service';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);

    constructor(
        private readonly cronConfig: CronConfigService,
        private readonly logStorage: CronLogStorageService,
        private readonly jobProcessingService: JobProcessingService
    ) { }

    /**
     * Trigger all scheduled jobs
     */
    async triggerScheduledJobs(timestamp?: string): Promise<SchedulerLogDto> {
        const now = timestamp ? new Date(timestamp) : new Date();
        const istTime = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        this.logger.log(`[CRON] Triggering scheduled jobs. Trigger DateTime: ${timestamp} -> Server DateTime: ${now.toISOString()} -> IST (interpreted): ${istTime}`);

        const executed: QueueDto[] = [];
        const skipped: QueueDto[] = [];
        const CRON_JOBS = await this.cronConfig.fetchCronJobs();
        const triggerId = `T${generateUniqueNDigitNumber(4)}`;

        for (const job of CRON_JOBS) {
            if (this.shouldExecute(job.expression, now)) {
                let payload: any = {};
                if (job.inputData) {
                    Object.assign(payload, job.inputData);
                }
                const jobName = this.resolveJobName(job.handler);
                if (!jobName) {
                    this.logger.error(`[CRON] Job ${job.name} (handler: ${job.handler}) not found in JobName registry`);
                    skipped.push({
                        jobName: job.name,
                        remarks: 'JOB_NOT_FOUND'
                    });
                    continue;
                }
                const jobQueue = await this.jobProcessingService.addJob(jobName, payload);
                this.logger.log(`[CRON] Triggered job: ${job.name} with ID: ${jobQueue.id}`);
                executed.push({
                    jobName: job.name,
                    id: jobQueue.id
                });
            } else {
                this.logger.debug(`[CRON] Skipped job: ${job.name} because schedule not matched`);
                skipped.push({
                    jobName: job.name,
                    remarks: 'SCHEDULE_NOT_MATCHED'
                });
            }
        }
        const triggerAt = new Date();
        await this.logStorage.addCronLog({
            triggerId: triggerId,
            triggerAt: triggerAt,
            executedJobs: executed,
            skippedJobs: skipped
        });

        return {
            triggerId,
            triggerAt,
            executedJobs: executed,
            skippedJobs: skipped
        };
    }

    /**
     * Get all scheduled jobs
     */
    async getScheduledJobs(): Promise<CronJobDto[]> {
        return (await this.cronConfig.fetchCronJobs())
            .filter(f => f.enabled)
            .map(m => {
                return {
                    name: m.name,
                    description: m.description,
                    handler: m.handler,
                    enabled: m.enabled,
                    nextRun: CronExpressionParser.parse(m.expression, { tz: 'Asia/Kolkata' }).next().toDate(),
                    inputData: m.inputData
                } as CronJobDto;
            });
    }

    /**
     * Get all cron logs
     */
    async getGlobalCronTriggerLogs(pageIndex: number | undefined, pageSize: number | undefined) {
        return await this.logStorage.getGlobalLogs(pageIndex, pageSize);
    }

    /**
     * Run a specific cron job manually
     */
    async runScheduledJob(name: string, inputData?: any) {
        const job = (await this.cronConfig.fetchCronJobs()).find(f => f.name === name);
        if (!job) {
            throw new BusinessException(`Job ${name} not found OR Not in active state`);
        }
        const jobName = this.resolveJobName(job.handler);
        if (!jobName) {
            throw new BusinessException(`Job ${name} has an invalid handler: ${job.handler}`);
        }
        const jobQueue = await this.jobProcessingService.addJob(jobName, inputData ?? job.inputData);
        this.logger.log(`[CRON] Triggered job: ${job.name} with ID: ${jobQueue.id}`);
        const triggerId = `MT${generateUniqueNDigitNumber(4)}`;
        await this.logStorage.addCronLog({
            triggerId: triggerId,
            triggerAt: new Date(),
            executedJobs: [{
                jobName: job.name,
                id: jobQueue.id
            }],
            skippedJobs: []
        });
        return jobQueue.id;
    }

    /**
     * Check if a cron expression should execute at the given time
     */
    private shouldExecute(expression: string, intendedTime: Date): boolean {
        try {
            const searchStart = new Date(intendedTime.getTime() - 60000);
            const interval = CronExpressionParser.parse(expression, {
                currentDate: searchStart,
                tz: 'Asia/Kolkata'
            });
            const nextRun = interval.next().toDate();

            const diffSeconds = Math.abs(nextRun.getTime() - intendedTime.getTime()) / 1000;
            const match = diffSeconds < 60;

            this.logger.debug(
                `[CRON] Evaluating: "${expression}". ` +
                `Next scheduled: ${nextRun.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST. ` +
                `Trigger time: ${intendedTime.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })} IST. ` +
                `Diff: ${diffSeconds.toFixed(1)}s. Match: ${match}`
            );

            return match;
        } catch (error) {
            this.logger.error(`Invalid cron expression: ${expression} ${error.stack}`);
            return false;
        }
    }

    /**
     * Resolve JobName from either key or value
     */
    private resolveJobName(handler: string): JobName | undefined {
        // 1. Try treating it as a value
        if (Object.values(JobName).includes(handler as JobName)) {
            return handler as JobName;
        }
        // 2. Try treating it as a key
        return JobName[handler as keyof typeof JobName];
    }
}
