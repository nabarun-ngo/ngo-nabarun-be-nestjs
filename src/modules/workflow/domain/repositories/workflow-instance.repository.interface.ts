import { IRepository } from '../../../../shared/interfaces/repository.interface';
import { WorkflowInstance } from '../model/workflow-instance.model';

export interface IWorkflowInstanceRepository extends IRepository<WorkflowInstance, string> {
  findById(id: string, includeSteps?: boolean): Promise<WorkflowInstance | null>;
  findByType(type: string, status?: string): Promise<WorkflowInstance[]>;
  findByInitiator(initiatedBy: string): Promise<WorkflowInstance[]>;
  findByStatus(status: string): Promise<WorkflowInstance[]>;
  create(instance: WorkflowInstance): Promise<WorkflowInstance>;
  update(id: string, instance: WorkflowInstance): Promise<WorkflowInstance>;
  delete(id: string): Promise<void>;
}

export const WORKFLOW_INSTANCE_REPOSITORY = Symbol('WORKFLOW_INSTANCE_REPOSITORY');

