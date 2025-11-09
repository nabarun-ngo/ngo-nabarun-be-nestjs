import { WorkflowInstance, WorkflowInstanceStatus, WorkflowType } from '../domain/model/workflow-instance.model';
import { WorkflowStep, WorkflowStepStatus } from '../domain/model/workflow-step.model';
import { WorkflowTask, WorkflowTaskType, WorkflowTaskStatus } from '../domain/model/workflow-task.model';
import { TaskAssignment, TaskAssignmentStatus } from '../domain/model/task-assignment.model';
import {
  WorkflowInstance as PrismaWorkflowInstance,
  WorkflowStep as PrismaWorkflowStep,
  WorkflowTask as PrismaWorkflowTask,
  TaskAssignment as PrismaTaskAssignment,
  UserProfile as PrismaUserProfile,
  Prisma,
  UserProfile,
} from 'generated/prisma';
import { UserInfraMapper } from 'src/modules/user/infrastructure/user-infra.mapper';
import { WorkflowPersistence } from './types/workflow-persistence.types';

export class WorkflowInfraMapper {

  /**
   * Convert Prisma persistence shape (with only steps) to Domain model
   * Used by repository for queries with steps included
   */
  static toDomain(p: WorkflowPersistence.WithOnlySteps): WorkflowInstance {
    return WorkflowInfraMapper.toWorkflowInstanceDomain(p);
  }

  /**
   * Convert Prisma persistence shape (with only steps) to Domain model
   * Primary mapper method matching user module pattern
   */
  static toWorkflowInstanceDomain(p: WorkflowPersistence.WithOnlySteps | any): WorkflowInstance {
    const instance = new WorkflowInstance(
      p.id,
      p.type as WorkflowType,
      p.name,
      p.description,
      p.status as WorkflowInstanceStatus,
      undefined, // Users not included in WithOnlySteps type
      undefined, // Users not included in WithOnlySteps type
      undefined,
      p.currentStepId ?? undefined,
      p.completedAt ?? undefined,
      p.remarks ?? undefined,
      p.createdAt,
      p.updatedAt,
    );

    if (p.steps && p.steps.length) {
      // ensure deterministic order
      const sorted = p.steps.slice().sort((a, b) => a.orderIndex - b.orderIndex);
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

  static toWorkflowInstance(
    prisma: PrismaWorkflowInstance & {
      initiatedBy?: PrismaUserProfile;
      initiatedFor?: PrismaUserProfile;
      steps?: PrismaWorkflowStep[];
    },
  ): WorkflowInstance {
    const instance = new WorkflowInstance(
      prisma.id,
      prisma.type as WorkflowType,
      prisma.name,
      prisma.description,
      prisma.status as WorkflowInstanceStatus,
      undefined, // User mapping requires proper includes
      undefined, // User mapping requires proper includes
      undefined,
      prisma.currentStepId!,
      prisma.completedAt || undefined,
      prisma.remarks || undefined,
      prisma.createdAt,
      prisma.updatedAt
    );

    if (prisma.steps) {
      prisma.steps.map((step) => new WorkflowStep(
        step.id,
        step.stepId,
        step.name,
        step.description!,
        step.status as WorkflowStepStatus,
        step.orderIndex,
        step.onSuccessStepId || undefined,
        step.onFailureStepId || undefined,
        step.completedAt || undefined,
        step.failureReason || undefined,
        step.startedAt || undefined,
        step.createdAt,
        step.updatedAt,
      )).forEach(step => instance.addSteps(step));
    }

    return instance;
  }

  static toWorkflowTask(
    step: PrismaWorkflowStep,
    prisma: PrismaWorkflowTask & {
      assignments?: PrismaTaskAssignment[];
    },
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
      //const assignments = prisma.assignments.map((assignment) =>
        //this.toTaskAssignment(assignment),
      //);
      //task.setAssignments(assignments);
    }

    return task;
  }

  static toTaskAssignment(prisma: PrismaTaskAssignment 
    &{assign: UserProfile}
  ): TaskAssignment {
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

  static toPersistence(domain: WorkflowInstance): Prisma.WorkflowInstanceUncheckedCreateInput {
    return WorkflowInfraMapper.toWorkflowInstanceCreatePersistence(domain);
  }

  /**
   * Convert Domain model to Prisma create input
   * Used for creating new workflow instances
   */
  static toWorkflowInstanceCreatePersistence(domain: WorkflowInstance): Prisma.WorkflowInstanceUncheckedCreateInput {
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId ?? null,
      initiatedById: domain.initiatedBy?.id ?? null,
      initiatedForId: domain.initiatedFor?.id ?? null,
      completedAt: domain.completedAt ?? null,
      remarks: domain.remarks ?? null,
      createdAt: (domain as any).createdAt ?? new Date(),
      updatedAt: (domain as any).updatedAt ?? new Date(),
      version: BigInt(0),
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
      initiatedById: domain.initiatedBy?.id ?? null,
      initiatedForId: domain.initiatedFor?.id ?? null,
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

  static toPrismaWorkflowStep(domain: WorkflowStep) {
    return WorkflowInfraMapper.toWorkflowStepPersistence(domain);
  }

  static toPrismaWorkflowTask(domain: WorkflowTask) {
    return {
      id: domain.id,
      taskId: domain.taskId,
      name: domain.name,
      description: domain.description ?? null,
      type: domain.type,
      status: domain.status,
      handler: domain.handler ?? null,
      checklist: domain.checkList ? JSON.stringify(domain.checkList) : null,
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

  static toPrismaTaskAssignment(assignment: TaskAssignment): any {
    return {
      id: assignment.id,
      taskId: assignment.taskId,
      assignedTo: assignment.assignedTo,
      roleName: assignment.roleName,
      assignedBy: assignment.assignedBy,
      status: assignment.status,
      acceptedAt: assignment.acceptedAt,
      completedAt: assignment.completedAt,
      notes: assignment.notes,
      createdAt: assignment.createdAt,
      updatedAt: assignment.updatedAt,
    };
  }
}
