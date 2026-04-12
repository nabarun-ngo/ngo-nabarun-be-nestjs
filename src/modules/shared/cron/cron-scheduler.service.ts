// src/cron/cron-scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CronExpressionParser } from 'cron-parser';
import { CronJobDto, QueueDto, SchedulerLogDto } from './cron-job.dto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { CronJob } from './cron-job.model';
import { RemoteConfigService } from '../firebase/remote-config/remote-config.service';
import { parseKeyValueConfigs } from 'src/shared/utilities/kv-config.util';
import { CronLogStorageService } from './cron-log-storage.service';
import { RootEvent } from 'src/shared/models/root-event';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { JobProcessingService } from '../job-processing/services/job-processing.service';
import { JobName } from 'src/shared/job-names';

@Injectable()
export class CronSchedulerService {

    private readonly logger = new Logger(CronSchedulerService.name);
    constructor(
        private eventEmitter: EventEmitter2,
        private readonly firebasRC: RemoteConfigService,
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
        const CRON_JOBS = await this.fetchCronJobs();
        const triggerId = `T${generateUniqueNDigitNumber(4)}`;

        for (const job of CRON_JOBS) {
            if (this.shouldExecute(job.expression, now)) {
                const payload = new class extends RootEvent { }();
                if (job.inputData) {
                    Object.assign(payload, job.inputData);
                }
                const jobName = JobName[job.handler];
                if (!jobName) {
                    this.logger.error(`[CRON] Job ${job.name} not found`);
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
                this.logger.log(`[CRON] Skipped job: ${job.name} because schedule not matched`);
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
    async getScheduledJobs() {
        return (await this.fetchCronJobs()).filter(f => f.enabled).map(m => {
            return {
                name: m.name,
                description: m.description,
                handler: m.handler,
                enabled: m.enabled,
                nextRun: CronExpressionParser.parse(m.expression, { tz: 'Asia/Kolkata' }).next().toDate(),
            } as CronJobDto;
        });
    }

    /**
     * Get all cron logs
     */
    async getGlobalCronLogs(pageIndex: number | undefined, pageSize: number | undefined) {
        return await this.logStorage.getGlobalLogs(pageIndex, pageSize);
    }

    /**
     * Fetch all cron jobs from Firebase Remote Config
     */
    private async fetchCronJobs(): Promise<CronJob[]> {
        const config = await this.firebasRC.getAllKeyValues();
        const cronJobs = parseKeyValueConfigs(config['CRON_JOBS'].value);

        return cronJobs.map(m => {
            return {
                name: m.KEY,
                expression: m.VALUE,
                description: m.DESCRIPTION,
                handler: m.getAttribute('EVENT_NAME'),
                enabled: m.ACTIVE,
                inputData: m.getAttribute('INPUT_DATA') ? m.getAttribute('INPUT_DATA') : undefined
            } as CronJob;
        });
    }

    /**
     * Check if a cron expression should execute at the given time
     */
    private shouldExecute(expression: string, intendedTime: Date): boolean {
        try {
            // We shift the current date back by 1 minute to make the check inclusive
            // of the intendedTime itself, as CronExpressionParser.next() returns the next occurrence STRICTLY AFTER currentDate.
            const searchStart = new Date(intendedTime.getTime() - 60000);
            const interval = CronExpressionParser.parse(expression, {
                currentDate: searchStart,
                tz: 'Asia/Kolkata'
            });
            const nextRun = interval.next().toDate();

            // Allow a small window (60s) for matching to handle Cloud Scheduler jitter
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


    //#region All Methods under this is Deprecated

    /**
     * @deprecated We are using Job Processing Service for this
     * Run a specific cron job manually
     */
    async runScheduledJob(name: string) {
        const job = (await this.fetchCronJobs()).find(f => f.name === name);
        if (!job) {
            throw new BusinessException(`Job ${name} not found OR Not in active state`);
        }
        await this.runJob(job, 'MANUAL');
    }

    /**
     * @deprecated We are using Job Processing Service for this
     */
    private async runJob(job: CronJob, triggerType: "MANUAL" | "AUTOMATIC", triggerId?: string) {
        const startTime = new Date();
        const payload = new class extends RootEvent { }();
        const runId = `R${generateUniqueNDigitNumber(6)}`;
        const id = triggerId ? `${triggerId}-${runId}` : runId;
        try {
            // Bypass emitAsync because NestJS @OnEvent wrapper swallows errors (logging them as [Event] ERROR)
            // We fetch and execute listeners manually to ensure we catch exceptions.
            const listeners = this.eventEmitter.listeners(job.handler);

            this.logger.log(`Job ${job.name} (${triggerId}) Found ${listeners.length} listeners. Executing manually...`);
            const results: any[] = [];

            // Merge any existing input data into this instance
            if (job.inputData) {
                Object.assign(payload, job.inputData);
            }

            for (const listener of listeners) {
                const result = await (listener as Function).apply(this.eventEmitter, [payload]);
                results.push(result);
            }
            const errorResult = results.find(r => r instanceof Error);
            if (errorResult) {
                throw errorResult;
            }

            // Check if any result is a wrapped error object { __isError: true, error: ... }
            const wrappedError = results.find(r => r && r.__isError);
            if (wrappedError) {
                const err = wrappedError.error instanceof Error ? wrappedError.error : new Error(wrappedError.error?.message || 'Listener reported failure');
                throw err;
            }


            await this.logStorage.addLog({
                id,
                jobName: job.name,
                duration: new Date().getTime() - startTime.getTime(),
                executedAt: new Date(),
                trigger: triggerType,
                status: 'SUCCESS',
                result: results,
                executionLogs: payload.logs
            });
            return results;
        } catch (error) {
            this.logger.error(`Job ${job.name} FAILED: ${error.message}`, error.stack);

            await this.logStorage.addLog({
                id,
                jobName: job.name,
                duration: new Date().getTime() - startTime.getTime(),
                executedAt: new Date(),
                trigger: triggerType,
                status: 'FAILED',
                error: error.message || 'Unknown error',
                executionLogs: payload.logs
            });
            if (triggerType == 'MANUAL') {
                throw error;
            }
        }
    }

    /**
     * @deprecated We are using Job Processing Service for this
     */
    async getCronLogs(jobName: string, pageIndex?: number, pageSize?: number) {
        return await this.logStorage.getLogs(jobName, pageIndex, pageSize);
    }
    //#endregion

}