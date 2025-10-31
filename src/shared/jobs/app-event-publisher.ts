import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AppEventPublisher {
  private readonly logger = new Logger(AppEventPublisher.name);

  constructor(
    @InjectQueue('job') private readonly jobQueue: Queue,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async publishEvent<T>(
    name: string,
    data: T,
    options?: { processMode?: 'job_queue' | 'async_event' | 'sync_event' },
  ): Promise<void> {
    const mode = options?.processMode ?? 'job_queue';

    switch (mode) {
      case 'job_queue':
        await this.enqueueJob(name, data);
        break;

      case 'async_event':
        await this.emitAsyncEvent(name, data);
        break;

      case 'sync_event':
        this.emitSyncEvent(name, data);
        break;
    }
  }

  private async enqueueJob<T>(name: string, data: T): Promise<void> {
    await this.jobQueue.add(name, data, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: {
        age: 7 * 24 * 60 * 60,
      },
      removeOnFail: { age: 30 * 24 * 60 * 60 },
    });
    this.logger.log(`Queued job: ${name}`);
  }

  private async emitAsyncEvent<T>(name: string, data: T): Promise<void> {
    await this.eventEmitter.emitAsync(name, data);
    this.logger.log(`Async event emitted: ${name}`);
  }

  private emitSyncEvent<T>(name: string, data: T): void {
    this.eventEmitter.emit(name, data);
    this.logger.log(`Sync event emitted: ${name}`);
  }
}
