import { StartWorkflow } from "../use-cases/start-workflow.use-case";

export class CreateWorkflowRequestEvent {
    constructor(public readonly workflow: StartWorkflow) { }
}