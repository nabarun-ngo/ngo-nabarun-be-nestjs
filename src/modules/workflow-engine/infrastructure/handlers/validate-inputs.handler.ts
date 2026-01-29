import { Injectable } from '@nestjs/common';
import { WorkflowTaskHandler } from '../../application/interfaces/workflow-task-handler.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { WorkflowHandler } from './workflow-handler.decorator';

/**
 * Example handler: Validates required fields in workflow input
 * Used in pre-creation tasks
 */
@WorkflowHandler('ValidateInputs')
@Injectable()
export class ValidateInputsHandler implements WorkflowTaskHandler {
  async handle(
    context: Record<string, unknown>,
    taskConfig?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const inputData = taskConfig ?? {};
    const requiredFields = (inputData.requiredFields as string[]) ?? [];
    const data = inputData.data as Record<string, unknown> ?? {};

    const missingFields: string[] = [];
    for (const field of requiredFields) {
      if (data[field] === undefined || data[field] === null || data[field] === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      throw new BusinessException(
        `Missing required fields: ${missingFields.join(', ')}`,
      );
    }

    return {
      validated: true,
      fields: requiredFields,
      timestamp: new Date().toISOString(),
    };
  }
}
