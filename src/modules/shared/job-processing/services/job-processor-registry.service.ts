import { Injectable, Logger, OnModuleInit, OnModuleDestroy, OnApplicationBootstrap } from '@nestjs/common';
import { ModuleRef, Reflector } from '@nestjs/core';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Worker, Job as BullJob } from 'bullmq';
import { JobProcessor, Job, JobResult } from '../interfaces/job.interface';
import { ProcessJobOptions, PROCESS_JOB_KEY } from '../decorators/process-job.decorator';
import { JobName } from 'src/shared/job-names';

@Injectable()
export class JobProcessorRegistry implements OnModuleDestroy, OnApplicationBootstrap {
  private readonly logger = new Logger(JobProcessorRegistry.name);
  private readonly processors = new Map<string, { processor: JobProcessor; options: ProcessJobOptions }>();
  private worker: Worker | null = null;
  private isShuttingDown = false;

  constructor(
    @InjectQueue('default') private readonly defaultQueue: Queue,
    private readonly moduleRef: ModuleRef,
    private readonly reflector: Reflector,
  ) { }

  async onApplicationBootstrap() {
    // All modules are loaded now, discover processors
    await this.discoverAndRegisterProcessors();
    await this.initializeWorker();
  }

  async onModuleDestroy() {
    this.isShuttingDown = true;
    await this.shutdown();
  }

  /**
    * Discover and register all processors with @ProcessJob decorator
    */
  private async discoverAndRegisterProcessors() {
    const startTime = Date.now();
    const modules = this.moduleRef['container'].getModules();
    let processorsFound = 0;

    this.logger.log(`Starting processor discovery... (${modules.size} modules found)`);

    for (const [moduleName, module] of modules) {
      this.logger.debug(`Scanning module: ${moduleName}`);

      for (const [providerName, provider] of module.providers) {
        if (!provider?.instance || typeof provider.instance !== 'object') continue;

        const instance = provider.instance;
        const prototype = Object.getPrototypeOf(instance);
        const className = instance.constructor.name;

        // Get all methods
        const methods = Object.getOwnPropertyNames(prototype);

        for (const methodName of methods) {
          if (typeof instance[methodName] !== 'function' || methodName === 'constructor') {
            continue;
          }

          // Try to get metadata from the method descriptor
          const methodRef = prototype[methodName];
          if (methodRef) {
            const options = this.reflector.get<ProcessJobOptions>(
              PROCESS_JOB_KEY,
              methodRef,
            );

            if (options) {
              this.logger.log(`✓ Found processor: ${options.name} in ${className}.${methodName}`);
              this.registerProcessor(options, instance[methodName].bind(instance));
              processorsFound++;
            }
          }
        }
      }
    }

    this.logger.log(
      `Discovered ${processorsFound} processors in ${Date.now() - startTime}ms`
    );

    if (processorsFound === 0) {
      this.logger.warn('⚠️  No processors found! Make sure:');
      this.logger.warn('   1. Services with @ProcessJob are in module providers');
      this.logger.warn('   2. Modules are imported in AppModule');
      this.logger.warn('   3. Decorator uses PROCESS_JOB_KEY symbol');
    }
  }


  /**
   * Register a processor with its options
   */
  private registerProcessor(options: ProcessJobOptions, method: Function) {
    const processor: JobProcessor = async (job: Job) => {
      return await method(job);
    };

    this.processors.set(options.name, { processor, options });
    this.logger.log(`Registered processor: ${options.name}`);
  }

