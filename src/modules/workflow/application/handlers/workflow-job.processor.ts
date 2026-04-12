import { Inject, Injectable } from '@nestjs/common';
import { ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import { type Job } from '../../../shared/job-processing/dto/job.dto';
import { WorkflowStep } from '../../domain/model/workflow-step.model';
import { StartWorkflowStepUseCase } from '../use-cases/start-workflow-step.use-case';
import { JobName } from 'src/shared/job-names';
import { type IWorkflowInstanceRepository, WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { EmailTemplateName } from 'src/shared/email-keys';
import { evaluateCondition, formatDate } from 'src/shared/utilities/common.util';
import { WorkflowTask, WorkflowTaskStatus, WorkflowTaskType } from '../../domain/model/workflow-task.model';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { SendNotificationRequestEvent } from 'src/modules/shared/notification/application/events/send-notification-request.event';
import { NotificationKeys } from 'src/shared/notification-keys';
import { NotificationCategory, NotificationPriority, NotificationType } from 'src/modules/shared/notification/domain/models/notification.model';
import { RedisHashCacheService } from 'src/modules/shared/database/redis-hash-cache.service';
import { CompleteTaskUseCase } from '../use-cases/complete-task.use-case';
import { DomainEventPayload } from 'src/shared/dto/domain-event-payload.dto';
import { APP_DOMAIN_EVENTS_KEY } from 'src/shared/system-events.handler';

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
    private readonly jobProcessingService: JobProcessingService,
    private readonly eventEmitter: EventEmitter2,
    private readonly startWorkflowStep: StartWorkflowStepUseCase,
    @Inject(WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowInstanceRepository: IWorkflowInstanceRepository,
    private readonly correspondenceService: CorrespondenceService,
    private readonly redisCache: RedisHashCacheService,
    private readonly completeTask: CompleteTaskUseCase,
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




  @ProcessJob({
    name: JobName.TriggerRemindPendingTasksEvent,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30 * 1000,
    }
  })
  async remindPendingTasks(job: Job<any>): Promise<void> {
    const startedAt = Date.now();
    job.log('Remind pending tasks started');

    try {
      const tasks =
        await this.workflowInstanceRepository.findAllTasks({
          status: WorkflowTask.pendingTaskStatus,
        });

      job.log(
        `Found ${tasks.length} pending tasks`,
      );

      const assignees = new Map(
        tasks
          .flatMap(t => t.assignments)
          .map(a => [a.assignedTo.id, a.assignedTo]),
      );

      job.log(
        `Unique assignees count: ${assignees.size}`,
      );

      let successCount = 0;

      for (const user of assignees.values()) {
        job.log(
          `Queueing reminder | userId=${user.id} | email=${user.email}`,
        );

        await this.jobProcessingService.addJob(
          JobName.SEND_TASK_REMINDER_EMAIL,
          {
            assigneeId: user.id,
            assigneeName: user.fullName,
            assigneeEmail: user.email,
          },
          {
            delay: generateUniqueNDigitNumber(5),
            parent: { id: job.id!, queue: 'default' },
          }
        );
        successCount++;
      }

      this.eventEmitter.emit(SendNotificationRequestEvent.name,
        new SendNotificationRequestEvent({
          targetUserIds: [...assignees.keys()],
          notificationKey: NotificationKeys.TASK_REMINDER,
          type: NotificationType.REMINDER,
          category: NotificationCategory.WORKFLOW,
          priority: NotificationPriority.HIGH,
          data: {
            taskCount: tasks.length,
            criticalAlert: 'N', // Todo Determine if there are any critical tasks
          },
        }));

      job.log(
        `Reminder job queued successfully | total=${successCount} | duration=${Date.now() - startedAt}ms`,
      );
    } catch (error) {
      job.log(
        `Failed to process pending task reminders ${error}`,

      );
    }
  }


  @ProcessJob({
    name: JobName.TriggerAutoCloseWorkflowTasksEvent,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 30 * 1000,
    }
  })
  async closePendingTasks(job: Job<any>) {

    // Get the full list of events currently in the Redis list
    const queueDepth = await this.redisCache.getList<DomainEventPayload>(APP_DOMAIN_EVENTS_KEY, 'events');
    if (!queueDepth || queueDepth.length === 0) {
      job.log('No pending events.');
      return;
    }

    const aggregateIds = [...new Set(queueDepth.map(e => e.aggregateId))];

    const tasks = await this.workflowInstanceRepository.findAllTasks({
      autoCloseRefId: aggregateIds,
      status: WorkflowTask.pendingTaskStatus,
      type: [WorkflowTaskType.MANUAL]
    })

    job.log(`Fetched ${tasks.length} tasks for evaluation.`);

    for (const task of tasks) {
      const queryEvent = queueDepth.find(e => e.aggregateId === task.autoCloseRefId && e.eventName === task.autoCloseEventName);
      job.log(`Evaluating task: ${task.id} for event: ${task.autoCloseEventName}`);
      if (queryEvent) {
        job.log(`Task: ${task.id} -> auto-closeable event name matched`);
        const result = evaluateCondition(task.autoCloseCondition!, queryEvent.data);
        if (result) {
          job.log(`Task: ${task.id} -> auto-close condition matched ${JSON.stringify(task.autoCloseResultData)}`);
          await this.completeTask.execute({
            instanceId: task.workflowId,
            taskId: task.id,
            remarks: `Domain event trigger : Auto-closed by ${queryEvent.eventName || 'System Event'}`,
            status: WorkflowTaskStatus.COMPLETED,
            data: task.autoCloseResultData,
            completedBy: { fullName: 'System' }
          });
          await this.redisCache.removeFromList(APP_DOMAIN_EVENTS_KEY, 'events', queryEvent);
          job.log(`Task: ${task.id} -> auto-closed successfully`);
        } else {
          job.log(`Task: ${task.id} -> auto-close condition not matched`);
        }
      } else {
        job.log(`Task: ${task.id} -> auto-closeable event name not matched`);
      }
    }
  }
}

