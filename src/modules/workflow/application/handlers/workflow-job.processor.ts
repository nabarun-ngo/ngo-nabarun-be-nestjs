import { Injectable, Logger } from '@nestjs/common';
import { JobName, ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import type { Job, JobResult } from '../../../shared/job-processing/interfaces/job.interface';
import { jobFailureResponse, jobSuccessResponse } from 'src/shared/utilities/common.util';
import { WorkflowStep } from '../../domain/model/workflow-step.model';
import { StartWorkflowStepUseCase } from '../use-cases/start-workflow-step.use-case';
import { WorkflowTask } from '../../domain/model/workflow-task.model';
import { WorkflowService } from '../services/workflow.service';

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
    private readonly workflowService: WorkflowService,


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
    name: JobName.TASK_AUTOMATIC,
    concurrency: 5,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processAytomaticTask(job: Job<{
    instanceId: string;
    task: WorkflowTask,
  }>): Promise<JobResult> {
    const data = job.data;
    try {
      this.workflowService.processAutomaticTask(data.instanceId, data.task.id);
      return jobSuccessResponse();
    } catch (e) {
      return jobFailureResponse(e);
    }
  }

}

