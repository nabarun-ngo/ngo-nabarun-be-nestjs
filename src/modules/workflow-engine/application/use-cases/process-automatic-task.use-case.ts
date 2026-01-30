import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import type { IWorkflowTaskHandlerRegistry } from '../interfaces/workflow-task-handler.interface';
import { WORKFLOW_TASK_HANDLER_REGISTRY } from '../interfaces/workflow-task-handler.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { EngineWorkflowTaskStatus } from '../../domain/model/engine-workflow-task.model';

export interface ProcessAutomaticTaskInput {
  instanceId: string;
  taskId: string;
}

/**
 * Manually trigger/process an automatic task
 * 
 * Use cases:
 * - Admin wants to manually re-run a failed automatic task
 * - Debugging/testing automatic task execution
 * - Retry logic for transient failures
 * 
 * This bypasses the normal job queue and executes the task synchronously
 * 
 * Security: Should be restricted to admin users only
 */
@Injectable()
export class ProcessAutomaticTaskUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
    @Inject(WORKFLOW_TASK_HANDLER_REGISTRY)
    private readonly handlerRegistry: IWorkflowTaskHandlerRegistry,
  ) {}

  async execute(input: ProcessAutomaticTaskInput) {
    // Load workflow instance
    const instance = await this.workflowRepository.findById(
      input.instanceId,
      true,
    );

    if (!instance) {
      throw new BusinessException(
        `Workflow instance not found: ${input.instanceId}`,
      );
    }

    // Find the task
    const step = instance.steps.find((s) =>
      s.tasks.some((t) => t.id === input.taskId),
    );
    const task = step?.tasks.find((t) => t.id === input.taskId);

    if (!task) {
      throw new BusinessException(
        `Task not found: ${input.taskId} in instance ${input.instanceId}`,
      );
    }

    // Validate task is automatic
    if (!task.isAutomatic()) {
      throw new BusinessException(
        `Task ${input.taskId} is not automatic (type: ${task.type})`,
      );
    }

    // Validate task is pending or failed (can retry)
    if (
      task.status !== EngineWorkflowTaskStatus.PENDING &&
      task.status !== EngineWorkflowTaskStatus.FAILED
    ) {
      throw new BusinessException(
        `Task ${input.taskId} cannot be processed (status: ${task.status})`,
      );
    }

    // Validate handler exists
    if (!task.handler) {
      throw new BusinessException(
        `Task ${input.taskId} has no handler configured`,
      );
    }

    try {
      // Mark task as in progress
      instance.updateTask(task.id, EngineWorkflowTaskStatus.IN_PROGRESS);

      // Get workflow context
      const context = instance.getContext();

      // Execute handler
      const resultData = await this.handlerRegistry.execute(
        task.handler,
        context,
        task.taskConfig ?? undefined,
      );

      // Mark task as completed
      instance.updateTask(
        task.id,
        EngineWorkflowTaskStatus.COMPLETED,
        undefined, // No user for automatic tasks
        'Task processed successfully (manual trigger)',
        resultData,
      );

      // Save updated instance
      await this.workflowRepository.update(instance.id, instance);

      return instance;
    } catch (error) {
      // Mark task as failed
      instance.updateTask(
        task.id,
        EngineWorkflowTaskStatus.FAILED,
        undefined,
        `Task execution failed: ${error?.message}`,
      );

      // Save failure state
      await this.workflowRepository.update(instance.id, instance);

      throw new BusinessException(
        `Failed to process task ${input.taskId}: ${error?.message}`,
      );
    }
  }
}
