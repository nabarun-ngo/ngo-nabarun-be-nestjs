import { WorkflowInstance, WorkflowInstanceStatus, WorkflowType } from '../domain/model/workflow-instance.model';
import { WorkflowStep, WorkflowStepStatus } from '../domain/model/workflow-step.model';
import { WorkflowTask, WorkflowTaskType, WorkflowTaskStatus } from '../domain/model/workflow-task.model';
import { TaskAssignment, TaskAssignmentStatus } from '../domain/model/task-assignment.model';
import { Prisma, TaskAssignment as PrismaTaskAssignment } from '@prisma/client';
import { PrismaWorkflowInstanceWithSteps, PrismaWorkflowInstanceWithTasks, PrismaWorkflowTasks } from './persistence/workflow-instance.repository';

export class WorkflowInfraMapper {
  static toDomainWithSteps(prisma: PrismaWorkflowInstanceWithSteps) {
    const instance = new WorkflowInstance(
      prisma.id,
      prisma.type as WorkflowType,
      prisma.name,
      prisma.description,
      prisma.status as WorkflowInstanceStatus,
      prisma.initiatedBy?.id,
      prisma.initiatedFor?.id,
      undefined,
      prisma.currentStepId ?? undefined,
      prisma.completedAt ?? undefined,
      prisma.remarks ?? undefined,
      prisma.createdAt,
      prisma.updatedAt,
    );

    // Steps if included
    if (prisma.steps) {
      const sorted = prisma.steps.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      sorted.forEach((s) => {
        const step = new WorkflowStep(
          s.id,
          s.stepId,
          s.name,
          s.description ?? '',
          s.status as WorkflowStepStatus,
          s.orderIndex,
          s.onSuccessStepId ?? undefined,
          s.onFailureStepId ?? undefined,
          s.completedAt ?? undefined,
          s.failureReason ?? undefined,
          s.startedAt ?? undefined,
          s.createdAt,
          s.updatedAt,
        );
        instance.addSteps(step);
      });
    }

    return instance;
  }


  /**
   * Convert Prisma persistence shape (with only steps) to Domain model
   * Used by repository for queries with steps included
   */

  static toDomainWithTasks(prisma: PrismaWorkflowInstanceWithTasks): WorkflowInstance {
    const instance = new WorkflowInstance(
      prisma.id,
      prisma.type as WorkflowType,
      prisma.name,
      prisma.description,
      prisma.status as WorkflowInstanceStatus,
      prisma.initiatedBy?.id,
      prisma.initiatedFor?.id,
      undefined,
      prisma.currentStepId ?? undefined,
      prisma.completedAt ?? undefined,
      prisma.remarks ?? undefined,
      prisma.createdAt,
      prisma.updatedAt,
    );

    // Steps if included
    if (prisma.steps) {
      const sorted = prisma.steps.slice().sort((a, b) => a.orderIndex - b.orderIndex);
      sorted.forEach((s) => {
        const step = new WorkflowStep(
          s.id,
          s.stepId,
          s.name,
          s.description ?? '',
          s.status as WorkflowStepStatus,
          s.orderIndex,
          s.onSuccessStepId ?? undefined,
          s.onFailureStepId ?? undefined,
          s.completedAt ?? undefined,
          s.failureReason ?? undefined,
          s.startedAt ?? undefined,
          s.createdAt,
          s.updatedAt,
        );

        // Tasks if included
        if (s.tasks) {
          const tasks = s.tasks.map((t) => {
            return this.toWorkflowTask(t);
          });
          step.setTasks(tasks);
        }

        instance.addSteps(step);
      });
    }

    return instance;
  }

  static toWorkflowTask(
    prisma:PrismaWorkflowTasks
  ): WorkflowTask {
    const task = new WorkflowTask(
      prisma.id,
      { id: prisma.stepId } as WorkflowStep,
      prisma.taskId,
      prisma.name,
      prisma.description,
      prisma.type as WorkflowTaskType,
      prisma.status as WorkflowTaskStatus,
      prisma.handler || undefined,
      prisma.checklist?.split('!~!'),
      prisma.autoCloseable || undefined,
      undefined,
      prisma.jobId || undefined,
      prisma.autoCloseRefId || undefined,
      prisma.completedAt || undefined,
      undefined,
      prisma.failureReason || undefined,
      prisma.createdAt,
      prisma.updatedAt,
    );

    if (prisma.assignments) {
      const assignments = prisma.assignments.map((assignment: PrismaTaskAssignment) =>
      this.toTaskAssignment(assignment),
      );
      task.setAssignments(assignments);
    }

    return task;
  }

