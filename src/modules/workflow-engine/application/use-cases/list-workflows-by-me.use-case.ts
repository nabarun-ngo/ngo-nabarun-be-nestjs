import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { PagedResult } from 'src/shared/models/paged-result';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';

export interface ListWorkflowsByMeInput {
  userId: string; // Current user ID (initiatedById)
  pageIndex?: number;
  pageSize?: number;
  status?: string;
  type?: string;
}

/**
 * List workflows initiated BY the current user
 * 
 * Use case: User wants to see all workflows they created/started
 * Example: "Workflows I Created", "My Requests", etc.
 */
@Injectable()
export class ListWorkflowsByMeUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly workflowRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(input: ListWorkflowsByMeInput): Promise<PagedResult<EngineWorkflowInstance>> {
    return this.workflowRepository.findPaged({
      pageIndex: input.pageIndex,
      pageSize: input.pageSize,
      props: {
        initiatedById: input.userId,
        status: input.status ? [input.status] : undefined,
        type: input.type,
      },
    });
  }
}
