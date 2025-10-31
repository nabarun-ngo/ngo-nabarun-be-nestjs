import { Module, DynamicModule, Global } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { JobProcessingService } from './services/job-processing.service';
import { JobProcessorRegistry } from './services/job-processor-registry.service';
import { JobMonitoringService } from './services/job-monitoring.service';

export interface JobProcessingModuleOptions {
  connection: {
    url?: string;
    host?: string;
    port?: number;
    password?: string;
    db?: number;
  };
  defaultJobOptions?: {
    removeOnComplete?: { age?: number; count?: number } | number;
    removeOnFail?: { age?: number; count?: number } | number;
    attempts?: number;
    backoff?: { type: 'fixed' | 'exponential'; delay: number };
  };
  queues?: string[]; // queue names to register; defaults to ['default']
}

@Global()
@Module({})
export class JobProcessingModule {
  static forRoot(options: JobProcessingModuleOptions): DynamicModule {
    const queueNames =
      options.queues && options.queues.length > 0
        ? options.queues
        : ['default'];
    const queueConfigs = queueNames.map((name) => ({ name }));
    return {
      module: JobProcessingModule,
      imports: [
        BullModule.forRoot({
          connection: options.connection,
          defaultJobOptions: options.defaultJobOptions,
        }),
        BullModule.registerQueue(...queueConfigs),
      ],
      providers: [
        JobProcessingService,
        JobProcessorRegistry,
        JobMonitoringService,
      ],
      exports: [
        JobProcessingService,
        JobProcessorRegistry,
        JobMonitoringService,
      ],
    };
  }
}
