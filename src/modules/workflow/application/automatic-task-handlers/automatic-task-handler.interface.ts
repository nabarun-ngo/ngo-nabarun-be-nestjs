import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { TaskDef, WorkflowDefinition } from "../../domain/vo/workflow-def.vo";

export interface IAutomaticTaskHandler {
    handlerName: string;
    handle(task: WorkflowTask | TaskDef, requestData?: Record<string, any>, definition?: WorkflowDefinition): Promise<void>;
}
