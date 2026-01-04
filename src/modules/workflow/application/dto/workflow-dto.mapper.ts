import { FieldAttributeDto, TaskAssignmentDto, WorkflowInstanceDto, WorkflowStepDto, WorkflowTaskDto } from "./workflow.dto";
import { TaskAssignment } from "../../domain/model/task-assignment.model";
import { WorkflowInstance } from "../../domain/model/workflow-instance.model";
import { WorkflowStep } from "../../domain/model/workflow-step.model";
import { WorkflowTask } from "../../domain/model/workflow-task.model";
import { KeyValueConfig } from "src/shared/models/key-value-config.model";


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
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      requestData: domain.requestData ?? {},
      resultData: domain.requestData ?? {},
      initiatedById: domain.initiatedBy?.id ?? undefined,
      initiatedByName: domain.initiatedBy?.fullName ?? undefined,
      initiatedForId: domain.initiatedFor?.id ?? undefined,
      initiatedForName: domain.initiatedFor?.fullName ?? undefined,
      completedAt: domain.completedAt,
      remarks: domain.remarks,
      createdAt: domain.createdAt,
      updatedAt: domain.updatedAt,
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
      remarks: step.remarks,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      createdAt: step.createdAt,
      updatedAt: step.updatedAt,
      tasks: step.tasks.map(t => this.taskDomainToDto(t)),
    };
  }


  static taskDomainToDto(task: WorkflowTask): WorkflowTaskDto {
    return {
      id: task.id,
      stepId: task.stepId,
      taskId: task.taskId,
      name: task.name,
      workflowId: task.workflowId,
      description: task.description ?? undefined,
      type: task.type,
      status: task.status,
      handler: task.handler,
      checklist: task.checkList,
      assignedToId: task.assignedTo?.id,
      assignedToName: task.assignedTo?.fullName,
      jobId: task.jobId,
      resultData: undefined,
      completedAt: task.completedAt,
      completedById: task.completedBy?.id,
      completedByName: task.completedBy?.fullName,
      remarks: task.remarks,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      assignments: task.assignments.map(a => this.assignmentDomainToDto(a)),
    };
  }

  private static assignmentDomainToDto(a: TaskAssignment): TaskAssignmentDto {
    return {
      id: a.id,
      taskId: a.taskId,
      assignedToId: a.assignedTo.id,
      assignedToName: a.assignedTo.fullName!,
      roleName: a.roleName,
      status: a.status,
      acceptedAt: a.acceptedAt,
      completedAt: a.completedAt,
      notes: a.notes,
    };
  }

  static fieldAttributeDomainToDto(a: KeyValueConfig): FieldAttributeDto {
    return {
      key: a.KEY,
      value: a.VALUE,
      type: a.getAttribute('TYPE'),
      isMandatory: a.getAttribute('MANDATORY'),
      fieldOptions: a.getAttribute('FIELD_OPTIONS'),
      fieldType: a.getAttribute('FIELD_TYPE'),
      isHidden: a.getAttribute('HIDDEN'),
      isEncrypted: a.getAttribute('ENCRYPTED'),
    };
  }


}