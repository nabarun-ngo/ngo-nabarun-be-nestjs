import { EngineWorkflowDefinition } from '../vo/engine-workflow-def.vo';

export interface IWorkflowDefinitionSource {
  findByType(type: string, version?: number): Promise<EngineWorkflowDefinition | null>;
  listTypes(): Promise<string[]>;
}
