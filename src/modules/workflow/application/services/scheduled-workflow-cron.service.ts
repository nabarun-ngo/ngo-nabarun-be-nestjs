import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Parser } from 'expr-eval';
import { JobProcessingService } from 'src/modules/shared/job-processing/services/job-processing.service';
import { RedisHashCacheService } from 'src/modules/shared/database/redis-hash-cache.service';
import { SendNotificationRequestEvent } from 'src/modules/shared/notification/application/events/send-notification-request.event';
import { NotificationCategory, NotificationPriority, NotificationType } from 'src/modules/shared/notification/domain/models/notification.model';
import { NotificationKeys } from 'src/shared/notification-keys';
import { APP_DOMAIN_EVENTS_KEY } from 'src/shared/system-events.handler';
import { DomainEventPayload } from 'src/shared/dto/domain-event-payload.dto';
import { JobName } from 'src/shared/job-names';
import { generateUniqueNDigitNumber } from 'src/shared/utilities/password-util';
import { CompleteTaskUseCase } from '../use-cases/complete-task.use-case';
import { type IWorkflowInstanceRepository, WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowTask, WorkflowTaskStatus, WorkflowTaskType } from '../../domain/model/workflow-task.model';
import { evaluateCondition } from 'src/shared/utilities/common.util';

export type WorkflowCronLogSink = {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, err: Error) => void;
};

@Injectable()
export class ScheduledWorkflowCronService {
    private readonly logger = new Logger(ScheduledWorkflowCronService.name);

    constructor(
        private readonly jobProcessingService: JobProcessingService,
        @Inject(WORKFLOW_INSTANCE_REPOSITORY)
        private readonly workflowInstanceRepository: IWorkflowInstanceRepository,
        private readonly eventEmitter: EventEmitter2,
        private readonly redisCache: RedisHashCacheService,
        private readonly completeTask: CompleteTaskUseCase,
    ) { }

    private sinkOrLogger(sink?: WorkflowCronLogSink): WorkflowCronLogSink {
        if (sink) {
            return sink;
        }
        return {
            log: (m) => this.logger.log(m),
            warn: (m) => this.logger.warn(m),
            error: (m, e) => this.logger.error(m, e.stack),
        };
    }

    async remindPendingTasks(sink?: WorkflowCronLogSink): Promise<void> {
        const event = this.sinkOrLogger(sink);
        const startedAt = Date.now();
        event.log('Remind pending tasks started');
        const tasks = await this.workflowInstanceRepository.findAllTasks({
            status: WorkflowTask.pendingTaskStatus,
        });
        event.log(`Found ${tasks.length} pending tasks`);
        const assignees = new Map(
            tasks.flatMap((t) => t.assignments).map((a) => [a.assignedTo.id, a.assignedTo]),
        );
        event.log(`Unique assignees count: ${assignees.size}`);
        let successCount = 0;
        for (const user of assignees.values()) {
            event.log(`Queueing reminder | userId=${user.id} | email=${user.email}`);
            await this.jobProcessingService.addJob(
                JobName.SEND_TASK_REMINDER_EMAIL,
                {
                    assigneeId: user.id,
                    assigneeName: user.fullName,
                    assigneeEmail: user.email,
                },
                { delay: generateUniqueNDigitNumber(5) },
            );
            successCount++;
        }
        this.eventEmitter.emit(
            SendNotificationRequestEvent.name,
            new SendNotificationRequestEvent({
                targetUserIds: [...assignees.keys()],
                notificationKey: NotificationKeys.TASK_REMINDER,
                type: NotificationType.REMINDER,
                category: NotificationCategory.WORKFLOW,
                priority: NotificationPriority.HIGH,
                data: {
                    taskCount: tasks.length,
                    criticalAlert: 'N',
                },
            }),
        );
        event.log(`Reminder job queued successfully | total=${successCount} | duration=${Date.now() - startedAt}ms`);
    }

    async autoCloseWorkflowTasks(sink?: WorkflowCronLogSink): Promise<void> {
        const event = this.sinkOrLogger(sink);
        const queueDepth = await this.redisCache.getList<DomainEventPayload>(APP_DOMAIN_EVENTS_KEY, 'events');
        if (!queueDepth || queueDepth.length === 0) {
            event.log('No pending events.');
            return;
        }
        const aggregateIds = [...new Set(queueDepth.map((e) => e.aggregateId))];
        const tasks = await this.workflowInstanceRepository.findAllTasks({
            autoCloseRefId: aggregateIds,
            status: WorkflowTask.pendingTaskStatus,
            type: [WorkflowTaskType.MANUAL],
        });
        event.log(`Fetched ${tasks.length} tasks for evaluation.`);
        for (const task of tasks) {
            const queryEvent = queueDepth.find(
                (e) => e.aggregateId === task.autoCloseRefId && e.eventName === task.autoCloseEventName,
            );
            event.log(`Evaluating task: ${task.id} for event: ${task.autoCloseEventName}`);
            if (queryEvent) {
                event.log(`Task: ${task.id} -> auto-closeable event name matched`);
                const result = evaluateCondition(task.autoCloseCondition!, queryEvent.data);
                if (result) {
                    event.log(`Task: ${task.id} -> auto-close condition matched ${JSON.stringify(task.autoCloseResultData)}`);
                    await this.completeTask.execute({
                        instanceId: task.workflowId,
                        taskId: task.id,
                        remarks: `Domain event trigger : Auto-closed by ${queryEvent.eventName || 'System Event'}`,
                        status: WorkflowTaskStatus.COMPLETED,
                        data: task.autoCloseResultData,
                        completedBy: { fullName: 'System' },
                    });
                    await this.redisCache.removeFromList(APP_DOMAIN_EVENTS_KEY, 'events', queryEvent);
                    event.log(`Task: ${task.id} -> auto-closed successfully`);
                } else {
                    event.warn(`Task: ${task.id} -> auto-close condition not matched`);
                }
            } else {
                event.warn(`Task: ${task.id} -> auto-closeable event name not matched`);
            }
        }
    }
}
