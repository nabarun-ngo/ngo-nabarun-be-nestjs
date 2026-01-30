import { Injectable } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { parsefromString, parseKeyValueConfigs } from "src/shared/utilities/kv-config.util";
import { WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import Handlebars from "handlebars";

@Injectable()
export class WorkflowDefService {
    constructor(private readonly remoteConfig: RemoteConfigService) { }

    async findWorkflowByType(type: string, context?: Record<string, unknown>) {
        const config = (await this.remoteConfig.getAllKeyValues())[type];
        let value = config.value;
        if (value == null) {
            throw new Error(`Workflow definition not found for type: ${type}`);
        }
        if (context) {
            const template = Handlebars.compile(value);
            value = template(context);
        }
        return parsefromString<WorkflowDefinition>(value);
    }

    async getAdditionalFields(type: string) {
        const def = await this.findWorkflowByType(type);
        const additionalFields = (await this.getWorkflowRefData()).additionalFields.filter(f => f.ACTIVE);
        const requiredFields = additionalFields
            .filter(f => def.requiredFields.includes(f.KEY)).map(m => {
                m.ATTRIBUTES['MANDATORY'] = true
                return m;
            });
        const optionalFields = additionalFields.filter(f => def.optionalFields.includes(f.KEY)).map(m => {
            m.ATTRIBUTES['MANDATORY'] = false
            return m;
        });
        return [...requiredFields, ...optionalFields]
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