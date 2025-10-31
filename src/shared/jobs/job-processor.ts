import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { JOB_HANDLER_METADATA } from './job-handler.decorator';
import { IJobHandler } from './job-handler.interface';
import { getMetadata } from '../util/metadata.util';

@Processor('job')
@Injectable()
export class DynamicJobProcessor extends WorkerHost implements OnModuleInit {
  private readonly logger = new Logger(DynamicJobProcessor.name);
  private readonly handlers = new Map<string, IJobHandler>();

  constructor(private readonly discovery: DiscoveryService) {
    super();
  }

  onModuleInit() {
    const providers = this.discovery.getProviders();

    for (const wrapper of providers) {
      const instance = (wrapper as { instance?: unknown }).instance;
      if (!instance) continue;

      const jobName = getMetadata<string>(
        JOB_HANDLER_METADATA,
        (instance as Record<string, unknown>).constructor,
      );
      if (jobName) {
        this.handlers.set(jobName, instance as IJobHandler);
        this.logger.log(`✅ Registered Job Handler: ${jobName}`);
      }
    }
  }

  async process(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);

    if (!handler) {
      this.logger.warn(`⚠️ No handler found for job: ${job.name}`);
      return;
    }

    try {
      await handler.handle(job.data);
      this.logger.log(`✅ Job completed: ${job.name}`);
    } catch (err) {
      this.logger.error(`❌ Job failed: ${job.name}`, err);
      throw err;
    }
  }
}
