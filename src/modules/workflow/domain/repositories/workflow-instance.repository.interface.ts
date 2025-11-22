import { IRepository } from '../../../../shared/interfaces/repository.interface';
import { WorkflowFilter, WorkflowInstance } from '../model/workflow-instance.model';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { TaskFilter, WorkflowTask } from '../model/workflow-task.model';
import { PagedResult } from 'src/shared/models/paged-result';


export interface IWorkflowInstanceRepository extends IRepository<WorkflowInstance, string,WorkflowFilter> {
  findTasksPaged(filter: BaseFilter<TaskFilter>): Promise<PagedResult<WorkflowTask>>;
  findById(id: string, includeSteps?: boolean): Promise<WorkflowInstance | null>;
  create(instance: WorkflowInstance): Promise<WorkflowInstance>;
  update(id: string, instance: WorkflowInstance): Promise<WorkflowInstance>;
  delete(id: string): Promise<void>;
}

export const WORKFLOW_INSTANCE_REPOSITORY = Symbol('WORKFLOW_INSTANCE_REPOSITORY');

