import { TaskAssignmentDto, WorkflowInstanceDto, WorkflowStepDto, WorkflowTaskDto } from "../application/dto/start-workflow.dto";
import { TaskAssignment } from "../domain/model/task-assignment.model";
import { WorkflowInstance } from "../domain/model/workflow-instance.model";
import { WorkflowStep } from "../domain/model/workflow-step.model";
import { WorkflowTask } from "../domain/model/workflow-task.model";


/**
 * Converts between DTOs and Domain aggregate.
 * - toDomain(dto) hydrates the domain aggregate from DTO (no domain events).
 * - toDto(domain) creates the DTO representation.
 */
export class WorkflowDtoMapper {

  static toDto(domain: WorkflowInstance): WorkflowInstanceDto {
    return {
      id: domain.id,
      type: domain.type,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      requestData: domain.requestData ?? {},
      resultData: undefined,
      initiatedBy: domain.initiatedBy,
      completedBy: undefined,
      completedAt: domain.completedAt,
      failureReason: domain.remarks,
      createdAt: (domain as any).createdAt,
      updatedAt: (domain as any).updatedAt,
      steps: domain.steps.map(s => this.stepDomainToDto(s)),
    };
  }

  private static stepDomainToDto(step: WorkflowStep): WorkflowStepDto {
    return {
      id: step.id,
      stepId: step.stepId,
      name: step.name,
      description: step.description ?? undefined,
      status: step.status,
      orderIndex: step.orderIndex,
      failureReason: step.failureReason,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
      tasks: step.tasks.map(t => this.taskDomainToDto(t)),
    };
  }


  private static taskDomainToDto(task: WorkflowTask): WorkflowTaskDto {
    return {
      id: task.id,
      stepId: task.stepId,
      taskId: task.taskId,
      name: task.name,
      description: task.description ?? undefined,
      type: task.type,
      status: task.status,
      handler: task.handler,
      checklist: task.checkList,
      assignedTo: task.assignedTo?.userId,
      jobId: task.jobId,
      resultData: undefined,
      completedAt: task.completedAt,
      completedBy: task.completedBy,
      failureReason: task.failureReason,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignments: task.assignments.map(a => this.assignmentDomainToDto(a)),
    };
  }

  private static assignmentDomainToDto(a: TaskAssignment): TaskAssignmentDto {
    return {
      id: a.id,
      taskId: a.taskId,
      assignedTo: a.assignedTo.id,
      roleName: a.roleName,
      status: a.status,
      acceptedAt: a.acceptedAt,
      completedAt: a.completedAt,
      notes: a.notes,
    };
  }
}