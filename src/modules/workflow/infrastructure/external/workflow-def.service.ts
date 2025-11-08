import { Inject, Injectable } from "@nestjs/common";
import { RemoteConfigService } from "src/modules/shared/firebase/remote-config/remote-config.service";
import { parsefromString } from "src/shared/utilities/kv-config.util";
import { WorkflowDefinition } from "../../domain/vo/workflow-def.vo";
import { WorkflowType } from "../../domain/model/workflow-instance.model";

@Injectable()
export class WorkflowDefService{
    constructor(private readonly remoteConfig:RemoteConfigService){}

    async findWorkflowByType(type:WorkflowType){
        const config = (await this.remoteConfig.getAllKeyValues())[type];
        return parsefromString<WorkflowDefinition>(config.value);
    }

}