import { SetMetadata } from '@nestjs/common';

export const PROCESS_JOB_KEY = 'process_job';

export interface ProcessJobOptions {
  name: string;
  concurrency?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export const ProcessJob = (options: ProcessJobOptions) =>
  SetMetadata(PROCESS_JOB_KEY, options);
