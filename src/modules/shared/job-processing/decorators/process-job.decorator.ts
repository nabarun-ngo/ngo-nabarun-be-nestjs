import { SetMetadata } from '@nestjs/common';

export const PROCESS_JOB_KEY = 'process_job';

export enum JobName {
  SEND_ONBOARDING_EMAIL = 'send-onboarding-email',
  UPDATE_USER_ROLE = 'update-user-role',
  START_WORKFLOW_STEP = "START_WORKFLOW_STEP",
}

export enum JobPriority {
  CRITICAL = 1,
  HIGH = 2,
  NORMAL = 3,
  LOW = 4,
  BACKGROUND = 5,
}

export interface ProcessJobOptions {
  name: JobName;
  concurrency?: number;

  // Retry configuration (handled by BullMQ)
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential' | 'linear';
    delay: number;
  };

  // Timeout configuration
  timeout?: number; // Job timeout in milliseconds

  // Callbacks
  onRetry?: (attemptNumber: number, error: Error) => void | Promise<void>;
  onFailed?: (error: Error, attemptsMade: number) => void | Promise<void>;

  // Priority (for future use)
  priority?: JobPriority;
}

export const ProcessJob = (options: ProcessJobOptions) =>
  SetMetadata(PROCESS_JOB_KEY, options);
