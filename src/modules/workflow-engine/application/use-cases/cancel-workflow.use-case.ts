import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowInstanceStatus } from '../../domain/model/engine-workflow-instance.model';

export interface CancelWorkflowInput {
  instanceId: string;
  reason: string;
}

@Injectable()
export class CancelWorkflowUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: CancelWorkflowInput): Promise<EngineWorkflowInstance> {
    const instance = await this.instanceRepository.findById(
      input.instanceId,
      true,
    );
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${input.instanceId}`);
    }
    if (instance.status !== EngineWorkflowInstanceStatus.PENDING &&
        instance.status !== EngineWorkflowInstanceStatus.IN_PROGRESS) {
      throw new BusinessException(
        `Workflow instance cannot be cancelled in status: ${instance.status}`,
      );
    }

    instance.cancel(input.reason);
    await this.instanceRepository.update(input.instanceId, instance);
    return this.instanceRepository.findById(input.instanceId, true) as Promise<EngineWorkflowInstance>;
  }
}
