import { Injectable } from '@nestjs/common';
import { EngineWorkflowRefDataService } from '../../infrastructure/external/engine-workflow-ref-data.service';

export interface GetAdditionalFieldsInput {
  workflowType: string;
}

/**
 * Get additional fields (dynamic form fields) for a specific workflow type
 * 
 * Each workflow type may require different form fields
 * (e.g., JOIN_REQUEST needs 'reason', LEAVE_REQUEST needs 'startDate', 'endDate')
 * 
 * This use case returns the field definitions for dynamic form rendering
 * 
 * Use case: Frontend needs to render dynamic form fields based on selected workflow type
 */
@Injectable()
export class GetAdditionalFieldsUseCase {
  constructor(private readonly refDataService: EngineWorkflowRefDataService) {}

  async execute(input: GetAdditionalFieldsInput) {
    return this.refDataService.getAdditionalFields(input.workflowType);
  }
}
