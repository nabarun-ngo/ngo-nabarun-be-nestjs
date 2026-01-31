import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key for workflow handler decorator
 */
export const WORKFLOW_HANDLER_METADATA = 'WORKFLOW_HANDLER_NAME';

/**
 * Decorator to mark a class as a workflow task handler and specify its registration name.
 * 
 * Handlers decorated with this will be auto-discovered and registered on module init.
 * 
 * @param handlerName - The name to register the handler under (referenced in workflow definitions)
 * 
 * @example
 * ```typescript
 * @WorkflowHandler('ValidateInputs')
 * @Injectable()
 * export class ValidateInputsHandler implements WorkflowTaskHandler {
 *   async handle(context, taskConfig) {
 *     // implementation
 *   }
 * }
 * ```
 * 
 * In workflow definition:
 * ```json
 * {
 *   "taskId": "validate",
 *   "type": "AUTOMATIC",
 *   "handler": "ValidateInputs"  // <-- matches decorator name
 * }
 * ```
 */
export const WorkflowHandler = (handlerName: string): ClassDecorator => {
  return SetMetadata(WORKFLOW_HANDLER_METADATA, handlerName);
};
