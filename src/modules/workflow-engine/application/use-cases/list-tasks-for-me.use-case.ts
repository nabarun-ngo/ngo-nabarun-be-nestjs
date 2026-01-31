import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { PagedResult } from 'src/shared/models/paged-result';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';

export interface ListTasksForMeInput {
  userId: string; // Current user ID (assigneeId)
  pageIndex?: number;
  pageSize?: number;
  completed?: boolean; // true = completed tasks, false = pending tasks, undefined = all
  type?: string; // MANUAL, AUTOMATIC
  workflowId?: string;
  taskId?: string;
}

/**
 * List tasks assigned to the current user
 * 
 * Use case: User wants to see their assigned tasks
 * - Filter by completion status (pending vs completed)
 * - Filter by task type (manual vs automatic)
 * - Filter by specific workflow or task
 * 
 * Example: "My Pending Tasks", "My Completed Tasks", etc.
 */
@Injectable()
export class ListTasksForMeUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: ListTasksForMeInput): Promise<PagedResult<EngineTaskAssignment>> {
    // Build status filter based on completion flag
    let statuses: string[] | undefined;
    
    if (input.completed === true) {
      // Completed tasks: ACCEPTED + task is COMPLETED
      statuses = ['ACCEPTED']; // Assignment status
      // Note: Task completion is checked at task level, not assignment level
    } else if (input.completed === false) {
      // Pending tasks: PENDING or ACCEPTED (but task not completed)
      statuses = ['PENDING', 'ACCEPTED'];
    }
    // If undefined, return all statuses

    return this.workflowRepository.findTaskAssignmentsPaged({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      props: {
        assigneeId: input.userId,
        statuses,
        taskType: input.type,
        instanceIds: input.workflowId ? [input.workflowId] : undefined,
        taskIds: input.taskId ? [input.taskId] : undefined,
      },
    });
  }
}
