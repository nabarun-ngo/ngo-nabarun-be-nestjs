import { Injectable, Inject, Logger } from '@nestjs/common';
import { JobName, ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
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
import { StartWorkflowStepUseCase } from '../use-cases/start-workflow-step.use-case';

export interface WorkflowAutomaticTaskJobData {
  instanceId: string;
  stepId: string;
  taskId: string;
  handler: string;
  requestData: Record<string, any>;
}

@Injectable()
export class WorkflowJobProcessor {
  private readonly logger = new Logger(WorkflowJobProcessor.name);

  constructor(
    private readonly startWorkflowStep: StartWorkflowStepUseCase,
    
  ) { }

  @ProcessJob({
    name: JobName.START_WORKFLOW_STEP,
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processStartWorkflowStep(job: Job<{ instanceId: string; step: WorkflowStep }>): Promise<JobResult> {
    const data = job.data;
    await this.startWorkflowStep.execute(data.instanceId);
    return jobSuccessResponse();
  }

  @ProcessJob({
    name: JobName.CHECK_WORKFLOW_STATE,
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processMextWorkflowStep(job: Job<{ instanceId: string; step: WorkflowStep }>): Promise<JobResult> {
    const data = job.data;

    return jobSuccessResponse();
  }

}

