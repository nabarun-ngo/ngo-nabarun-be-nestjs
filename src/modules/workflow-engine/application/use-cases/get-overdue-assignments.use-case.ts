import { Inject, Injectable } from '@nestjs/common';
import type { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { ENGINE_WORKFLOW_INSTANCE_REPOSITORY } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { EngineOverdueAssignmentFilter } from '../../domain/repositories/engine-workflow-instance.repository.interface';

export interface GetOverdueAssignmentsInput {
  assigneeId?: string;
  workflowType?: string;
}

@Injectable()
export class GetOverdueAssignmentsUseCase {
  constructor(
    @Inject(ENGINE_WORKFLOW_INSTANCE_REPOSITORY)
    private readonly instanceRepository: IEngineWorkflowInstanceRepository,
  ) {}

  async execute(
    input: GetOverdueAssignmentsInput,
  ): Promise<EngineTaskAssignment[]> {
    const filter: EngineOverdueAssignmentFilter = {
      assigneeId: input.assigneeId,
      workflowType: input.workflowType,
    };
    return this.instanceRepository.findOverdueAssignments(filter);
  }
}
