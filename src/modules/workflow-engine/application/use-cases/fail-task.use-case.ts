import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowInstanceStatus } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowTaskStatus } from '../../domain/model/engine-workflow-task.model';

export interface FailTaskInput {
  instanceId: string;
  taskId: string;
  completedBy?: string;
  remarks: string;
}

@Injectable()
export class FailTaskUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: FailTaskInput): Promise<EngineWorkflowInstance> {
    const instance = await this.instanceRepository.findById(
      input.instanceId,
      true,
    );
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${input.instanceId}`);
    }
    if (instance.status !== EngineWorkflowInstanceStatus.IN_PROGRESS) {
      throw new BusinessException(
        `Workflow instance is not in progress: ${input.instanceId}`,
      );
    }

    instance.updateTask(
      input.taskId,
      EngineWorkflowTaskStatus.FAILED,
      input.completedBy,
      input.remarks,
    );

    await this.instanceRepository.update(input.instanceId, instance);
    return this.instanceRepository.findById(input.instanceId, true) as Promise<EngineWorkflowInstance>;
  }
}
