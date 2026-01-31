import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowStep } from '../../domain/model/engine-workflow-step.model';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { PagedResult } from 'src/shared/models/paged-result';

export interface WorkflowInstanceResponse {
  id: string;
  type: string;
  definitionVersion: number | null;
  name: string;
  description: string;
  status: string;
  contextData: Record<string, unknown>;
  activeStepIds: string[];
  initiatedById: string | null;
  initiatedForId: string | null;
  requestData: Record<string, unknown>;
  completedAt: string | null;
  remarks: string | null;
  createdAt?: string;
  updatedAt?: string;
  steps?: StepResponse[];
}

export interface StepResponse {
  id: string;
  stepId: string;
  name: string;
  description: string | null;
  status: string;
  orderIndex: number;
  startedAt: string | null;
  completedAt: string | null;
  remarks: string | null;
  tasks?: TaskResponse[];
}

export interface TaskResponse {
  id: string;
  taskId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  handler: string | null;
  completedById: string | null;
  completedAt: string | null;
  remarks: string | null;
  requireAcceptance: boolean;
  assignments?: AssignmentResponse[];
}

export interface AssignmentResponse {
  id: string;
  taskId: string;
  assigneeId: string | null;
  assigneeEmail?: string | null;
  assigneeName?: string | null;
  assigneeType: string;
  roleName: string | null;
  status: string;
  assignedById: string | null;
  acceptedAt: string | null;
  rejectedAt: string | null;
  rejectionReason: string | null;
  dueAt: string | null;
}

export function toInstanceResponse(instance: EngineWorkflowInstance): WorkflowInstanceResponse {
  const steps = instance.steps.map((s) => toStepResponse(s));
  return {
    id: instance.id,
    type: instance.type,
    definitionVersion: instance.definitionVersion,
    name: instance.name,
    description: instance.description,
    status: instance.status,
    contextData: instance.contextData,
    activeStepIds: instance.activeStepIds,
    initiatedById: instance.initiatedById,
    initiatedForId: instance.initiatedForId,
    requestData: instance.requestData,
    completedAt: instance.completedAt?.toISOString() ?? null,
    remarks: instance.remarks,
    steps,
  };
}

function toStepResponse(step: EngineWorkflowStep): StepResponse {
  const tasks = step.tasks.map((t) => toTaskResponse(t));
  return {
    id: step.id,
    stepId: step.stepId,
    name: step.name,
    description: step.description,
    status: step.status,
    orderIndex: step.orderIndex,
    startedAt: step.startedAt?.toISOString() ?? null,
    completedAt: step.completedAt?.toISOString() ?? null,
    remarks: step.remarks,
    tasks,
  };
}

function toTaskResponse(task: EngineWorkflowTask): TaskResponse {
  const assignments = task.assignments.map((a) => toAssignmentResponse(a));
  return {
    id: task.id,
    taskId: task.taskId,
    name: task.name,
    description: task.description,
    type: task.type,
    status: task.status,
    handler: task.handler,
    completedById: task.completedById,
    completedAt: task.completedAt?.toISOString() ?? null,
    remarks: task.remarks,
    requireAcceptance: task.requireAcceptance,
    assignments,
  };
}

export function toAssignmentResponse(a: EngineTaskAssignment): AssignmentResponse {
  return {
    id: a.id,
    taskId: a.taskId,
    assigneeId: a.assigneeId,
    assigneeEmail: a.assigneeEmail,
    assigneeName: a.assigneeName,
    assigneeType: a.assigneeType,
    roleName: a.roleName,
    status: a.status,
    assignedById: a.assignedById,
    acceptedAt: a.acceptedAt?.toISOString() ?? null,
    rejectedAt: a.rejectedAt?.toISOString() ?? null,
    rejectionReason: a.rejectionReason,
    dueAt: a.dueAt?.toISOString() ?? null,
  };
}

export function toPagedInstancesResponse(
  paged: PagedResult<EngineWorkflowInstance>,
): { items: WorkflowInstanceResponse[]; total: number; pageIndex: number; pageSize: number } {
  return {
    items: paged.content.map(toInstanceResponse),
    total: paged.totalSize,
    pageIndex: paged.pageIndex,
    pageSize: paged.pageSize,
  };
}
