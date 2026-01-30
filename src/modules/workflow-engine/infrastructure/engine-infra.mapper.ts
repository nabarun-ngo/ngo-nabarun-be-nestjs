import { EngineWorkflowInstance } from '../domain/model/engine-workflow-instance.model';
import { EngineWorkflowStep } from '../domain/model/engine-workflow-step.model';
import { EngineWorkflowTask } from '../domain/model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../domain/model/engine-task-assignment.model';
import { EngineWorkflowInstanceStatus } from '../domain/model/engine-workflow-instance.model';
import { EngineWorkflowStepStatus } from '../domain/model/engine-workflow-step.model';
import { EngineWorkflowTaskStatus } from '../domain/model/engine-workflow-task.model';
import { EngineTaskAssignmentStatus } from '../domain/model/engine-task-assignment.model';
import { TransitionConfig } from '../domain/model/engine-workflow-step.model';

type PrismaEngineInstance = {
  id: string;
  type: string;
  definitionVersion: number | null;
  name: string;
  description: string | null;
  status: string;
  contextData: string | null;
  activeStepIds: string | null;
  initiatedById: string | null;
  initiatedForId: string | null;
  requestData: string | null;
  completedAt: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  steps?: PrismaEngineStep[];
};

type PrismaEngineStep = {
  id: string;
  instanceId: string;
  stepId: string;
  name: string;
  description: string | null;
  status: string;
  orderIndex: number;
  transitionConfig: string | null;
  parallelGroup: string | null;
  joinConfig: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  tasks?: PrismaEngineTask[];
};

type PrismaEngineTask = {
  id: string;
  stepId: string;
  instanceId: string;
  taskId: string;
  name: string;
  description: string | null;
  type: string;
  status: string;
  handler: string | null;
  taskConfig: string | null;
  resultData: string | null;
  completedById: string | null;
  completedAt: Date | null;
  remarks: string | null;
  createdAt: Date;
  updatedAt: Date;
  assignments?: PrismaEngineAssignment[];
};

