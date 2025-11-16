import { Injectable, Logger } from '@nestjs/common';
import { USER_REPOSITORY } from '../../../user/domain/repositories/user.repository.interface';
import type { IUserRepository } from '../../../user/domain/repositories/user.repository.interface';
import { Inject } from '@nestjs/common';

export interface WorkflowTaskHandler {
  handle(requestData: Record<string, any>): Promise<Record<string, any>>;
}

@Injectable()
export class WorkflowHandlerRegistry {
  private readonly logger = new Logger(WorkflowHandlerRegistry.name);
  private readonly handlers = new Map<string, WorkflowTaskHandler>();

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {
    this.registerDefaultHandlers();
  }

  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }

  private registerDefaultHandlers(): void {
    // Register UserNotRegisteredTaskHandler
    this.handlers.set(
      'ngo.NA.be.application.handler.task.UserNotRegisteredTaskHandler',
      {
        handle: async (requestData: Record<string, any>) => {
          if (!requestData.email) {
            throw new Error('Email is required for duplicate user check');
          }

          const existingUser = await this.userRepository.findByEmail(requestData.email);
          if (existingUser) {
            throw new Error(`User with email ${requestData.email} already exists`);
          }

          return { duplicate: false, email: requestData.email };
        },
      },
    );

    // Register Auth0UserCreationHandler
    this.handlers.set('Auth0UserCreationHandler', {
      handle: async (requestData: Record<string, any>) => {
        // This handler should create a user in Auth0
        // For now, return a mock result
        // In production, inject Auth0UserService and create the user
        this.logger.log(`Would create Auth0 user for: ${requestData.email}`);
        return {
          success: true,
          message: 'User creation initiated',
          email: requestData.email,
        };
      },
    });
  }

  registerHandler(handlerName: string, handler: WorkflowTaskHandler): void {
    this.handlers.set(handlerName, handler);
    this.logger.log(`Registered workflow handler: ${handlerName}`);
  }

  getHandler(handlerName: string): WorkflowTaskHandler | null {
    return this.handlers.get(handlerName) || null;
  }

  hasHandler(handlerName: string): boolean {
    return this.handlers.has(handlerName);
  }

  
  // @ProcessJob({
  //   name: JobName.TASK_AUTOMATIC,
  //   concurrency: 5,
  //   attempts: 3,
  //   backoff: {
  //     type: 'exponential',
  //     delay: 2000,
  //   },
  // })
  // async processAutomaticTask(job: Job<WorkflowAutomaticTaskJobData>): Promise<JobResult> {
  //   try {
  //     this.logger.log(`Processing automatic task: ${job.data.taskId} for instance: ${job.data.instanceId}`);

  //     // Find instance
  //     const instance = await this.instanceRepository.findById(job.data.instanceId, true);
  //     if (!instance) {
  //       throw new Error(`Workflow instance not found: ${job.data.instanceId}`);
  //     }

  //     // // Find task
  //     // let targetTask = null;
  //     // let targetStep = null;

  //     // for (const step of instance.steps) {
  //     //   for (const task of step.tasks) {
  //     //     if (task.id === job.data.taskId) {
  //     //       targetTask = task;
  //     //       targetStep = step;
  //     //       break;
  //     //     }
  //     //   }
  //     //   if (targetTask) break;
  //     // }

  //     // if (!targetTask || !targetStep) {
  //     //   throw new Error(`Task not found: ${job.data.taskId}`);
  //     // }

  //     // // Execute the handler
  //     // const handlerResult = await this.executeHandler(job.data.handler, job.data.requestData);

  //     // // Complete the task
  //     // targetTask.complete(handlerResult, 'system');

  //     // // Emit task completed event
  //     // instance.addDomainEvent(
  //     //   new TaskCompletedEvent(instance.id, instance.id, targetStep.id, targetTask),
  //     // );

  //     // // Check if all tasks in step are completed
  //     // if (targetStep.isAllTasksCompleted()) {
  //     //   targetStep.complete();
  //     //   instance.addDomainEvent(new StepCompletedEvent(instance.id, instance.id, targetStep));

  //     //   // Move to next step
  //     //   await this.workflowService.moveToNextStep(instance);
  //     // }

  //     // // Check if workflow is completed
  //     // const allStepsCompleted = instance.steps.every((s) => s.isCompleted());
  //     // if (allStepsCompleted && instance.steps.length > 0) {
  //     //   instance.complete(handlerResult, 'system');
  //     //   instance.addDomainEvent(new WorkflowCompletedEvent(instance.id, instance));
  //     // }

  //     // Save instance
  //     await this.instanceRepository.update(instance.id, instance);

  //     // Emit domain events
  //     // for (const event of instance.domainEvents) {
  //     //   this.eventEmitter.emit(event.constructor.name, event);
  //     // }
  //     instance.clearEvents();

  //     this.logger.log(`Automatic task completed: ${job.data.taskId}`);

  //     return {
  //       success: true,
  //       // data: handlerResult,
  //       metadata: {
  //         instanceId: instance.id,
  //         //taskId: targetTask.id,
  //         // stepId: targetStep.id,
  //       },
  //     };
  //   } catch (error) {
  //     this.logger.error(`Failed to process automatic task: ${job.data.taskId}`, error);

  //     // Mark task as failed
  //     try {
  //       const instance = await this.instanceRepository.findById(job.data.instanceId, true);
  //       if (instance) {
  //         for (const step of instance.steps) {
  //           for (const task of step.tasks) {
  //             if (task.id === job.data.taskId) {
  //               task.fail(error instanceof Error ? error.message : 'Unknown error');
  //               await this.instanceRepository.update(instance.id, instance);
  //               break;
  //             }
  //           }
  //         }
  //       }
  //     } catch (updateError) {
  //       this.logger.error(`Failed to update task status on error`, updateError);
  //     }

  //     return {
  //       success: false,
  //       error: {
  //         message: error instanceof Error ? error.message : 'Unknown error',
  //         stack: error instanceof Error ? error.stack : undefined,
  //       },
  //       metadata: {
  //         instanceId: job.data.instanceId,
  //         taskId: job.data.taskId,
  //       },
  //     };
  //   }
  // }

  // private async executeHandler(
  //   handlerClassName: string,
  //   requestData: Record<string, any>,
  // ): Promise<Record<string, any>> {
  //   const handler = this.handlerRegistry.getHandler(handlerClassName);

  //   if (!handler) {
  //     const registered = this.handlerRegistry.getRegisteredHandlers().join(', ');
  //     throw new Error(`Handler not found: ${handlerClassName}. Registered handlers: ${registered}`);
  //   }

  //   try {
  //     return await handler.handle(requestData);
  //   } catch (error) {
  //     this.logger.error(`Handler ${handlerClassName} execution failed`, error);
  //     throw error;
  //   }
  // }
}

