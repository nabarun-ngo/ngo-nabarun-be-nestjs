import { Inject, Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineWorkflowCreatedEvent } from '../../domain/events/engine-workflow-created.event';
import { EngineStepStartedEvent } from '../../domain/events/engine-step-started.event';
import { EngineTaskCompletedEvent } from '../../domain/events/engine-task-completed.event';
import { EngineWorkflowCompletedEvent } from '../../domain/events/engine-workflow-completed.event';
import { EngineWorkflowFailedEvent } from '../../domain/events/engine-workflow-failed.event';
import { JobName } from 'src/shared/job-names';
import { EmailTemplateName } from 'src/shared/email-keys';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineTaskAssignmentStatus } from '../../domain/model/engine-task-assignment.model';
import type { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';

/**
 * Event triggered by cron job to send reminders for overdue assignments
 */
export class TriggerEngineTaskRemindersEvent {}

/**
 * Event handler for workflow engine domain events.
 * 
 * Responsibilities:
 * - Listen to domain events emitted by workflow instances
 * - Trigger async jobs for step/task execution
 * - Send email notifications (workflow updates, task reminders)
 * - Handle cron-triggered reminder jobs
 * 
 * Pattern: Event-driven architecture
 * - Domain models emit events (EngineWorkflowInstance.addDomainEvent)
 * - This handler listens and reacts (async, non-blocking)
 * - Jobs queued for heavy operations (emails, external APIs)
 */
@Injectable()
export class EngineWorkflowEventHandler {
  private readonly logger = new CronLogger(EngineWorkflowEventHandler.name);

  constructor(
    private readonly jobProcessingService: JobProcessingService,
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
    private readonly correspondenceService: CorrespondenceService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Handle workflow created event
   * Sends "Workflow Created" email to initiator/requestor
   */
  @OnEvent(EngineWorkflowCreatedEvent.name, { async: true })
  async handleWorkflowCreatedEvent(event: EngineWorkflowCreatedEvent) {
    this.logger.log(
      `[Event] Workflow created: instanceId=${event.aggregateId}, type=${event.type}`,
    );

    const workflow = await this.workflowRepository.findById(
      event.aggregateId,
      true,
    );

    if (workflow && (workflow.initiatedById || workflow.initiatedForId)) {
      await this.sendWorkflowUpdateEmail(workflow, 'Workflow Created');
    }
  }

  /**
   * Handle step started event
   * Queues async job to execute automatic tasks in the step
   */
  @OnEvent(EngineStepStartedEvent.name, { async: true })
  async handleStepStartedEvent(event: EngineStepStartedEvent) {
    this.logger.log(
      `[Event] Step started: instanceId=${event.instanceId}, stepId=${event.stepId}`,
    );

    // Queue job to process automatic tasks in this step
    await this.jobProcessingService.addJob<{
      instanceId: string;
      stepId: string;
    }>(JobName.ENGINE_PROCESS_STEP, {
      instanceId: event.instanceId,
      stepId: event.stepId,
    });
  }

  /**
   * Handle task completed event
   * Sends "Task Completed" email if step/workflow status changed
   */
  @OnEvent(EngineTaskCompletedEvent.name, { async: true })
  async handleTaskCompletedEvent(event: EngineTaskCompletedEvent) {
    this.logger.log(
      `[Event] Task completed: instanceId=${event.instanceId}, taskId=${event.taskId}`,
    );

    const workflow = await this.workflowRepository.findById(
      event.instanceId,
      true,
    );

    if (workflow && (workflow.initiatedById || workflow.initiatedForId)) {
      // Check if this task completion resulted in step completion
      const completedStep = workflow.steps.find(
        (s) => s.id === event.stepId && s.isCompleted(),
      );

      if (completedStep) {
        await this.sendWorkflowUpdateEmail(workflow, 'Step Completed');
      }
    }
  }

  /**
   * Handle workflow completed event
   * Sends "Workflow Completed" email
   */
  @OnEvent(EngineWorkflowCompletedEvent.name, { async: true })
  async handleWorkflowCompletedEvent(event: EngineWorkflowCompletedEvent) {
    this.logger.log(`[Event] Workflow completed: instanceId=${event.aggregateId}`);

    const workflow = await this.workflowRepository.findById(
      event.aggregateId,
      true,
    );

    if (workflow && (workflow.initiatedById || workflow.initiatedForId)) {
      await this.sendWorkflowUpdateEmail(workflow, 'Workflow Completed');
    }
  }

  /**
   * Handle workflow failed event
   * Sends "Workflow Failed" email with error details
   */
  @OnEvent(EngineWorkflowFailedEvent.name, { async: true })
  async handleWorkflowFailedEvent(event: EngineWorkflowFailedEvent) {
    this.logger.error(
      `[Event] Workflow failed: instanceId=${event.aggregateId}, reason=${event.reason}`,
    );

    const workflow = await this.workflowRepository.findById(
      event.aggregateId,
      true,
    );

    if (workflow && (workflow.initiatedById || workflow.initiatedForId)) {
      await this.sendWorkflowUpdateEmail(
        workflow,
        `Workflow Failed: ${event.reason}`,
      );
    }
  }

  /**
   * Cron-triggered handler for sending task reminders
   * Finds overdue assignments and queues reminder emails
   */
  @OnEvent(TriggerEngineTaskRemindersEvent.name, { async: true })
  async handleTaskRemindersEvent(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('[Cron] Engine task reminders started');

    try {
      // Find all overdue assignments
      const overdueAssignments =
        await this.workflowRepository.findOverdueAssignments({});

      this.logger.log(
        `[Cron] Found ${overdueAssignments.length} overdue assignment(s)`,
      );

      if (overdueAssignments.length === 0) {
        this.logger.log('[Cron] No overdue assignments, skipping reminders');
        return;
      }

      // Group by assignee to send one email per user
      const assigneeMap = new Map<
        string,
        { assigneeId: string; count: number }
      >();

      for (const assignment of overdueAssignments) {
        // Get assignee identifier (internal ID or external email)
        const assigneeKey = assignment.assigneeId ?? assignment.assigneeEmail ?? 'unknown';
        const existing = assigneeMap.get(assigneeKey);
        if (existing) {
          existing.count++;
        } else {
          assigneeMap.set(assigneeKey, {
            assigneeId: assignment.assigneeId ?? assignment.assigneeEmail ?? 'unknown',
            count: 1,
          });
        }
      }

      this.logger.log(
        `[Cron] Unique assignees with overdue tasks: ${assigneeMap.size}`,
      );

      let successCount = 0;

      for (const assigneeData of assigneeMap.values()) {
        this.logger.debug(
          `[Cron] Queueing reminder | assigneeId=${assigneeData.assigneeId} | tasks=${assigneeData.count}`,
        );

        await this.jobProcessingService.addJob(
          JobName.ENGINE_SEND_TASK_REMINDER,
          {
            assigneeId: assigneeData.assigneeId,
          },
        );

        successCount++;
      }

      this.logger.log(
        `[Cron] Reminder jobs queued successfully | total=${successCount} | duration=${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      this.logger.error(
        '[Cron] Failed to process engine task reminders',
        error?.stack ?? error,
      );
    }
  }

  /**
   * Send workflow update email to initiator/requestor
   */
  private async sendWorkflowUpdateEmail(
    workflow: EngineWorkflowInstance,
    action: string,
  ): Promise<void> {
    try {
      const activeSteps = workflow.getActiveSteps();
      const currentStepNames = activeSteps.map((s) => s.name).join(', ');

      const emailData = await this.correspondenceService.getEmailTemplateData(
        EmailTemplateName.WORKFLOW_UPDATE,
        {
          workflow: {
            id: workflow.id,
            type: workflow.type,
            name: workflow.name,
            status: workflow.status,
          },
          action,
          currentStepName: currentStepNames || 'N/A',
        },
      );

      // Populate step status table
      if (emailData.body?.content?.table?.[0]?.data) {
        emailData.body.content.table[0].data = workflow.steps.map((s) => [
          s.name,
          s.status,
        ]);
      }

      // Determine recipients - Load user details from repository
      const recipients: { to?: string; cc?: string } = {};
      
      try {
        if (workflow.initiatedById) {
          const initiatedBy = await this.userRepository.findById(workflow.initiatedById);
          if (initiatedBy?.email) {
            recipients.cc = initiatedBy.email;
          }
        }
        
        if (workflow.initiatedForId) {
          const initiatedFor = await this.userRepository.findById(workflow.initiatedForId);
          if (initiatedFor?.email) {
            recipients.to = initiatedFor.email;
          }
        }

        if (Object.keys(recipients).length > 0) {
          await this.correspondenceService.sendTemplatedEmail({
            templateData: emailData,
            options: { recipients },
          });

          this.logger.log(
            `[Email] Workflow update sent: instanceId=${workflow.id}, action=${action}, to=${recipients.to}, cc=${recipients.cc}`,
          );
        } else {
          this.logger.warn(
            `[Email] No recipients found for workflow update: instanceId=${workflow.id}`,
          );
        }
      } catch (emailError) {
        this.logger.error(
          `[Email] Failed to load user details or send email: instanceId=${workflow.id}`,
          emailError,
        );
      }
    } catch (error) {
      this.logger.error(
        `[Email] Failed to send workflow update email: instanceId=${workflow.id}`,
        error,
      );
    }
  }
}
