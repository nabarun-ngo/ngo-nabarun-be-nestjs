import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { PagedResult } from 'src/shared/models/paged-result';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';

export interface ListWorkflowsForMeInput {
  userId: string; // Current user ID (initiatedForId)
  pageIndex?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}

/**
 * List workflows where the current user is the beneficiary (initiatedForId)
 * 
 * Use case: User wants to see all workflows initiated FOR them
 * Example: "My Onboarding", "My Leave Requests", etc.
 */
@Injectable()
export class ListWorkflowsForMeUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: ListWorkflowsForMeInput): Promise<PagedResult<EngineWorkflowInstance>> {
    return this.workflowRepository.findPaged({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      props: {
        initiatedForId: input.userId,
        status: input.status ? [input.status] : undefined,
        type: input.type,
      },
    });
  }
}
