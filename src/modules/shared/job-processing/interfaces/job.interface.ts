export interface JobData {
  [key: string]: any;
}

// Import BullMQ's types
import { JobsOptions as BullMQJobOptions, Job as BullMQJob } from 'bullmq';

// Re-export BullMQ's types as our types
export type JobOptions = BullMQJobOptions;
export type Job<T = any> = BullMQJob<T>;

// Create a simplified interface for our internal use
export interface SimpleJobOptions {
  delay?: number;
  priority?: number;
  attempts?: number;
  backoff?: {
    type: 'fixed' | 'exponential';
    delay: number;
  };
  removeOnComplete?: number;
  removeOnFail?: number;
  jobId?: string;
  ttl?: number;
  repeat?: {
    cron?: string;
    every?: number;
    tz?: string;
  };
}

export interface JobResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export type JobProcessor<T = any> = (job: Job<T>) => Promise<JobResult>;

// Job interface is now using Bull's Job type

export interface JobQueue {
  add(name: string, data: JobData, options?: JobOptions): Promise<Job>;
  process(name: string, processor: JobProcessor): void;
  getJobs(types: string[], start?: number, end?: number): Promise<Job[]>;
  getJob(id: string): Promise<Job | undefined>;
  removeJob(id: string): Promise<void>;
  clean(grace: number, status: string): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  isPaused(): Promise<boolean>;
  getWaiting(): Promise<Job[]>;
  getActive(): Promise<Job[]>;
  getCompleted(): Promise<Job[]>;
  getFailed(): Promise<Job[]>;
  getDelayed(): Promise<Job[]>;
  getRepeatableJobs(): Promise<any[]>;
  removeRepeatable(name: string, repeat: any): Promise<void>;
  close(): Promise<void>;
}