type PrismaEngineAssignment = {
  id: string;
  taskId: string;
  assigneeId: string;
  roleName: string | null;
  status: string;
  assignedById: string | null;
  acceptedAt: Date | null;
  rejectedAt: Date | null;
  rejectionReason: string | null;
  supersededById: string | null;
  dueAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class EngineInfraMapper {
  static toDomain(prisma: PrismaEngineInstance): EngineWorkflowInstance {
    const contextData = prisma.contextData
      ? (JSON.parse(prisma.contextData) as Record<string, unknown>)
      : {};
    const activeStepIds = prisma.activeStepIds
      ? (JSON.parse(prisma.activeStepIds) as string[])
      : [];
    const requestData = prisma.requestData
      ? (JSON.parse(prisma.requestData) as Record<string, unknown>)
      : {};

    const instance = new EngineWorkflowInstance({
      id: prisma.id,
      type: prisma.type,
      definitionVersion: prisma.definitionVersion,
      name: prisma.name,
      description: prisma.description ?? '',
      status: prisma.status as EngineWorkflowInstanceStatus,
      contextData,
      activeStepIds,
      initiatedById: prisma.initiatedById,
      initiatedForId: prisma.initiatedForId,
      requestData,
      completedAt: prisma.completedAt,
      remarks: prisma.remarks,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });

    if (prisma.steps) {
      const sorted = [...prisma.steps].sort((a, b) => a.orderIndex - b.orderIndex);
      sorted.forEach((s) => {
        const step = this.toDomainStep(prisma.id, s);
        instance.addStep(step);
      });
    }
    return instance;
  }

  private static toDomainStep(
    instanceId: string,
    prisma: PrismaEngineStep,
  ): EngineWorkflowStep {
    const transitionConfig: TransitionConfig = prisma.transitionConfig
      ? (JSON.parse(prisma.transitionConfig) as TransitionConfig)
      : { onSuccess: null, onFailure: null };
    
    const joinConfig = prisma.joinConfig
      ? (JSON.parse(prisma.joinConfig) as { stepId: string; joinType: 'ALL' | 'ANY'; requiredStepIds: string[] })
      : null;

    const step = new EngineWorkflowStep({
      id: prisma.id,
      instanceId,
      stepId: prisma.stepId,
      name: prisma.name,
      description: prisma.description,
      status: prisma.status as EngineWorkflowStepStatus,
      orderIndex: prisma.orderIndex,
      transitionConfig,
      parallelGroup: prisma.parallelGroup,
      joinConfig,
      startedAt: prisma.startedAt,
      completedAt: prisma.completedAt,
      remarks: prisma.remarks,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });

    if (prisma.tasks) {
      const tasks = prisma.tasks.map((t) =>
        this.toDomainTask(prisma.id, instanceId, t),
      );
      step.setTasks(tasks);
    }
    return step;
  }

  private static toDomainTask(
    stepId: string,
    instanceId: string,
    prisma: PrismaEngineTask,
  ): EngineWorkflowTask {
    const rawTaskConfig = prisma.taskConfig
      ? (JSON.parse(prisma.taskConfig) as Record<string, unknown> & { outputKey?: string; requireAcceptance?: boolean })
      : null;
    const outputKey = rawTaskConfig?.outputKey ?? null;
    const requireAcceptance = rawTaskConfig?.requireAcceptance ?? false;
    const taskConfig = rawTaskConfig ? { ...rawTaskConfig } : null;
    const resultData = prisma.resultData
      ? (JSON.parse(prisma.resultData) as Record<string, unknown>)
      : null;

    const task = new EngineWorkflowTask(
      {
        id: prisma.id,
        stepId,
        instanceId,
        taskId: prisma.taskId,
        name: prisma.name,
        description: prisma.description,
        type: prisma.type as 'MANUAL' | 'AUTOMATIC',
        status: prisma.status as EngineWorkflowTaskStatus,
        handler: prisma.handler,
        taskConfig,
        resultData,
        completedById: prisma.completedById,
        completedAt: prisma.completedAt,
        remarks: prisma.remarks,
        createdAt: prisma.createdAt,
        updatedAt: prisma.updatedAt,
      },
      requireAcceptance,
      outputKey,
    );

    if (prisma.assignments) {
      const assignments = prisma.assignments.map((a) =>
        this.toDomainAssignment(a),
      );
      task.setAssignments(assignments);
    }
    return task;
  }

  static toDomainAssignment(
    prisma: PrismaEngineAssignment,
  ): EngineTaskAssignment {
    // Import EngineAssigneeType
    const { EngineAssigneeType } = require('../../domain/model/engine-task-assignment.model');
    
    // Determine assignee type based on which field is populated
    // TODO: Update when Prisma schema has assigneeEmail/assigneeName fields
    const assigneeType = prisma.assigneeId
      ? EngineAssigneeType.INTERNAL
      : EngineAssigneeType.EXTERNAL;

    return new EngineTaskAssignment({
      id: prisma.id,
      taskId: prisma.taskId,
      assigneeId: prisma.assigneeId,
      assigneeEmail: null, // TODO: Map from Prisma when schema updated
      assigneeName: null, // TODO: Map from Prisma when schema updated
      assigneeType,
      roleName: prisma.roleName,
      status: prisma.status as EngineTaskAssignmentStatus,
      assignedById: prisma.assignedById,
      acceptedAt: prisma.acceptedAt,
      rejectedAt: prisma.rejectedAt,
      rejectionReason: prisma.rejectionReason,
      supersededById: prisma.supersededById,
      dueAt: prisma.dueAt,
      createdAt: prisma.createdAt,
      updatedAt: prisma.updatedAt,
    });
  }

  static toPrismaInstanceCreate(instance: EngineWorkflowInstance): {
    id: string;
    type: string;
    definitionVersion: number | null;
    name: string;
    description: string;
    status: string;
    contextData: string;
    activeStepIds: string;
    initiatedById: string | null;
    initiatedForId: string | null;
    requestData: string;
    completedAt: Date | null;
    remarks: string | null;
  } {
    return {
      id: instance.id,
      type: instance.type,
      definitionVersion: instance.definitionVersion,
      name: instance.name,
      description: instance.description,
      status: instance.status,
      contextData: JSON.stringify(instance.contextData),
      activeStepIds: JSON.stringify(instance.activeStepIds),
      initiatedById: instance.initiatedById,
      initiatedForId: instance.initiatedForId,
      requestData: JSON.stringify(instance.requestData),
      completedAt: instance.completedAt,
      remarks: instance.remarks,
    };
  }

  static toPrismaInstanceUpdate(instance: EngineWorkflowInstance): {
    type: string;
    definitionVersion: number | null;
    name: string;
    description: string;
    status: string;
    contextData: string;
    activeStepIds: string;
    initiatedById: string | null;
    initiatedForId: string | null;
    requestData: string;
    completedAt: Date | null;
    remarks: string | null;
    updatedAt: Date;
  } {
    return {
      type: instance.type,
      definitionVersion: instance.definitionVersion,
      name: instance.name,
      description: instance.description,
      status: instance.status,
      contextData: JSON.stringify(instance.contextData),
      activeStepIds: JSON.stringify(instance.activeStepIds),
      initiatedById: instance.initiatedById,
      initiatedForId: instance.initiatedForId,
      requestData: JSON.stringify(instance.requestData),
      completedAt: instance.completedAt,
      remarks: instance.remarks,
      updatedAt: new Date(),
    };
  }

  static toPrismaStepCreate(
    step: EngineWorkflowStep,
    instanceId: string,
  ): {
    id: string;
    instanceId: string;
    stepId: string;
    name: string;
    description: string | null;
    status: string;
    orderIndex: number;
    transitionConfig: string;
    parallelGroup: string | null;
    joinConfig: string | null;
    startedAt: Date | null;
    completedAt: Date | null;
    remarks: string | null;
  } {
    return {
      id: step.id,
      instanceId,
      stepId: step.stepId,
      name: step.name,
      description: step.description,
      status: step.status,
      orderIndex: step.orderIndex,
      transitionConfig: JSON.stringify({
        onSuccess: step.onSuccessStepId,
        onFailure: step.onFailureStepId,
        conditions: step.conditions,
      }),
      parallelGroup: step.parallelGroup,
      joinConfig: step.joinConfig ? JSON.stringify(step.joinConfig) : null,
      startedAt: step.startedAt,
      completedAt: step.completedAt,
      remarks: step.remarks,
    };
  }

  static toPrismaTaskCreate(
    task: EngineWorkflowTask,
    stepId: string,
  ): {
    id: string;
    stepId: string;
    instanceId: string;
    taskId: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
    handler: string | null;
    taskConfig: string | null;
    resultData: string | null;
    completedById: string | null;
    completedAt: Date | null;
    remarks: string | null;
  } {
    const taskConfigObj = task.taskConfig
      ? { ...task.taskConfig, outputKey: task.outputKey, requireAcceptance: task.requireAcceptance }
      : { outputKey: task.outputKey, requireAcceptance: task.requireAcceptance };
    return {
      id: task.id,
      stepId,
      instanceId: task.instanceId,
      taskId: task.taskId,
      name: task.name,
      description: task.description,
      type: task.type,
      status: task.status,
      handler: task.handler,
      taskConfig: JSON.stringify(taskConfigObj),
      resultData: task.resultData ? JSON.stringify(task.resultData) : null,
      completedById: task.completedById,
      completedAt: task.completedAt,
      remarks: task.remarks,
    };
  }

  static toPrismaAssignmentCreate(assignment: EngineTaskAssignment): {
    id: string;
    taskId: string;
    assigneeId: string;
    roleName: string | null;
    status: string;
    assignedById: string | null;
    acceptedAt: Date | null;
    rejectedAt: Date | null;
    rejectionReason: string | null;
    supersededById: string | null;
    dueAt: Date | null;
  } {
    // For external users, we need to handle the case where assigneeId is null
    // TODO: Update Prisma schema to support external users (assigneeEmail, assigneeName)
    // For now, external assignments will fail validation
    if (!assignment.assigneeId) {
      throw new Error(
        'External user assignments not yet supported in Prisma schema. ' +
        'Update schema to add assigneeEmail and assigneeName fields.',
      );
    }

    return {
      id: assignment.id,
      taskId: assignment.taskId,
      assigneeId: assignment.assigneeId,
      roleName: assignment.roleName,
      status: assignment.status,
      assignedById: assignment.assignedById,
      acceptedAt: assignment.acceptedAt,
      rejectedAt: assignment.rejectedAt,
      rejectionReason: assignment.rejectionReason,
      supersededById: assignment.supersededById,
      dueAt: assignment.dueAt,
    };
  }
}
