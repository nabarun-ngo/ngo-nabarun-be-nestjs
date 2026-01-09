// src/cron/cron-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { CronExpressionParser } from 'cron-parser';
import { CronJobDto } from './cron-job.dto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { CronJob } from './cron-job.model';
import { RemoteConfigService } from '../firebase/remote-config/remote-config.service';
import { parseKeyValueConfigs } from 'src/shared/utilities/kv-config.util';

@Injectable()
export class CronSchedulerService {
    private readonly logger = new CronLogger(CronSchedulerService.name);

    constructor(private eventEmitter: EventEmitter2,
        private readonly firebasRC: RemoteConfigService,
    ) { }

    async triggerScheduledJobs(timestamp?: string): Promise<{ executed: string[], skipped: string[] }> {
        this.logger.log(`[CRON] Triggering scheduled jobs at ${timestamp}`);
        const now = timestamp ? new Date(timestamp) : new Date();
        const executed: string[] = [];
        const skipped: string[] = [];
        const CRON_JOBS = await this.fetchCronJobs();

        for (const job of CRON_JOBS) {
            if (this.shouldExecute(job.expression, now)) {
                this.logger.log(`Triggered job: ${job.name}`);
                this.eventEmitter.emit(job.handler);
                executed.push(job.name);
            } else {
                this.logger.log(`Skipped job: ${job.name}`);
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
                nextRun: CronExpressionParser.parse(m.expression).next().toDate()
            } as CronJobDto;
        });
    }

    async runScheduledJob(name: string) {
        const job = (await this.getScheduledJobs()).find(f => f.name === name);
        if (!job) {
            throw new BusinessException(`Job ${name} not found OR Not in active state`);
        }
        return await this.eventEmitter.emitAsync(job.handler);
    }

    /**
   * Check if a cron expression should execute at the given time
   */
    private shouldExecute(expression: string, intendedTime: Date): boolean {
        try {
            const interval = CronExpressionParser.parse(expression, {
                //currentDate: new Date(intendedTime.getTime() - 60000), // Start from 1 min before
                //endDate: new Date(intendedTime.getTime() + 60000), // End 1 min after,
                tz: 'Asia/Kolkata'
            });
            // Check if intended time falls within the next execution window
            const nextRun = interval.next().toDate();
            console.log(expression, nextRun);
            const diffMs = Math.abs(nextRun.getTime() - intendedTime.getTime());

            // If within 30 seconds, consider it a match
            if (diffMs < 30000) {
                return true;
            }
            return false;
        } catch (error) {
            this.logger.error(`Invalid cron expression: ${expression} ${error.stack}`);
            return false;
        }
    }
}