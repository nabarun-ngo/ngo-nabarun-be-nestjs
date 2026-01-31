import { Inject, Injectable } from '@nestjs/common';
import { ProcessJob } from '../../../shared/job-processing/decorators/process-job.decorator';
import type { Job } from '../../../shared/job-processing/interfaces/job.interface';
import { JobName } from 'src/shared/job-names';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { CronLogger } from 'src/shared/utils/trace-context.util';
import { CorrespondenceService } from 'src/modules/shared/correspondence/services/correspondence.service';
import { EmailTemplateName } from 'src/shared/email-keys';
import { formatDate } from 'src/shared/utilities/common.util';
import type { IWorkflowTaskHandlerRegistry } from '../interfaces/workflow-task-handler.interface';
import { WORKFLOW_TASK_HANDLER_REGISTRY } from '../interfaces/workflow-task-handler.interface';
import { EngineWorkflowTaskStatus } from '../../domain/model/engine-workflow-task.model';
import type { IUserRepository } from 'src/modules/user/domain/repositories/user.repository.interface';
import { USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';

/**
 * Job processor for workflow engine async operations.
 * 
 * Responsibilities:
 * - Process automatic tasks in workflow steps
 * - Send task reminder emails to assignees
 * - Execute long-running workflow operations asynchronously
 * 
 * Pattern: Background job processing
 * - Jobs queued by event handlers
 * - Executed asynchronously by BullMQ workers
 * - Retries on failure (configurable)
 * - Prevents blocking the main request thread
 */
@Injectable()
export class EngineWorkflowJobProcessor {
  private readonly logger = new CronLogger(EngineWorkflowJobProcessor.name);

  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
    @Inject(WORKFLOW_TASK_HANDLER_REGISTRY)
    private readonly handlerRegistry: IWorkflowTaskHandlerRegistry,
    private readonly correspondenceService: CorrespondenceService,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Process automatic tasks in a workflow step
   * 
   * Finds all AUTOMATIC tasks in the step and executes them sequentially
   * using the registered task handlers.
   */
  @ProcessJob({
    name: JobName.ENGINE_PROCESS_STEP,
  })
  async processStep(
    job: Job<{ instanceId: string; stepId: string }>,
  ): Promise<void> {
    const { instanceId, stepId } = job.data;

    this.logger.log(
      `[Job] Processing step: instanceId=${instanceId}, stepId=${stepId}`,
    );

    try {
      const instance = await this.workflowRepository.findById(instanceId, true);

      if (!instance) {
        this.logger.error(`[Job] Workflow instance not found: ${instanceId}`);
        return;
      }

      const step = instance.steps.find((s) => s.stepId === stepId);

      if (!step) {
        this.logger.error(
          `[Job] Step not found: instanceId=${instanceId}, stepId=${stepId}`,
        );
        return;
      }

      // Find all automatic tasks in this step
      const automaticTasks = step.tasks.filter(
        (t) => t.type === 'AUTOMATIC' && t.status === EngineWorkflowTaskStatus.PENDING,
      );

      this.logger.log(
        `[Job] Found ${automaticTasks.length} automatic task(s) in step ${stepId}`,
      );

      // Execute automatic tasks sequentially
      for (const task of automaticTasks) {
        if (!task.handler) {
          this.logger.warn(
            `[Job] Task has no handler: taskId=${task.id}, skipping`,
          );
          continue;
        }

        this.logger.log(`[Job] Executing task: taskId=${task.id}, handler=${task.handler}`);

        try {
          // Get workflow context
          const context = instance.getContext();

          // Execute handler
          const resultData = await this.handlerRegistry.execute(
            task.handler,
            context,
            task.taskConfig ?? undefined,
          );

          // Update task status to completed
          instance.updateTask(
            task.id,
            EngineWorkflowTaskStatus.COMPLETED,
            undefined, // No user for automatic tasks
            'Automatic task completed',
            resultData,
          );

          this.logger.log(
            `[Job] Task completed successfully: taskId=${task.id}`,
          );
        } catch (error) {
          this.logger.error(
            `[Job] Task failed: taskId=${task.id}, error=${error?.message}`,
            error?.stack,
          );

          // Mark task as failed
          instance.updateTask(
            task.id,
            EngineWorkflowTaskStatus.FAILED,
            undefined,
            `Task execution failed: ${error?.message}`,
          );

          // If task is critical, fail the workflow
          // TODO: Add task configuration for critical/optional tasks
          throw error;
        }
      }

      // Save updated instance
      await this.workflowRepository.update(instanceId, instance);

      this.logger.log(
        `[Job] Step processing completed: instanceId=${instanceId}, stepId=${stepId}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job] Failed to process step: instanceId=${instanceId}, stepId=${stepId}`,
        error?.stack ?? error,
      );
      throw error; // Re-throw for retry mechanism
    }
  }

  /**
   * Send task reminder email to assignee
   * 
   * Finds all overdue assignments for the assignee and sends
   * a consolidated reminder email with task details.
   */
  @ProcessJob({
    name: JobName.ENGINE_SEND_TASK_REMINDER,
  })
  async processSendTaskReminder(
    job: Job<{ assigneeId: string }>,
  ): Promise<void> {
    const { assigneeId } = job.data;

    this.logger.log(
      `[Job] Processing task reminder: assigneeId=${assigneeId}`,
    );

    try {
      // Get user details
      const user = await this.userRepository.findById(assigneeId);

      if (!user || !user.email) {
        this.logger.warn(
          `[Job] User not found or no email: assigneeId=${assigneeId}`,
        );
        return;
      }

      // Find all overdue assignments for this user
      const overdueAssignments =
        await this.workflowRepository.findOverdueAssignments({
          assigneeId,
        });

      if (overdueAssignments.length === 0) {
        this.logger.log(
          `[Job] No overdue assignments found for user: assigneeId=${assigneeId}`,
        );
        return;
      }

      // Get email template
      const templateData = await this.correspondenceService.getEmailTemplateData(
        EmailTemplateName.TASK_REMINDER,
        {
          data: {
            assigneeName: user.fullName,
            taskCount: overdueAssignments.length,
          },
        },
      );

      // Populate task table
      if (templateData.body?.content?.table?.[0]?.data) {
        templateData.body.content.table[0].data = [
          ...templateData.body.content.table[0].data,
          ...overdueAssignments.map((assignment) => [
            assignment.id,
            assignment.taskId,
            assignment.dueAt ? formatDate(assignment.dueAt) : 'N/A',
          ]),
        ];
      }

      // Send email
      await this.correspondenceService.sendTemplatedEmail({
        options: {
          recipients: {
            to: user.email,
          },
        },
        templateData,
      });

      this.logger.log(
        `[Job] Reminder email sent: assigneeId=${assigneeId}, email=${user.email}, tasks=${overdueAssignments.length}`,
      );
    } catch (error) {
      this.logger.error(
        `[Job] Failed to send task reminder: assigneeId=${assigneeId}`,
        error?.stack ?? error,
      );
      throw error; // Re-throw for retry mechanism
    }
  }
}
