import { Injectable } from '@nestjs/common';
import { EngineWorkflowRefDataService } from '../../infrastructure/external/engine-workflow-ref-data.service';

/**
 * Get workflow reference data for UI dropdowns, filters, and metadata
 * 
 * Returns all static configuration data:
 * - Workflow types (for workflow type dropdown)
 * - Workflow statuses (for status filter)
 * - Task types and statuses (for task filtering)
 * - Additional fields metadata
 * 
 * Use case: Frontend needs to populate dropdowns and filters
 */
@Injectable()
export class GetReferenceDataUseCase {
  constructor(private readonly refDataService: EngineWorkflowRefDataService) {}

  async execute() {
    const refData = await this.refDataService.getWorkflowRefData();

    return {
      workflowTypes: refData.workflowTypes,
      visibleWorkflowTypes: refData.visibleWorkflowTypes,
      additionalFields: refData.additionalFields,
      workflowStatuses: refData.workflowStatus,
      workflowStepStatuses: refData.workflowStepStatus,
      workflowTaskStatuses: refData.workflowTaskStatus,
      workflowTaskTypes: refData.workflowTaskType,
      visibleTaskStatuses: refData.visibleTaskStatus,
      // Derived data for convenience
      outstandingTaskStatuses: refData.workflowTaskStatus.filter(
        (s) => !['COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED'].includes(s.KEY),
      ),
      completedTaskStatuses: refData.workflowTaskStatus.filter((s) =>
        ['COMPLETED', 'FAILED', 'SKIPPED', 'CANCELLED'].includes(s.KEY),
      ),
    };
  }
}
