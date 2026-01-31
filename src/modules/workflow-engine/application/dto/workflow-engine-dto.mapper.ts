import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowStep } from '../../domain/model/engine-workflow-step.model';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import {
  EngineWorkflowInstanceDto,
  EngineWorkflowStepDto,
  EngineWorkflowTaskDto,
  EngineTaskAssignmentDto,
} from './workflow-engine.dto';

export class WorkflowEngineDtoMapper {
  static toInstanceDto(instance: EngineWorkflowInstance): EngineWorkflowInstanceDto {
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
      completedAt: instance.completedAt,
      remarks: instance.remarks,
      steps: instance.steps.map((s) => this.toStepDto(s)),
    };
  }

  static toStepDto(step: EngineWorkflowStep): EngineWorkflowStepDto {
    return {
      id: step.id,
      instanceId: step.instanceId,
      stepId: step.stepId,
      name: step.name,
      description: step.description,
      status: step.status,
      orderIndex: step.orderIndex,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      tasks: step.tasks.map((t) => this.toTaskDto(t)),
    };
  }

  static toTaskDto(task: EngineWorkflowTask): EngineWorkflowTaskDto {
    return {
      id: task.id,
      stepId: task.stepId,
      instanceId: task.instanceId,
      taskId: task.taskId,
      name: task.name,
      description: task.description,
      type: task.type,
      status: task.status,
      handler: task.handler,
      resultData: task.resultData,
      completedById: task.completedById,
      completedAt: task.completedAt,
      remarks: task.remarks,
      assignments: task.assignments.map((a) => this.toAssignmentDto(a)),
    };
  }

  static toAssignmentDto(a: EngineTaskAssignment): EngineTaskAssignmentDto {
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
      acceptedAt: a.acceptedAt,
      rejectedAt: a.rejectedAt,
      rejectionReason: a.rejectionReason,
      dueAt: a.dueAt,
    };
  }
}
