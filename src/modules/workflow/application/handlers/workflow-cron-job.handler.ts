import { Inject, Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WORKFLOW_INSTANCE_REPOSITORY, type IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { User } from 'src/modules/user/domain/model/user.model';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { JobName } from 'src/shared/job-names';
import { CronLogger } from 'src/shared/utils/trace-context.util';

export interface WorkflowAutomaticTaskJobData {
  instanceId: string;
  stepId: string;
  taskId: string;
  handler: string;
  requestData: Record<string, any>;
}

@Injectable()
export class WorkflowCronJobHandler {
  private readonly logger = new CronLogger(WorkflowCronJobHandler.name);

  constructor(
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowInstanceRepository: IWorkflowInstanceRepository,
    private readonly jobProcessingService: JobProcessingService
  ) { }
  @Cron(CronExpression.EVERY_DAY_AT_10PM, {
    name: 'remind-pending-tasks',
  })
  async remindPendingTasks(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[Cron] Remind pending tasks started');

    try {
      const tasks =
        await this.workflowInstanceRepository.findAllTasks({
          completed: false,
        });

      this.logger.log(
        `[Cron] Found ${tasks.length} pending tasks`,
      );

      const assignees = new Map(
        tasks
          .flatMap(t => t.assignments)
          .map(a => [a.assignedTo.id, a.assignedTo]),
      );

      this.logger.log(
        `[Cron] Unique assignees count: ${assignees.size}`,
      );

      let successCount = 0;

      for (const user of assignees.values()) {
        this.logger.debug(
          `[Cron] Queueing reminder | userId=${user.id} | email=${user.email}`,
        );

        await this.jobProcessingService.addJob(
          JobName.SEND_TASK_REMINDER_EMAIL,
          {
            assigneeId: user.id,
            assigneeName: user.fullName,
            assigneeEmail: user.email,
          },
        );

        successCount++;
      }

      this.logger.log(
        `[Cron] Reminder job queued successfully | total=${successCount} | duration=${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      this.logger.error(
        '[Cron] Failed to process pending task reminders',
        error?.stack ?? error,
      );
    }
  }

}

