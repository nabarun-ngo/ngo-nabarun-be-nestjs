import { Injectable } from '@nestjs/common';
import { CronExecutionLog } from './cron-job.model';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { RedisHashCacheService } from '../database/redis-hash-cache.service';

@Injectable()
export class CronLogStorageService {
    private readonly logger = new CronLogger(CronLogStorageService.name);
    private readonly LOG_PREFIX = 'cron:logs';
    private readonly LOG_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

    constructor(private readonly redisService: RedisHashCacheService) { }

    async getLogs(jobName: string): Promise<CronExecutionLog[]> {
        try {
            return await this.redisService.getList<CronExecutionLog>(this.LOG_PREFIX, jobName);
        } catch (error) {
            this.logger.error(`Failed to retrieve cached logs for ${jobName}: ${error.stack}`);
            return [];
        }
    }

    async addLog(log: CronExecutionLog) {
        try {
            await this.redisService.pushToList(
                this.LOG_PREFIX,
                log.jobName,
                log,
                100, // Max 100 logs
                this.LOG_TTL
            );
        } catch (error) {
            this.logger.error(`Failed to cache cron log for ${log.jobName}: ${error.stack}`, error.stack);
        }
    }

    async addCronLog(log: { triggerAt: Date; executedJobs: string[]; skippedJobs: string[]; }) {
        try {
            await this.redisService.pushToList(
                this.LOG_PREFIX,
                'global',
                { ...log, triggerAt: log.triggerAt.toISOString() },
                100, // Keep last 100 execution summaries
                this.LOG_TTL
            );
        } catch (error) {
            this.logger.error(`Failed to cache global cron log: ${error.stack}`, error.stack);
        }
    }

    async getGlobalLogs(): Promise<{ triggerAt: string; executedJobs: string[]; skippedJobs: string[]; }[]> {
        try {
            return await this.redisService.getList(this.LOG_PREFIX, 'global');
        } catch (error) {
            this.logger.error(`Failed to retrieve global cron logs: ${error.stack}`);
            return [];
        }
    }
}
