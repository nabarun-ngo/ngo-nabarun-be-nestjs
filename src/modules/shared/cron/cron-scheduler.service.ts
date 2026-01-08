// src/cron/cron-scheduler.service.ts
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CRON_JOBS } from 'src/config/cron.config';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { CronExpressionParser } from 'cron-parser';
import { CronJobDto } from './cron-job.dto';

@Injectable()
export class CronSchedulerService {
    private readonly logger = new CronLogger(CronSchedulerService.name);

    constructor(private eventEmitter: EventEmitter2) { }

    async triggerScheduledJobs(timestamp?: string): Promise<{ executed: string[], skipped: string[] }> {
        const now = timestamp ? new Date(timestamp) : new Date();
        const executed: string[] = [];
        const skipped: string[] = [];

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

    async getScheduledJobs() {
        return CRON_JOBS.filter(f => f.enabled).map(m => {
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
        const job = CRON_JOBS.find(f => f.name === name);
        if (!job) {
            throw new Error(`Job ${name} not found`);
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