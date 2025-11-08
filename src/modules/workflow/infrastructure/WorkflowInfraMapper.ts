import { Prisma } from "generated/prisma";
import { WorkflowInstance, WorkflowInstanceStatus, WorkflowType } from "../domain/model/workflow-instance.model";
import { WorkflowStep, WorkflowStepStatus } from "../domain/model/workflow-step.model";
import { WorkflowTask } from "../domain/model/workflow-task.model";
import { TaskAssignment } from "../domain/model/task-assignment.model";
import { UserInfraMapper } from "src/modules/user/infrastructure/user-infra.mapper";


/**
 * Convert between Prisma persistence shape and Domain.
 * - toDomain(prismaRow) expects nested includes: steps -> tasks -> assignments
 * - toPersistence(domain) returns WorkflowInstanceUncheckedCreateInput (children handled separately)
 */
export class WorkflowInfraMapper {
  static toDomain(p: Prisma.WorkflowInstanceGetPayload<{
    include:{
      initiatedBy:true,
      initiatedFor:true,
      steps:{
        include:{
          tasks:{
            include:{
              assignments:true,
            }
          }
        }
      }
    }
  }>): WorkflowInstance {
    const instance = new WorkflowInstance(
      p.id,
      p.type as WorkflowType,
      p.name,
      p.description,
      p.status as WorkflowInstanceStatus,
      p.initiatedBy ? UserInfraMapper.toUser(p.initiatedBy) : undefined,
      p.initiatedFor ? UserInfraMapper.toUser(p.initiatedFor, []) : undefined,
      /*p.requestData ? JSON.parse(p.requestData) :*/ undefined,
      p.currentStepId ?? undefined,
      p.completedAt ?? undefined,
      p.remarks ?? undefined,
      p.createdAt,
      p.updatedAt,
    );

    if (p.steps && p.steps.length) {
      // ensure deterministic order
      const sorted = p.steps.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      sorted.forEach((s) => instance.addSteps(this.toStepDomain(s)));
    }

    return instance;
  }

  static toPersistence(domain: WorkflowInstance): Prisma.WorkflowInstanceUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      initiatedById: domain.initiatedBy?.id ?? null,
      initiatedForId: domain.initiatedFor?.id ?? null,
      //requestData: domain.requestData ? JSON.stringify(domain.requestData) : null,
      completedAt: domain.completedAt ?? null,
      remarks: domain.remarks ?? null,
      createdAt: (domain as any).createdAt ?? new Date(),
      updatedAt: (domain as any).updatedAt ?? new Date(),
      version: BigInt(0),
    };
  }

  private static toStepDomain(row: Prisma.WorkflowStepGetPayload<{
    include: {
      tasks: true,
    }
  }>): WorkflowStep {
    const s = new WorkflowStep(
      row.id,
      row.stepId,
      row.name,
      row.description!,
      row.status as WorkflowStepStatus,
      row.orderIndex,
      row.onSuccessStepId ?? undefined,
      row.onFailureStepId ?? undefined,
      row.completedAt ?? undefined,
      row.failureReason ?? undefined,
      row.startedAt ?? undefined,
      row.createdAt,
      row.updatedAt,
    );

    if (row.tasks && row.tasks.length) {
      const arr = (s as any)._tasks as any[];
      row.tasks.forEach((t: any) => arr.push(this.taskRowToDomain(t, s)));
    }

    return s;
  }

  private static taskRowToDomain(row: any, step: WorkflowStep): WorkflowTask {
    const t = new WorkflowTask(
      row.id,
      step,
      row.taskId,
      row.name,
      row.description ?? null,
      row.type as any,
      row.status as any,
      row.handler ?? undefined,
      row.checklist ? JSON.parse(row.checklist) : undefined,
      row.autoCloseable ?? undefined,
      row.assignedToId ? ({ userId: row.assignedToId } as any) : undefined,
      row.jobId ?? undefined,
      row.autoCloseRefId ?? undefined,
      row.completedAt ?? undefined,
      row.completedBy ?? undefined,
      row.failureReason ?? undefined,
      row.createdAt,
      row.updatedAt,
    );

    if (row.assignments && row.assignments.length) {
      const arr = (t as any)._assignments as any[];
      row.assignments.forEach((a: any) => arr.push(this.assignmentRowToDomain(a, t)));
    }

    return t;
  }

  private static assignmentRowToDomain(row: any, task: WorkflowTask): TaskAssignment {
    return new TaskAssignment(
      row.id,
      task.id,
      row.assignedToId,
      row.roleName ?? undefined,
      row.assignedBy ?? undefined,
      row.status,
      row.acceptedAt ?? undefined,
      row.completedAt ?? undefined,
      row.notes ?? undefined,
      row.createdAt,
      row.updatedAt,
    );
  }
}