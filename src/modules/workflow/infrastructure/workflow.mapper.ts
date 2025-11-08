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
import { UserMapper } from 'src/modules/user/infrastructure/user-infra.mapper';

export class WorkflowMapper {


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
      prisma.initiatedBy? UserMapper.toUser(prisma.initiatedBy!, []): undefined,
      prisma.initiatedFor? UserMapper.toUser(prisma.initiatedFor!, []): undefined,
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
      UserMapper.toUser(prisma.assign!,[]),
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
    return {
      id: domain.id,
      name: domain.name,
      type: domain.type,
      description: domain.description,
      status: domain.status,
      currentStepId: domain.currentStepId,
      initiatedById: domain.initiatedBy?.id,
      initiatedForId: domain.initiatedFor?.id,
      completedAt: domain.completedAt,
      remarks: domain.remarks,
      createdAt: domain.createdAt, // or domain.createdAt if tracked
      updatedAt: domain.updatedAt, // or domain.updatedAt if tracked
      version: BigInt(0), // optimistic concurrency if needed
      // steps: handled separately via nested create/update
    };
  }


  static toPrismaWorkflowStep(domain: WorkflowStep) {
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

