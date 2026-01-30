import { EngineWorkflowInstance } from '../model/engine-workflow-instance.model';
import { EngineWorkflowTask } from '../model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../model/engine-task-assignment.model';
import { PagedResult } from 'src/shared/models/paged-result';
import { BaseFilter } from 'src/shared/models/base-filter-props';

export interface EngineWorkflowInstanceFilter {
  type?: string;
  status?: string[];
  initiatedById?: string;
  initiatedForId?: string;
}

export interface EngineTaskFilter {
  instanceId?: string;
  status?: string[];
  assignedTo?: string;
}

export interface EngineOverdueAssignmentFilter {
  assigneeId?: string;
  workflowType?: string;
}

export interface EngineTaskAssignmentFilter {
  assigneeId?: string;
  statuses?: string[];
  taskType?: string;
  instanceIds?: string[];
  taskIds?: string[];
}

export interface IEngineWorkflowInstanceRepository {
  findById(id: string, includeSteps?: boolean): Promise<EngineWorkflowInstance | null>;
  findPaged(filter: BaseFilter<EngineWorkflowInstanceFilter>): Promise<PagedResult<EngineWorkflowInstance>>;
  create(instance: EngineWorkflowInstance): Promise<EngineWorkflowInstance>;
  update(id: string, instance: EngineWorkflowInstance): Promise<EngineWorkflowInstance>;
  findTasksByInstance(instanceId: string): Promise<EngineWorkflowTask[]>;
  findOverdueAssignments(filter: EngineOverdueAssignmentFilter): Promise<EngineTaskAssignment[]>;
  findInstanceIdByAssignmentId(assignmentId: string): Promise<string | null>;
  findTaskAssignmentsPaged(filter: BaseFilter<EngineTaskAssignmentFilter>): Promise<PagedResult<EngineTaskAssignment>>;
}

export const ENGINE_WORKFLOW_INSTANCE_REPOSITORY = Symbol(
  'ENGINE_WORKFLOW_INSTANCE_REPOSITORY',
);
