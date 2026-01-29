import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';

export interface ReassignTaskInput {
  instanceId: string;
  taskId: string;
  newAssigneeId: string;
  reassignedBy: string;
  remarks?: string;
}

@Injectable()
export class ReassignTaskUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: ReassignTaskInput): Promise<EngineWorkflowInstance> {
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
    const acceptedAssignment = task.assignments.find((a) => a.isAccepted());
    if (!acceptedAssignment) {
      throw new BusinessException('No accepted assignment to reassign');
    }
    if (acceptedAssignment.assigneeId !== input.reassignedBy) {
      throw new BusinessException('Only the current assignee (or authorized user) can reassign');
    }

    const newAssignment = EngineTaskAssignment.create({
      taskId: task.id,
      assigneeId: input.newAssigneeId,
      assignedById: input.reassignedBy,
      dueAt: acceptedAssignment.dueAt ?? undefined,
    });
    acceptedAssignment.markSuperseded(newAssignment.id);
    const otherAssignments = task.assignments.filter((a) => a.id !== acceptedAssignment.id);
    task.setAssignments([...otherAssignments, acceptedAssignment, newAssignment]);
    await this.instanceRepository.update(input.instanceId, instance);
    return this.instanceRepository.findById(input.instanceId, true) as Promise<EngineWorkflowInstance>;
  }

}
