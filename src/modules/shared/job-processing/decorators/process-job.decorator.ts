import { SetMetadata } from '@nestjs/common';

export const PROCESS_JOB_KEY = 'process_job';

export enum JobName{
  SEND_ONBOARDING_EMAIL='send-onboarding-email',
  UPDATE_USER_ROLE='update-user-role',
  TASK_AUTOMATIC = "TASK_AUTOMATIC",
  START_WORKFLOW_STEP = "START_WORKFLOW_STEP",
  CHECK_WORKFLOW_STATE = "CHECK_WORKFLOW_STATE",
}

export interface ProcessJobOptions {
  name: JobName;
  concurrency?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
}

export const ProcessJob = (options: ProcessJobOptions) =>
  SetMetadata(PROCESS_JOB_KEY, options);