  /**
   * Initialize a single optimized worker for all processors
   */
  private async initializeWorker() {
    if (this.worker) return;

    // Calculate optimal concurrency based on processors
    const totalConcurrency = Array.from(this.processors.values()).reduce(
      (sum, { options }) => sum + (options.concurrency || 1),
      0
    );
    const concurrency = Math.max(totalConcurrency, 5);

    this.worker = new Worker(
      'default',
      async (job: BullJob) => this.processJob(job),
      {
        connection: this.defaultQueue.opts.connection,
        concurrency,
        // Optimize for in-process execution
        lockDuration: 30000, // 30 seconds
        lockRenewTime: 15000, // Renew every 15 seconds
        stalledInterval: 60000, // OPTIMIZED: Increased from 30s to 60s to reduce Redis polling
        maxStalledCount: 2,
        settings: {
        },
        // Aggressive cleanup for in-process workers
        removeOnComplete: {
          age: 3600 * 24 * 1, // 1 Day
          count: 1000,
        },
        removeOnFail: {
          age: 3600 * 24 * 7, // 7 Days
          count: 500,
        },
      },
    );

    // Event handlers with minimal overhead
    this.worker.on('completed', (job) => {
      this.logger.debug(`✓ ${job.name}:${job.id}`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(`✗ ${job?.name}:${job?.id} - ${error.message}`);
    });

    this.worker.on('error', (error) => {
      this.logger.error(`Worker error: ${error.message}`);
    });

    this.logger.log(`Worker initialized with concurrency: ${concurrency}`);
  }

  /**
   * Process a job by routing to the appropriate processor with enhanced error handling
   */
  private async processJob(job: BullJob): Promise<any> {
    if (this.isShuttingDown) {
      throw new Error('Worker is shutting down');
    }

    const processorData = this.processors.get(job.name);

    if (!processorData) {
      this.logger.warn(`No processor registered for: ${job.name}`);
      throw new Error(`No processor found for job type: ${job.name}`);
    }

    const startTime = Date.now();
    const attemptNumber = (job.attemptsMade || 0) + 1;
    const maxAttempts = job.opts.attempts || 3;

    try {
      this.logger.log(
        `Processing: ${job.name}:${job.id} (attempt ${attemptNumber}/${maxAttempts})`
      );

      // Apply timeout if configured
      const timeout = processorData.options.timeout;
      let result: any;

      if (timeout) {
        result = await this.executeWithTimeout(
          processorData.processor(job as unknown as Job),
          timeout,
          job.name,
        );
      } else {
        result = await processorData.processor(job as unknown as Job);
      }

      const duration = Date.now() - startTime;
      this.logger.log(`Completed: ${job.name}:${job.id} in ${duration}ms`);

      // Call onSuccess callback if defined
      if (processorData.options.onRetry && attemptNumber > 1) {
        // This was a retry that succeeded
        this.logger.log(
          `Job ${job.name}:${job.id} succeeded after ${attemptNumber} attempts`
        );
      }

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(
        `Failed: ${job.name}:${job.id} after ${duration}ms (attempt ${attemptNumber}/${maxAttempts}) - ${error.message}`,
        error.stack
      );

      // Call onRetry callback if defined and not final attempt
      if (processorData.options.onRetry && attemptNumber < maxAttempts) {
        try {
          await processorData.options.onRetry(attemptNumber, error);
        } catch (callbackError) {
          this.logger.error(
            `Error in onRetry callback for ${job.name}:${job.id}`,
            callbackError
          );
        }
      }

      // Call onFailed callback if this is the final attempt
      if (processorData.options.onFailed && attemptNumber >= maxAttempts) {
        try {
          await processorData.options.onFailed(error, attemptNumber);
        } catch (callbackError) {
          this.logger.error(
            `Error in onFailed callback for ${job.name}:${job.id}`,
            callbackError
          );
        }
      }

      throw error;
    }
  }

  /**
   * Execute processor with timeout
   */
  private async executeWithTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    jobName: string,
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Job ${jobName} timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }

  /**
   * Manually register a processor at runtime
   */
  registerProcessorManually(
    name: JobName,
    processor: JobProcessor,
    options: Partial<ProcessJobOptions> = {},
  ) {
    const processorOptions: ProcessJobOptions = {
      name,
      concurrency: options.concurrency || 1,
    };

    this.processors.set(name, {
      processor,
      options: processorOptions,
    });

    this.logger.log(`Manually registered: ${name}`);
  }

  /**
   * Unregister a processor
   */
  unregisterProcessor(name: string) {
    const existed = this.processors.delete(name);
    if (existed) {
      this.logger.log(`Unregistered: ${name}`);
    }
    return existed;
  }

  /**
   * Get all registered processor names
   */
  getRegisteredProcessors(): string[] {
    return Array.from(this.processors.keys());
  }

  /**
   * Check if a processor exists
   */
  isProcessorRegistered(name: string): boolean {
    return this.processors.has(name);
  }

  /**
   * Get processor details
   */
  getProcessor(name: string) {
    return this.processors.get(name);
  }

  /**
   * Get current worker status and metrics
   */
  async getMetrics() {
    if (!this.worker) {
      return {
        isRunning: false,
        totalProcessors: this.processors.size,
        processors: this.getRegisteredProcessors(),
      };
    }

    return {
      isRunning: await this.worker.isRunning(),
      isPaused: await this.worker.isPaused(),
      totalProcessors: this.processors.size,
      processors: this.getRegisteredProcessors(),
    };
  }

  /**
   * Pause all job processing
   */
  async pause() {
    if (this.worker && !this.isShuttingDown) {
      await this.worker.pause();
      this.logger.log('Worker paused');
    }
  }

  /**
   * Resume job processing
   */
  async resume() {
    if (this.worker && !this.isShuttingDown) {
      await this.worker.resume();
      this.logger.log('Worker resumed');
    }
  }

  /**
   * Graceful shutdown
   */
  private async shutdown() {
    this.logger.log('Shutting down worker...');

    if (this.worker) {
      try {
        // Wait for active jobs to complete (max 30 seconds)
        await Promise.race([
          this.worker.close(),
          new Promise((resolve) => setTimeout(resolve, 30000)),
        ]);
        this.logger.log('Worker closed gracefully');
      } catch (error) {
        this.logger.error('Error closing worker:', error);
      }
      this.worker = null;
    }

    this.processors.clear();
  }

  /**
   * Get queue statistics (optimized with count methods)
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.defaultQueue.getWaitingCount(),
      this.defaultQueue.getActiveCount(),
      this.defaultQueue.getCompletedCount(),
      this.defaultQueue.getFailedCount(),
      this.defaultQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}