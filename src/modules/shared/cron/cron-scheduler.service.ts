// src/cron/cron-scheduler.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CronExpressionParser } from 'cron-parser';
import { CronJobDto } from './cron-job.dto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { CronJob } from './cron-job.model';
import { RemoteConfigService } from '../firebase/remote-config/remote-config.service';
import { parseKeyValueConfigs } from 'src/shared/utilities/kv-config.util';
import { CronLogStorageService } from './cron-log-storage.service';

@Injectable()
export class CronSchedulerService {
    private readonly logger = new Logger(CronSchedulerService.name);
    constructor(
        private eventEmitter: EventEmitter2,
        private readonly firebasRC: RemoteConfigService,
        private readonly logStorage: CronLogStorageService
    ) { }

    async triggerScheduledJobs(timestamp?: string): Promise<{ executed: string[], skipped: string[] }> {
        const now = timestamp ? new Date(timestamp) : new Date();
        const istTime = now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
        this.logger.log(`[CRON] Triggering scheduled jobs. Trigger DateTime: ${timestamp} -> Server DateTime: ${now.toISOString()} -> IST (interpreted): ${istTime}`);
        const executed: string[] = [];
        const skipped: string[] = [];
        const CRON_JOBS = await this.fetchCronJobs();

        for (const job of CRON_JOBS) {
            if (this.shouldExecute(job.expression, now)) {
                this.logger.log(`[CRON] Triggered job: ${job.name}`);
                executed.push(job.name);
                this.runJob(job, 'AUTOMATIC');
            } else {
                this.logger.log(`[CRON] Skipped job: ${job.name}`);
                skipped.push(job.name);
            }
        }

        await this.logStorage.addCronLog({
            triggerAt: new Date(),
            executedJobs: executed,
            skippedJobs: skipped
        });

        return { executed, skipped };
    }

    async fetchCronJobs(): Promise<CronJob[]> {
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

    async runScheduledJob(name: string) {
        const job = (await this.fetchCronJobs()).find(f => f.name === name);
        if (!job) {
            throw new BusinessException(`Job ${name} not found OR Not in active state`);
        }
        await this.runJob(job, 'MANUAL');
    }

    async getCronLogs(jobName: string) {
        return await this.logStorage.getLogs(jobName);
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

    private async runJob(job: CronJob, triggerType: "MANUAL" | "AUTOMATIC") {
        const startTime = new Date();

        try {
            // Bypass emitAsync because NestJS @OnEvent wrapper swallows errors (logging them as [Event] ERROR)
            // We fetch and execute listeners manually to ensure we catch exceptions.
            const listeners = this.eventEmitter.listeners(job.handler);
            const payload = job.inputData || {};

            this.logger.log(`Job ${job.name}: Found ${listeners.length} listeners. Executing manually...`);

            const results: any[] = [];

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
                jobName: job.name,
                duration: new Date().getTime() - startTime.getTime(),
                executedAt: new Date(),
                trigger: triggerType,
                status: 'SUCCESS',
                result: results
            });
            return results;
        } catch (error) {
            this.logger.error(`Job ${job.name} FAILED: ${error.message}`, error.stack);

            await this.logStorage.addLog({
                jobName: job.name,
                duration: new Date().getTime() - startTime.getTime(),
                executedAt: new Date(),
                trigger: triggerType,
                status: 'FAILED',
                error: error.message || 'Unknown error'
            });
            if (triggerType == 'MANUAL') {
                throw error;
            }
        }
    }

}