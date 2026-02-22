export interface JobData {
  [key: string]: any;
}

import { ApiProperty } from '@nestjs/swagger';
// Import BullMQ's types
import { JobsOptions as BullMQJobOptions, Job as BullMQJob } from 'bullmq';
import { IsDate, IsNumber, IsObject, IsString } from 'class-validator';

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
  error?: {
    message: string;
    stack?: string;
  };
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


export class JobDetail {
  @ApiProperty()
  @IsString()
  id: string;
  @ApiProperty()
  @IsString()
  name: string;
  @ApiProperty()
  @IsObject()
  data: JobData;
  @ApiProperty()
  @IsObject()
  opts: JobOptions;
  @ApiProperty()
  @IsString()
  state: string;
  @ApiProperty()
  @IsNumber()
  progress: number;
  @ApiProperty()
  @IsObject()
  returnvalue: any;
  @ApiProperty()
  @IsString()
  failedReason: string;
  @ApiProperty()
  @IsDate()
  processedOn: Date;
  @ApiProperty()
  @IsDate()
  finishedOn: Date;
  @ApiProperty()
  @IsDate()
  timestamp: Date;
  @ApiProperty()
  @IsNumber()
  attemptsMade: number;
  @ApiProperty()
  @IsNumber()
  delay: number;
  @ApiProperty()
  @IsNumber()
  ttl: number;
}
