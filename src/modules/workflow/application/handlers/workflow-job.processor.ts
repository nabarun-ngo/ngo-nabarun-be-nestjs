import { Inject, Injectable } from '@nestjs/common';
import { ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import { type Job } from '../../../shared/job-processing/dto/job.dto';
import { WorkflowStep } from '../../domain/model/workflow-step.model';
import { StartWorkflowStepUseCase } from '../use-cases/start-workflow-step.use-case';
import { JobName } from 'src/shared/job-names';
import { type IWorkflowInstanceRepository, WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { EmailTemplateName } from 'src/shared/email-keys';
import { formatDate } from 'src/shared/utilities/common.util';
import { WorkflowTask } from '../../domain/model/workflow-task.model';

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
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowInstanceRepository: IWorkflowInstanceRepository,
    private readonly correspondenceService: CorrespondenceService
  ) { }

  @ProcessJob({
    name: JobName.START_WORKFLOW_STEP,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  })
  async processStartWorkflowStep(job: Job<{ instanceId: string; step: WorkflowStep }>): Promise<void> {
    const data = job.data;
    await this.startWorkflowStep.execute(data.instanceId);
  }


  @ProcessJob({
    name: JobName.SEND_TASK_REMINDER_EMAIL,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30 * 1000,
    },
  })
  async processSendTaskReminderEmail(job: Job<{ assigneeId: string, assigneeName: string, assigneeEmail: string }>): Promise<void> {

    job.log(`Processing ${JobName.SEND_TASK_REMINDER_EMAIL} for user ${job.data.assigneeEmail}`);
    try {
      const allPendingTasks = await this.workflowInstanceRepository.findAllTasks({
        status: WorkflowTask.pendingTaskStatus,
        assignedTo: job.data.assigneeId
      });

      if (allPendingTasks.length === 0) {
        job.log(`No valid tasks found for reminder job ${job.id}`);
        return;
      }

      const templateData = await this.correspondenceService.getEmailTemplateData(EmailTemplateName.TASK_REMINDER, {
        data: {
        },
      });

      templateData.body.content.table[0].data = [
        ...templateData.body.content.table[0].data,
        ...allPendingTasks.map((task) => {
          return [
            task?.id,
            task.name,
            formatDate(task?.createdAt),
          ];
        })];

      await this.correspondenceService.sendTemplatedEmail({
        options: {
          recipients: {
            to: job.data.assigneeEmail,
          },
        },
        templateData,
      });

      job.log(`Reminder email SENT to user ${job.data.assigneeEmail} for ${allPendingTasks.length} tasks`);
    } catch (error) {
      job.log(`Failed to send task reminder email for user ${job.data.assigneeEmail} : ${error}`);
      throw error;
    }
  }
}

