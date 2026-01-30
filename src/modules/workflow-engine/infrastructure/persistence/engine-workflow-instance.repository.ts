import { Injectable } from '@nestjs/common';
import { PrismaPostgresService } from '../../../shared/database/prisma-postgres.service';
import { IEngineWorkflowInstanceRepository } from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { EngineWorkflowInstance } from '../../domain/model/engine-workflow-instance.model';
import { EngineWorkflowTask } from '../../domain/model/engine-workflow-task.model';
import { EngineTaskAssignment } from '../../domain/model/engine-task-assignment.model';
import { EngineInfraMapper } from '../engine-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import {
  EngineWorkflowInstanceFilter,
  EngineOverdueAssignmentFilter,
  EngineTaskAssignmentFilter,
} from '../../domain/repositories/engine-workflow-instance.repository.interface';
import { pendingTaskStatuses } from '../../domain/model/engine-workflow-task.model';

@Injectable()
export class EngineWorkflowInstanceRepository
  implements IEngineWorkflowInstanceRepository
{
  constructor(private readonly prisma: PrismaPostgresService) {}

  private get engineInstance() {
    return (this.prisma as any).engineWorkflowInstance;
  }
  private get engineStep() {
    return (this.prisma as any).engineWorkflowStep;
  }
  private get engineTask() {
    return (this.prisma as any).engineWorkflowTask;
  }
  private get engineAssignment() {
    return (this.prisma as any).engineTaskAssignment;
  }

  async findById(
    id: string,
    includeSteps = true,
  ): Promise<EngineWorkflowInstance | null> {
    const includeOpt: any = includeSteps
      ? {
          steps: {
            orderBy: { orderIndex: 'asc' as const },
            include: {
              tasks: {
                include: { assignments: { include: { assignee: true } }, completedBy: true },
              },
            },
          },
          initiatedBy: true,
          initiatedFor: true,
        }
      : {};
    const row = await this.engineInstance.findUnique({
      where: { id },
      include: includeOpt,
    });
    if (!row) return null;
    return EngineInfraMapper.toDomain(row);
  }

  async findPaged(
    filter: BaseFilter<EngineWorkflowInstanceFilter>,
  ): Promise<PagedResult<EngineWorkflowInstance>> {
    const where: any = {};
    if (filter.props?.type) where.type = filter.props.type;
    if (filter.props?.status?.length)
      where.status = { in: filter.props.status };
    if (filter.props?.initiatedById)
      where.initiatedById = filter.props.initiatedById;
    if (filter.props?.initiatedForId)
      where.initiatedForId = filter.props.initiatedForId;

    const [rows, total] = await Promise.all([
      this.engineInstance.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (filter.pageIndex ?? 0) * (filter.pageSize ?? 20),
        take: filter.pageSize ?? 20,
      }),
      this.engineInstance.count({ where }),
    ]);

    return new PagedResult(
      rows.map((r: any) => EngineInfraMapper.toDomain(r)),
      total,
      filter.pageIndex ?? 0,
      filter.pageSize ?? 20,
    );
  }

  async create(instance: EngineWorkflowInstance): Promise<EngineWorkflowInstance> {
    const data = EngineInfraMapper.toPrismaInstanceCreate(instance);
    await this.engineInstance.create({ data });

    for (const step of instance.steps) {
      const stepData = EngineInfraMapper.toPrismaStepCreate(step, instance.id);
      await this.engineStep.create({ data: stepData });
      for (const task of step.tasks) {
        const taskData = EngineInfraMapper.toPrismaTaskCreate(task, step.id);
        await this.engineTask.create({ data: taskData });
        for (const assignment of task.assignments) {
          const assignData =
            EngineInfraMapper.toPrismaAssignmentCreate(assignment);
          await this.engineAssignment.create({ data: assignData });
        }
      }
    }
    return this.findById(instance.id, true) as Promise<EngineWorkflowInstance>;
  }

  async update(
    id: string,
    instance: EngineWorkflowInstance,
  ): Promise<EngineWorkflowInstance> {
    const data = EngineInfraMapper.toPrismaInstanceUpdate(instance);
    await this.engineInstance.update({ where: { id }, data });

    for (const step of instance.steps) {
      const stepData = EngineInfraMapper.toPrismaStepCreate(step, instance.id);
      await this.engineStep.upsert({
        where: { id: step.id },
        create: stepData,
        update: {
          status: step.status,
          startedAt: step.startedAt,
          completedAt: step.completedAt,
          remarks: step.remarks,
          updatedAt: new Date(),
        },
      });
      for (const task of step.tasks) {
        const taskData = EngineInfraMapper.toPrismaTaskCreate(task, step.id);
        await this.engineTask.upsert({
          where: { id: task.id },
          create: taskData,
          update: {
            status: task.status,
            resultData: task.resultData
              ? JSON.stringify(task.resultData)
              : null,
            completedById: task.completedById,
            completedAt: task.completedAt,
            remarks: task.remarks,
            updatedAt: new Date(),
          },
        });
        for (const assignment of task.assignments) {
          const assignData =
            EngineInfraMapper.toPrismaAssignmentCreate(assignment);
          await this.engineAssignment.upsert({
            where: { id: assignment.id },
            create: assignData,
            update: {
              status: assignment.status,
              acceptedAt: assignment.acceptedAt,
              rejectedAt: assignment.rejectedAt,
              rejectionReason: assignment.rejectionReason,
              supersededById: assignment.supersededById,
              updatedAt: new Date(),
            },
          });
        }
      }
    }
    return this.findById(id, true) as Promise<EngineWorkflowInstance>;
  }

  async findTasksByInstance(instanceId: string): Promise<EngineWorkflowTask[]> {
    const tasks = await this.engineTask.findMany({
      where: { instanceId },
      include: { assignments: true },
    });
    const instance = await this.findById(instanceId, true);
    if (!instance) return [];
    const allTasks: EngineWorkflowTask[] = [];
    for (const step of instance.steps) {
      for (const task of step.tasks) {
        allTasks.push(task);
      }
    }
    return allTasks;
  }

  async findOverdueAssignments(
    filter: EngineOverdueAssignmentFilter,
  ): Promise<EngineTaskAssignment[]> {
    let instanceIds: string[] | undefined = undefined;
    if (filter.workflowType) {
      const instances = await this.engineInstance.findMany({
        where: { type: filter.workflowType },
        select: { id: true },
      });
      instanceIds = instances.map((i: any) => i.id);
      if (instanceIds && instanceIds.length === 0) return [];
    }
    const where: any = {
      dueAt: { lt: new Date() },
      status: { in: ['PENDING', 'ACCEPTED'] },
      task: {
        status: { notIn: ['COMPLETED', 'FAILED', 'SKIPPED'] },
        ...(instanceIds && instanceIds.length > 0 ? { instanceId: { in: instanceIds } } : {}),
      },
    };
    if (filter.assigneeId) where.assigneeId = filter.assigneeId;
    const rows = await this.engineAssignment.findMany({
      where,
      include: { task: true },
    });
    return rows.map((r: any) => EngineInfraMapper.toDomainAssignment(r));
  }

  async findInstanceIdByAssignmentId(assignmentId: string): Promise<string | null> {
    const row = await this.engineAssignment.findUnique({
      where: { id: assignmentId },
      include: { task: { select: { instanceId: true } } },
    });
    return (row as any)?.task?.instanceId ?? null;
  }

  async findTaskAssignmentsPaged(
    filter: BaseFilter<EngineTaskAssignmentFilter>,
  ): Promise<PagedResult<EngineTaskAssignment>> {
    const { pageIndex = 0, pageSize = 20, props = {} } = filter;
    const { assigneeId, statuses, taskType, instanceIds, taskIds } = props;

    const where: any = {};

    if (assigneeId) {
      where.assigneeId = assigneeId;
    }

    if (statuses && statuses.length > 0) {
      where.status = { in: statuses };
    }

    if (taskType) {
      where.task = { type: taskType };
    }

    if (instanceIds && instanceIds.length > 0) {
      where.task = { ...where.task, instanceId: { in: instanceIds } };
    }

    if (taskIds && taskIds.length > 0) {
      where.taskId = { in: taskIds };
    }

    const [rows, total] = await Promise.all([
      this.engineAssignment.findMany({
        where,
        include: {
          task: {
            include: {
              step: {
                include: {
                  instance: true,
                },
              },
            },
          },
        },
        skip: pageIndex * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.engineAssignment.count({ where }),
    ]);

    return new PagedResult<EngineTaskAssignment>(
      rows.map((r: any) => EngineInfraMapper.toDomainAssignment(r)),
      total,
      pageIndex,
      pageSize,
    );
  }
}
