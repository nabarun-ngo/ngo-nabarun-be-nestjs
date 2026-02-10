import { Inject, Injectable } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { CronExecutionLog } from './cron-job.model';
import { CronLogger } from 'src/shared/utils/trace-context.util';

@Injectable()
export class CronLogStorageService {
    private readonly logger = new CronLogger(CronLogStorageService.name);
    private readonly CRON_LOGS_CACHE_PREFIX = 'cron:logs:';
    private readonly CRON_LOGS_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    async getLogs(jobName: string): Promise<CronExecutionLog[]> {
        const key = `${this.CRON_LOGS_CACHE_PREFIX}${jobName}`;
        try {
            return await this.cacheManager.get<CronExecutionLog[]>(key) || [];
        } catch (error) {
            this.logger.error(`Failed to retrieve cached logs for ${jobName}: ${error.stack}`);
            return [];
        }
    }

    async addLog(log: CronExecutionLog) {
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
}
