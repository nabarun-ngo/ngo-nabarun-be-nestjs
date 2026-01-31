import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import {
  EngineWorkflowInstanceFilter,
} from '../../domain/repositories/engine-workflow-instance.repository.interface';

export interface ListWorkflowInstancesInput {
  type?: string;
  status?: string[];
  initiatedById?: string;
  initiatedForId?: string;
  pageIndex?: number;
  pageSize?: number;
}

@Injectable()
export class ListWorkflowInstancesUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(
    input: ListWorkflowInstancesInput,
  ): Promise<PagedResult<EngineWorkflowInstance>> {
    const filter = new BaseFilter<EngineWorkflowInstanceFilter>(
      {
        type: input.type,
        status: input.status,
        initiatedById: input.initiatedById,
        initiatedForId: input.initiatedForId,
      },
      input.pageIndex ?? 0,
      input.pageSize ?? 20,
    );
    return this.instanceRepository.findPaged(filter);
  }
}
