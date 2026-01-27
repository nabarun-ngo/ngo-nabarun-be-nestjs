import { Injectable } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { parsefromString, parseKeyValueConfigs } from "src/shared/utilities/kv-config.util";
import { WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { WorkflowType } from "../../domain/model/workflow-instance.model";

@Injectable()
export class WorkflowDefService {
    constructor(private readonly remoteConfig: RemoteConfigService) { }

    async findWorkflowByType(type: WorkflowType) {
        const config = (await this.remoteConfig.getAllKeyValues())[type];
        return parsefromString<WorkflowDefinition>(config.value);
    }

    async getAdditionalFields(type: WorkflowType) {
        const def = await this.findWorkflowByType(type);
        const additionalFields = (await this.getWorkflowRefData()).additionalFields.filter(f => f.ACTIVE);
        return additionalFields.filter(f => def.fields.includes(f.KEY));
    }

    async getWorkflowRefData() {
        const keyValueConfigs = await this.remoteConfig.getAllKeyValues()
        const WORKFLOW_TYPES = parseKeyValueConfigs(keyValueConfigs['WORKFLOW_TYPES'].value);
        const ADDITIONAL_FIELDS = parseKeyValueConfigs(keyValueConfigs['ADDITIONAL_FIELDS'].value);
        const WORKFLOW_STATUS = parseKeyValueConfigs(keyValueConfigs['WORKFLOW_STATUS'].value);

        const WORKFLOW_STEP_STATUS = parseKeyValueConfigs(keyValueConfigs['WORKFLOW_STEP_STATUS'].value);
        const WORKFLOW_TASK_STATUS = parseKeyValueConfigs(keyValueConfigs['WORKFLOW_TASK_STATUS'].value);
        const WORKFLOW_TASK_TYPE = parseKeyValueConfigs(keyValueConfigs['WORKFLOW_TASK_TYPE'].value);
        return {
            workflowTypes: WORKFLOW_TYPES,
            visibleWorkflowTypes: WORKFLOW_TYPES.filter(w => w.getAttribute<boolean>('IS_VISIBLE') === true),
            additionalFields: ADDITIONAL_FIELDS,
            workflowStatus: WORKFLOW_STATUS,
            workflowStepStatus: WORKFLOW_STEP_STATUS,
            workflowTaskStatus: WORKFLOW_TASK_STATUS,
            workflowTaskType: WORKFLOW_TASK_TYPE,
            visibleTaskStatus: WORKFLOW_TASK_STATUS.filter(w => w.getAttribute<boolean>('IS_VISIBLE') === true),
        }
    }

}