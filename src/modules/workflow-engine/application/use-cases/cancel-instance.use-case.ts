import { Inject, Injectable } from '@nestjs/common';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';

export interface CancelInstanceInput {
  instanceId: string;
  reason?: string;
}

@Injectable()
export class CancelInstanceUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: CancelInstanceInput): Promise<void> {
    const instance = await this.instanceRepository.findById(
      input.instanceId,
      false,
    );
    if (!instance) {
      throw new BusinessException(`Workflow instance not found: ${input.instanceId}`);
    }

    instance.cancel(input.reason ?? 'Cancelled');
    await this.instanceRepository.update(input.instanceId, instance);
  }
}
