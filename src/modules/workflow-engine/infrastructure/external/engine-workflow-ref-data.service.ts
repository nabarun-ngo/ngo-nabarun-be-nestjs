import { Injectable } from '@nestjs/common';
import { RemoteConfigService } from 'src/modules/shared/firebase/remote-config/remote-config.service';
import { parsefromString, parseKeyValueConfigs } from 'src/shared/utilities/kv-config.util';
import type { EngineWorkflowDefinition } from '../../domain/vo/engine-workflow-def.vo';

/**
 * Service for loading workflow reference data from Firebase Remote Config
 * 
 * Provides metadata for:
 * - Workflow types (for dropdowns)
 * - Workflow statuses (for filtering)
 * - Task types and statuses (for UI display)
 * - Additional fields (dynamic form fields per workflow type)
 */
@Injectable()
export class EngineWorkflowRefDataService {
  constructor(private readonly remoteConfig: RemoteConfigService) {}

  /**
   * Get all workflow reference data (types, statuses, etc.)
   * Used to populate dropdowns, filters, and UI metadata
   */
  async getWorkflowRefData() {
    const keyValueConfigs = await this.remoteConfig.getAllKeyValues();

    const WORKFLOW_TYPES = parseKeyValueConfigs(
      keyValueConfigs['WORKFLOW_TYPES']?.value,
    );
    const ADDITIONAL_FIELDS = parseKeyValueConfigs(
      keyValueConfigs['ADDITIONAL_FIELDS']?.value,
    );
    const WORKFLOW_STATUS = parseKeyValueConfigs(
      keyValueConfigs['WORKFLOW_STATUS']?.value,
    );
    const WORKFLOW_STEP_STATUS = parseKeyValueConfigs(
      keyValueConfigs['WORKFLOW_STEP_STATUS']?.value,
    );
    const WORKFLOW_TASK_STATUS = parseKeyValueConfigs(
      keyValueConfigs['WORKFLOW_TASK_STATUS']?.value,
    );
    const WORKFLOW_TASK_TYPE = parseKeyValueConfigs(
      keyValueConfigs['WORKFLOW_TASK_TYPE']?.value,
    );

    return {
      workflowTypes: WORKFLOW_TYPES,
      visibleWorkflowTypes: WORKFLOW_TYPES.filter(
        (w) => w.getAttribute<boolean>('IS_VISIBLE') === true,
      ),
      additionalFields: ADDITIONAL_FIELDS,
      workflowStatus: WORKFLOW_STATUS,
      workflowStepStatus: WORKFLOW_STEP_STATUS,
      workflowTaskStatus: WORKFLOW_TASK_STATUS,
      workflowTaskType: WORKFLOW_TASK_TYPE,
      visibleTaskStatus: WORKFLOW_TASK_STATUS.filter(
        (w) => w.getAttribute<boolean>('IS_VISIBLE') === true,
      ),
    };
  }

  /**
   * Get additional fields (dynamic form fields) for a specific workflow type
   * 
   * @param type - Workflow type (e.g., 'JOIN_REQUEST', 'LEAVE_REQUEST')
   * @returns Array of field attributes for dynamic form rendering
   */
  async getAdditionalFields(type: string) {
    // Load workflow definition for this type
    const config = (await this.remoteConfig.getAllKeyValues())[type];
    if (!config || config.value == null) {
      return [];
    }

    const def = parsefromString<EngineWorkflowDefinition>(
      typeof config.value === 'string'
        ? config.value
        : JSON.stringify(config.value),
    );

    // Get all available additional fields
    const refData = await this.getWorkflowRefData();
    const activeFields = refData.additionalFields.filter((f) => f.ACTIVE);

    // Filter to only fields used by this workflow type
    return activeFields.filter((f) => def.fields?.includes(f.KEY));
  }
}
