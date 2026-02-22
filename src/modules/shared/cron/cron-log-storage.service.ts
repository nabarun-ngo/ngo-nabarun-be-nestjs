import { Injectable } from '@nestjs/common';
import { CronExecution } from './cron-job.model';
import { PageResult, RedisStoreService } from '../database/redis-store.service';
@Injectable()
export class CronLogStorageService {
    private readonly NS = 'cron:jobs';
    private readonly GLOBAL_KEY = 'global';
    private readonly INDEXED_FIELDS: (keyof CronExecution)[] = ['status', 'id', 'jobName'];


    constructor(private readonly store: RedisStoreService) { }

    // Execution logs — stored as bounded list on the job's hash key
    async addLog(log: CronExecution): Promise<void> {
        await this.store.save(this.NS, log, {
            indexes: this.INDEXED_FIELDS
        });
    }

    async getLogs(jobName?: string): Promise<PageResult<CronExecution>> {
        return this.store.findAll(this.NS, {
            filter: jobName ? { field: 'jobName', value: jobName } : undefined,
            sortBy: 'desc'
        });
    }

    async getLog(id: string): Promise<CronExecution | null> {
        return await this.store.findById(this.NS, id);
    }

    // Global execution summaries
    async addCronLog(log: { triggerAt: Date; executedJobs: string[]; skippedJobs: string[] }): Promise<void> {
        await this.store.pushToTimeline(this.NS, this.GLOBAL_KEY, {
            ...log,
            triggerAt: log.triggerAt.toISOString(),
        });
    }

    async getGlobalLogs() {
        return this.store.getTimeline(this.NS, this.GLOBAL_KEY);
    }
}