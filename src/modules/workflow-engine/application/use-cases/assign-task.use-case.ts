import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';

export interface AssignTaskInput {
  instanceId: string;
  taskId: string;
  assigneeId: string;
  dueAt?: Date;
}

@Injectable()
export class AssignTaskUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: AssignTaskInput): Promise<EngineWorkflowInstance> {
    const instance = await this.instanceRepository.findById(
      input.instanceId,
      true,
    );
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${input.instanceId}`);
    }

    const task = this.findTaskInInstance(instance, input.taskId);
    if (!task) {
      throw new BusinessException(`Task not found: ${input.taskId}`);
    }
    if (!task.isManual()) {
      throw new BusinessException(`Task is not manual: ${input.taskId}`);
    }

    const newAssignment = EngineTaskAssignment.create({
      taskId: task.id,
      assigneeId: input.assigneeId,
      dueAt: input.dueAt ?? undefined,
    });

    task.setAssignments([...task.assignments, newAssignment]);
    await this.instanceRepository.update(input.instanceId, instance);
    return this.instanceRepository.findById(input.instanceId, true) as Promise<EngineWorkflowInstance>;
  }

  private findTaskInInstance(
    instance: EngineWorkflowInstance,
    taskId: string,
  ): EngineWorkflowTask | null {
    for (const step of instance.steps) {
      const task = step.tasks.find((t) => t.id === taskId);
      if (task) return task;
    }
    return null;
  }
}
