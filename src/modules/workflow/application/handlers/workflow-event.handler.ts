import { Inject, Injectable } from "@nestjs/common";
import { JobProcessingService } from "src/modules/shared/job-processing/services/job-processing.service";
import { StepStartedEvent } from "../../domain/events/step-started.event";
import { EventEmitter2, OnEvent } from "@nestjs/event-emitter";
import { CorrespondenceService } from "src/modules/shared/correspondence/services/correspondence.service";
import { WORKFLOW_INSTANCE_REPOSITORY, type IWorkflowInstanceRepository } from "../../domain/repositories/workflow-instance.repository.interface";
import { EmailTemplateName } from "src/shared/email-keys";
import { WorkflowInstance } from "../../domain/model/workflow-instance.model";
import { StepCompletedEvent } from "../../domain/events/step-completed.event";
import { WorkflowCreatedEvent } from "../../domain/events/workflow-created.event";
import { JobName } from "src/shared/job-names";
import { CronLogger } from "src/shared/utils/trace-context.util";
import { WorkflowTask, WorkflowTaskType } from "../../domain/model/workflow-task.model";
import { TaskAssignmentCreatedEvent } from "../../domain/events/task-assignment-created.event";
import { SendNotificationRequestEvent } from "src/modules/shared/notification/application/events/send-notification-request.event";
import { NotificationKeys } from "src/shared/notification-keys";
import { NotificationCategory, NotificationPriority, NotificationType } from "src/modules/shared/notification/domain/models/notification.model";
import { TaskStartedEvent } from "../../domain/events/task-started.event";
import { TaskAssignment, TaskAssignmentStatus } from "../../domain/model/task-assignment.model";
import { UserDeletedEvent } from "src/modules/user/domain/events/user-deleted.event";
import { ReassignTaskUseCase } from "../use-cases/reassign-task.use-case";
import { ApplyTryCatch } from "src/shared/decorators/apply-try-catch.decorator";

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
    private readonly workflowInstanceRepository: IWorkflowInstanceRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly reassignTaskUseCase: ReassignTaskUseCase
  ) { }

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
      currentStepName: workflow?.steps?.find(step => step.stepDefId === workflow?.currentStepDefId)?.name ?? ''
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
  @ApplyTryCatch()
  async remindPendingTasks(): Promise<void> {
    const startedAt = Date.now();
    this.logger.log('Remind pending tasks started');

    try {
      const tasks =
        await this.workflowInstanceRepository.findAllTasks({
          status: WorkflowTask.pendingTaskStatus,
        });

      this.logger.log(
        `Found ${tasks.length} pending tasks`,
      );

      const assignees = new Map(
        tasks
          .flatMap(t => t.assignments)
          .map(a => [a.assignedTo.id, a.assignedTo]),
      );

      this.logger.log(
        `Unique assignees count: ${assignees.size}`,
      );

      let successCount = 0;

      for (const user of assignees.values()) {
        this.logger.debug(
          `Queueing reminder | userId=${user.id} | email=${user.email}`,
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
        `Reminder job queued successfully | total=${successCount} | duration=${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      this.logger.error(
        'Failed to process pending task reminders',
        error?.stack ?? error,
      );
    }
  }

  @OnEvent(TaskAssignmentCreatedEvent.name, { async: true })
  async handleTaskAssignmentCreatedEvent(event: TaskAssignmentCreatedEvent) {
    const task = event.task;
    this.eventEmitter.emit(SendNotificationRequestEvent.name,
      new SendNotificationRequestEvent({
        targetUserIds: task.assignments.map(assignment => assignment.assignedTo.id),
        notificationKey: NotificationKeys.TASK_ASSIGNED,
        type: NotificationType.TASK,
        category: NotificationCategory.TASK,
        priority: NotificationPriority.HIGH,
        data: {
          task: task.toJson(),
        },
        referenceId: task.id,
        referenceType: 'task',
      }));
    this.corrService.sendTemplatedEmail({
      templateName: EmailTemplateName.TASK_ASSIGNED,
      data: { ...task.toJson(), workflowId: task.workflowId },
      options: {
        recipients: { to: task.assignments.map(assignment => assignment.assignedTo.email) }
      }
    })
  }

  @OnEvent(TaskStartedEvent.name, { async: true })
  async handleTaskStartedEvent(event: TaskStartedEvent) {
    const task = event.task;
    this.eventEmitter.emit(SendNotificationRequestEvent.name,
      new SendNotificationRequestEvent({
        targetUserIds: task.assignments.filter(a => a.status == TaskAssignmentStatus.REMOVED)
          .map(assignment => assignment.assignedTo.id),
        notificationKey: NotificationKeys.TASK_STARTED,
        type: NotificationType.TASK,
        category: NotificationCategory.TASK,
        priority: NotificationPriority.HIGH,
        data: {
          task: task.toJson(),
        },
        referenceId: task.id,
        referenceType: 'task',
      }));
    this.logger.warn(`TODO : Send email to user ${task.assignments.map(assignment => assignment.assignedTo.email)} about task started`)

    // this.corrService.sendTemplatedEmail({
    //   templateName: EmailTemplateName.TASK_STARTED,
    //   data: { ...task.toJson(), workflowId: task.workflowId },
    //   options: {
    //     recipients: { to: task.assignments.map(assignment => assignment.assignedTo.email) }
    //   }
    // })
  }

  @OnEvent(UserDeletedEvent.name, { async: true })
  async handleUserDeletedEvent(event: UserDeletedEvent) {
    this.logger.log(`Processing user deletion for user: ${event.user.id}`);
    const user = event.user;
    const tasks = await this.workflowInstanceRepository.findAllTasks({
      assignedTo: user.id,
      status: WorkflowTask.pendingTaskStatus,
      type: [WorkflowTaskType.MANUAL]
    })
    this.logger.log(`Found ${tasks.length} pending tasks for user: ${event.user.id}`);
    for (const task of tasks) {
      this.logger.log(`Reassigning task: ${task.id} for user: ${event.user.id}`);
      await this.reassignTaskUseCase.execute({
        taskId: task.id,
        instanceId: task.workflowId,
        fromDefinition: true
      })
      this.logger.log(`Reassigned task: ${task.id} for user: ${event.user.id}`);
    }

  }


}