  static toTaskAssignment(prisma: PrismaTaskAssignment): TaskAssignment {
    return new TaskAssignment(
      prisma.id,
      prisma.taskId,
      undefined as any, // User mapping requires proper includes
      prisma.roleName || null,
      prisma.status as TaskAssignmentStatus,
      prisma.createdAt,
      prisma.updatedAt,
      prisma.assignedBy || undefined,
      prisma.acceptedAt || undefined,
      prisma.completedAt || undefined,
      prisma.notes || undefined,
    );
  }



  /**
   * Convert Domain model to Prisma create input
   * Used for creating new workflow instances
   */
  static toWorkflowInstanceCreatePersistence(domain: WorkflowInstance): Prisma.WorkflowInstanceCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      completedAt: domain.completedAt ?? null,
      remarks: domain.remarks ?? null,
      createdAt: domain.createdAt ?? new Date(),
      updatedAt: domain.updatedAt ?? new Date(),
      //version: BigInt(0),
      initiatedBy: { connect: { id: domain.initiatedBy! } },
      initiatedFor: { connect: { id: domain.initiatedFor! } },
      // steps: handled separately via nested create/update
    };
  }

  /**
   * Convert Domain model to Prisma update input
   * Used for updating existing workflow instances
   */
  static toWorkflowInstanceUpdatePersistence(domain: WorkflowInstance): Prisma.WorkflowInstanceUncheckedUpdateInput {
    return {
      name: domain.name,
      type: domain.type,
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      initiatedById: domain.initiatedBy ?? null,
      initiatedForId: domain.initiatedFor ?? null,
      completedAt: domain.completedAt ?? null,
      remarks: domain.remarks ?? null,
      updatedAt: new Date(),
      // steps: handled separately via nested create/update
    };
  }

  /**
   * Convert Domain WorkflowStep to Prisma persistence
   * Used for creating and updating workflow steps
   */
  static toWorkflowStepPersistence(domain: WorkflowStep) {
    return {
      id: domain.id,
      //instanceId: domain.instanceId,//no need to set instance id separately
      stepId: domain.stepId,
      name: domain.name,
      description: domain.description ?? null,
      status: domain.status,
      orderIndex: domain.orderIndex,
      onSuccessStepId: domain.onSuccessStepId ?? null,
      onFailureStepId: domain.onFailureStepId ?? null,
      failureReason: domain.failureReason ?? null,
      startedAt: domain.startedAt ?? null,
      completedAt: domain.completedAt ?? null,
      createdAt: domain.createdAt ?? new Date(),
      updatedAt: domain.updatedAt ?? new Date(),
      // tasks handled separately
    };
  }

  static toPrismaWorkflowTask(domain: WorkflowTask): Prisma.WorkflowTaskCreateInput {
    return {
      id: domain.id,
      taskId: domain.taskId,
      step: { connect: { id: domain.stepId } },
      name: domain.name,
      description: domain.description ?? null,
      type: domain.type,
      status: domain.status,
      handler: domain.handler ?? null,
      checklist: domain.checkList && domain.checkList.length > 0
        ? domain.checkList.join('!~!')
        : null,
      autoCloseable: domain.isAutoCloseable ?? null,
      autoCloseRefId: domain.autoCloseRefId ?? null,
      jobId: domain.jobId ?? null,
      resultData: null, // if you later persist resultData
      completedAt: domain.completedAt ?? null,
      completedBy: domain.completedBy ?? null,
      failureReason: domain.failureReason ?? null,
      createdAt: domain.createdAt ?? new Date(),
      updatedAt: domain.updatedAt ?? new Date(),
    };
  }
  static toPrismaTaskAssignment(assignment: TaskAssignment): Prisma.TaskAssignmentCreateInput {
    return {
      id: assignment.id,
      task: { connect: { id: assignment.taskId } },
      assignedTo: { connect: { id: assignment.assignedTo.id } },
      roleName: assignment.roleName,
      assignedBy: assignment.assignedBy,
      status: assignment.status,
      acceptedAt: assignment.acceptedAt,
      completedAt: assignment.completedAt,
      notes: assignment.notes,
      createdAt: assignment.createdAt ?? new Date(),
      updatedAt: assignment.updatedAt ?? new Date(),
    };
  }
}



