import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';

export interface RejectAssignmentInput {
  instanceId: string;
  taskId: string;
  assignmentId: string;
  rejectedBy: string;
  rejectionReason?: string;
}

@Injectable()
export class RejectAssignmentUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: RejectAssignmentInput): Promise<EngineWorkflowInstance> {
    const instance = await this.instanceRepository.findById(
      input.instanceId,
      true,
    );
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${input.instanceId}`);
    }

    const step = instance.getCurrentStep();
    if (!step) {
      throw new BusinessException('No active step');
    }
    const task = step.tasks.find((t) => t.id === input.taskId);
    if (!task) {
      throw new BusinessException(`Task not found: ${input.taskId}`);
    }
    const assignment = task.assignments.find((a) => a.id === input.assignmentId);
    if (!assignment) {
      throw new BusinessException(`Assignment not found: ${input.assignmentId}`);
    }
    if (assignment.assigneeId !== input.rejectedBy) {
      throw new BusinessException('Only the assignee can reject this assignment');
    }

    assignment.reject(input.rejectionReason);

    await this.instanceRepository.update(input.instanceId, instance);
    return this.instanceRepository.findById(input.instanceId, true) as Promise<EngineWorkflowInstance>;
  }
}
