import { Injectable } from '@nestjs/common';
import { JobName, ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import type { Job } from '../../../shared/job-processing/interfaces/job.interface';
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

  constructor(
    private readonly startWorkflowStep: StartWorkflowStepUseCase,
    private readonly workflowService: WorkflowService,


  ) { }

  @ProcessJob({
    name: JobName.START_WORKFLOW_STEP
  })
  async processStartWorkflowStep(job: Job<{ instanceId: string; step: WorkflowStep }>): Promise<void> {
    const data = job.data;
    await this.startWorkflowStep.execute(data.instanceId);
  }

  @ProcessJob({
    name: JobName.TASK_AUTOMATIC
  })
  async processAytomaticTask(job: Job<{
    instanceId: string;
    task: WorkflowTask,
  }>): Promise<void> {
    const data = job.data;
    await this.workflowService.processAutomaticTask(data.instanceId, data.task.id);
  }

}

