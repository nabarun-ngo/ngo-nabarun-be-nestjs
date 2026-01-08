import { Inject, Injectable, Logger } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { OnEvent } from "@nestjs/event-emitter";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { WORKFLOW_INSTANCE_REPOSITORY, type IWorkflowInstanceRepository } from "../../domain/repositories/workflow-instance.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { WorkflowInstance } from "../../domain/model/workflow-instance.model";
import { StepCompletedEvent } from "../../domain/events/step-completed.event";
import { WorkflowCreatedEvent } from "../../domain/events/workflow-created.event";
import { JobName } from "src/shared/job-names";
import { CronLogger } from "src/shared/utils/trace-context.util";

export class TriggerRemindPendingTasksEvent { }

@Injectable()
export class WorkflowEventsHandler {
  private readonly logger = new CronLogger(WorkflowEventsHandler.name);

  constructor(
    private readonly jobProcessingService: JobProcessingService,
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IWorkflowInstanceRepository,
    private readonly corrService: CorrespondenceService,
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowInstanceRepository: IWorkflowInstanceRepository) { }

  @OnEvent(StepStartedEvent.name, { async: true })
  async handleStepStartedEvent(event: StepStartedEvent) {
    await this.jobProcessingService.addJob<{ instanceId: string; stepId: string }>(JobName.START_WORKFLOW_STEP, {
      instanceId: event.instanceId,
      stepId: event.stepId,
    });
  }

  @OnEvent(StepCompletedEvent.name, { async: true })
  async handleStepCompletedEvent(event: StepCompletedEvent) {
    const workflow = await this.workflowRepository.findById(event.aggregateId);
    if (workflow?.initiatedBy || workflow?.initiatedFor || workflow?.isExternalUser) {
      await this.sendWorkflowUpdateEmail(workflow, 'Request Updated');
    }
  }

  @OnEvent(WorkflowCreatedEvent.name, { async: true })
  async handleWorkflowCreatedEvent(event: WorkflowCreatedEvent) {
    const workflow = await this.workflowRepository.findById(event.aggregateId);
    if (workflow?.initiatedBy || workflow?.initiatedFor || workflow?.isExternalUser) {
      await this.sendWorkflowUpdateEmail(workflow, 'Request Created');
    }
  }

  private async sendWorkflowUpdateEmail(workflow: WorkflowInstance, action: string = 'Request Created') {
    const emailData = await this.corrService.getEmailTemplateData(EmailTemplateName.WORKFLOW_UPDATE, {
      workflow: workflow?.toJson(),
      action,
      currentStepName: workflow?.steps?.find(step => step.stepId === workflow?.currentStepId)?.name ?? ''
    })

    emailData.body.content.table[0].data = workflow?.actualSteps.map(m => [m.name, m.status])

    await this.corrService.sendTemplatedEmail({
      templateData: emailData,
      options: {
        recipients: {
          ...(workflow?.initiatedBy?.email ? { cc: workflow?.initiatedBy?.email } : {}),
          ...(workflow?.isExternalUser ? { to: workflow?.externalUserEmail } : {}),
          ...(workflow?.initiatedFor?.email ? { to: workflow?.initiatedFor?.email } : {}),
        }
      }
    })
  }


  @OnEvent(TriggerRemindPendingTasksEvent.name, { async: true })
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