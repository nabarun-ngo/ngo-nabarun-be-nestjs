import { Injectable, Inject, Logger } from '@nestjs/common';
import { ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import type { Job, JobResult } from '../../../shared/job-processing/interfaces/job.interface';
import { WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import type { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { WorkflowService } from '../services/workflow.service';
import { WorkflowHandlerRegistry } from './workflow-handler.registry';
import { StepStartedEvent } from '../../domain/events/step-started.event';
import { jobSuccessResponse } from 'src/shared/utilities/common.util';
import { WorkflowDefService } from '../../infrastructure/external/workflow-def.service';
import { WorkflowStep } from '../../domain/model/workflow-step.model';

export interface WorkflowAutomaticTaskJobData {
  instanceId: string;
  stepId: string;
  taskId: string;
  handler: string;
  requestData: Record<string, any>;
}

@Injectable()
export class WorkflowTaskProcessor {
  private readonly logger = new Logger(WorkflowTaskProcessor.name);

  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IWorkflowInstanceRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly workflowService: WorkflowService,
    private readonly handlerRegistry: WorkflowHandlerRegistry,
    private readonly workflowDefService: WorkflowDefService,
  ) { }



  //start-workflow-step

  @ProcessJob({
    name: 'start-workflow-step',
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processStartWorkflowStep(job: Job<{ instanceId: string; step: WorkflowStep }>): Promise<JobResult> {
    const data = job.data;
    const workflow = await this.instanceRepository.findById(data.instanceId, true);
    const definition = await this.workflowDefService.findWorkflowByType(workflow?.type!);
    console.log("helloooo");

    return jobSuccessResponse();
  }

  @ProcessJob({
    name: 'workflow-automatic-task',
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processAutomaticTask(job: Job<WorkflowAutomaticTaskJobData>): Promise<JobResult> {
    try {
      this.logger.log(`Processing automatic task: ${job.data.taskId} for instance: ${job.data.instanceId}`);

      // Find instance
      const instance = await this.instanceRepository.findById(job.data.instanceId, true);
      if (!instance) {
        throw new Error(`Workflow instance not found: ${job.data.instanceId}`);
      }

      // // Find task
      // let targetTask = null;
      // let targetStep = null;

      // for (const step of instance.steps) {
      //   for (const task of step.tasks) {
      //     if (task.id === job.data.taskId) {
      //       targetTask = task;
      //       targetStep = step;
      //       break;
      //     }
      //   }
      //   if (targetTask) break;
      // }

      // if (!targetTask || !targetStep) {
      //   throw new Error(`Task not found: ${job.data.taskId}`);
      // }

      // // Execute the handler
      // const handlerResult = await this.executeHandler(job.data.handler, job.data.requestData);

      // // Complete the task
      // targetTask.complete(handlerResult, 'system');

      // // Emit task completed event
      // instance.addDomainEvent(
      //   new TaskCompletedEvent(instance.id, instance.id, targetStep.id, targetTask),
      // );

      // // Check if all tasks in step are completed
      // if (targetStep.isAllTasksCompleted()) {
      //   targetStep.complete();
      //   instance.addDomainEvent(new StepCompletedEvent(instance.id, instance.id, targetStep));

      //   // Move to next step
      //   await this.workflowService.moveToNextStep(instance);
      // }

      // // Check if workflow is completed
      // const allStepsCompleted = instance.steps.every((s) => s.isCompleted());
      // if (allStepsCompleted && instance.steps.length > 0) {
      //   instance.complete(handlerResult, 'system');
      //   instance.addDomainEvent(new WorkflowCompletedEvent(instance.id, instance));
      // }

      // Save instance
      await this.instanceRepository.update(instance.id, instance);

      // Emit domain events
      // for (const event of instance.domainEvents) {
      //   this.eventEmitter.emit(event.constructor.name, event);
      // }
      instance.clearEvents();

      this.logger.log(`Automatic task completed: ${job.data.taskId}`);

      return {
        success: true,
        // data: handlerResult,
        metadata: {
          instanceId: instance.id,
          //taskId: targetTask.id,
          // stepId: targetStep.id,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to process automatic task: ${job.data.taskId}`, error);

      // Mark task as failed
      try {
        const instance = await this.instanceRepository.findById(job.data.instanceId, true);
        if (instance) {
          for (const step of instance.steps) {
            for (const task of step.tasks) {
              if (task.id === job.data.taskId) {
                task.fail(error instanceof Error ? error.message : 'Unknown error');
                await this.instanceRepository.update(instance.id, instance);
                break;
              }
            }
          }
        }
      } catch (updateError) {
        this.logger.error(`Failed to update task status on error`, updateError);
      }

      return {
        success: false,
        error: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        },
        metadata: {
          instanceId: job.data.instanceId,
          taskId: job.data.taskId,
        },
      };
    }
  }

  private async executeHandler(
    handlerClassName: string,
    requestData: Record<string, any>,
  ): Promise<Record<string, any>> {
    const handler = this.handlerRegistry.getHandler(handlerClassName);

    if (!handler) {
      const registered = this.handlerRegistry.getRegisteredHandlers().join(', ');
      throw new Error(`Handler not found: ${handlerClassName}. Registered handlers: ${registered}`);
    }

    try {
      return await handler.handle(requestData);
    } catch (error) {
      this.logger.error(`Handler ${handlerClassName} execution failed`, error);
      throw error;
    }
  }
}

