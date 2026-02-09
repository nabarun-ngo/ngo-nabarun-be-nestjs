// src/cron/cron-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { CronExpressionParser } from 'cron-parser';
import { CronJobDto } from './cron-job.dto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { CronJob, CronExecutionLog } from './cron-job.model';
import { RemoteConfigService } from '../firebase/remote-config/remote-config.service';
import { parseKeyValueConfigs } from 'src/shared/utilities/kv-config.util';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';

@Injectable()
export class CronSchedulerService {
    private readonly logger = new CronLogger(CronSchedulerService.name);
    private readonly CRON_LOGS_CACHE_PREFIX = 'cron:logs:';
    private readonly CRON_LOGS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    constructor(
        private eventEmitter: EventEmitter2,
        private readonly firebasRC: RemoteConfigService,
        @Inject(CACHE_MANAGER) private cacheManager: Cache
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
                try {
                    await this.eventEmitter.emitAsync(job.handler);
                    await this.addLog({
                        jobName: job.name,
                        executedAt: new Date(),
                        trigger: 'AUTOMATIC',
                        status: 'SUCCESS'
                    });
                } catch (error) {
                    await this.addLog({
                        jobName: job.name,
                        executedAt: new Date(),
                        trigger: 'AUTOMATIC',
                        status: 'FAILED',
                        error: error.message
                    });
                }
            } else {
                this.logger.log(`[CRON] Skipped job: ${job.name}`);
                skipped.push(job.name);
            }
        }

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
                nextRun: CronExpressionParser.parse(m.expression, { tz: 'Asia/Kolkata' }).next().toDate()
            } as CronJobDto;
        });
    }

    async runScheduledJob(name: string) {
        const job = (await this.getScheduledJobs()).find(f => f.name === name);
        if (!job) {
            throw new BusinessException(`Job ${name} not found OR Not in active state`);
        }
        try {
            const results = await this.eventEmitter.emitAsync(job.handler);
            await this.addLog({
                jobName: job.name,
                executedAt: new Date(),
                trigger: 'MANUAL',
                status: 'SUCCESS'
            });
            return results;
        } catch (error) {
            await this.addLog({
                jobName: job.name,
                executedAt: new Date(),
                trigger: 'MANUAL',
                status: 'FAILED',
                error: error.message
            });
            throw error;
        }
    }

    async getCronLogs(jobName: string): Promise<CronExecutionLog[]> {
        const key = `${this.CRON_LOGS_CACHE_PREFIX}${jobName}`;
        return await this.cacheManager.get<CronExecutionLog[]>(key) || [];
    }

    private async addLog(log: CronExecutionLog) {
        try {
            const key = `${this.CRON_LOGS_CACHE_PREFIX}${log.jobName}`;
            const existingLogs = await this.cacheManager.get<CronExecutionLog[]>(key) || [];

            // Keep only logs from the last 7 days and limit to last 100 entries to avoid cache bloat
            const sevenDaysAgo = Date.now() - this.CRON_LOGS_TTL;
            const filteredLogs = existingLogs.filter(l => new Date(l.executedAt).getTime() > sevenDaysAgo);

            filteredLogs.unshift(log); // Add new log to the beginning

            // Limit to 100 logs per job
            const limitedLogs = filteredLogs.slice(0, 100);

            await this.cacheManager.set(key, limitedLogs, this.CRON_LOGS_TTL);
        } catch (error) {
            this.logger.error(`Failed to cache cron log for ${log.jobName}: ${error.stack}`);
        }
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

            this.logger.log(
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
}