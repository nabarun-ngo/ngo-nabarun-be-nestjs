import { Injectable } from '@nestjs/common';
import { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowFilter, WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { PrismaPostgresService } from '../../../shared/database/prisma-postgres.service';
import { Prisma } from '@prisma/client';
import { WorkflowInfraMapper } from '../workflow-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';
import { TaskFilter, WorkflowTask } from '../../domain/model/workflow-task.model';

export type PrismaWorkflowInstanceWithSteps = Prisma.WorkflowInstanceGetPayload<{
  include: { steps: true, initiatedBy: true, initiatedFor: true }
}>;

export type PrismaWorkflowInstanceWithTasks = Prisma.WorkflowInstanceGetPayload<{
  include: {
    steps: {
      include: {
        tasks: {
          include: {
            completedBy: true,
            assignments: { include: { assignedTo: true } }
          }
        }
      }
    }, initiatedBy: true, initiatedFor: true
  }
}>;

export type PrismaWorkflowTasks = Prisma.WorkflowTaskGetPayload<{
  include: {
    completedBy: true,
    assignments: {
      include: {
        assignedTo: true,
      }
    }
  }
}>;

@Injectable()
class WorkflowInstanceRepository
  implements IWorkflowInstanceRepository {

  constructor(private readonly prisma: PrismaPostgresService) { }

  async count(filter: WorkflowFilter): Promise<number> {
    return await this.prisma.workflowInstance.count({
      where: this.whereQuery(filter),
    });
  }

  async findAllTasks(filter: TaskFilter): Promise<WorkflowTask[]> {
    const tasks: PrismaWorkflowTasks[] = await this.prisma.workflowTask.findMany({
      where: this.whereQueryTasks(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        completedBy: true,
        assignments: {
          include: {
            assignedTo: true,
          },
        },
      },
    });
    return tasks.map(w => WorkflowInfraMapper.toWorkflowTask(w));
  }


  async findTasksPaged(filter: BaseFilter<TaskFilter>): Promise<PagedResult<WorkflowTask>> {

    const [data, total] = await Promise.all([
      this.prisma.workflowTask.findMany({
        where: this.whereQueryTasks(filter.props),
        orderBy: { createdAt: 'desc' },
        include: {
          completedBy: true,
          assignments: {
            include: {
              assignedTo: true,
            },
          },
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.workflowTask.count({
        where: this.whereQueryTasks(filter.props)
      })
    ]);

    return new PagedResult<WorkflowTask>(
      data.map(m => WorkflowInfraMapper.toWorkflowTask(m)),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 0
    );
  }

  private whereQueryTasks(filter: TaskFilter | undefined): Prisma.WorkflowTaskWhereInput {
    const where: Prisma.WorkflowTaskWhereInput = {
      ...(filter?.type ? { type: { in: filter.type } } : {}),
      ...(filter?.assignedTo ? { assignments: { some: { assignedToId: filter.assignedTo } } } : {}),
      ...(filter?.status ? { status: { in: filter.status } } : {}),
      ...(filter?.workflowId ? { workflowId: filter.workflowId } : {}),
      ...(filter?.taskId ? { id: filter.taskId } : {}),
    };
    return where;
  }

  async findAll(filter?: WorkflowFilter): Promise<WorkflowInstance[]> {

    const workflows: PrismaWorkflowInstanceWithSteps[] = await this.prisma.workflowInstance.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        steps: true,
        initiatedBy: true,
        initiatedFor: true
      }
    });

    return workflows.map(w => WorkflowInfraMapper.toDomainWithSteps(w));
  }

  async findPaged(filter?: BaseFilter<WorkflowFilter> | undefined): Promise<PagedResult<WorkflowInstance>> {

    const [data, total] = await Promise.all([
      this.prisma.workflowInstance.findMany({
        where: this.whereQuery(filter?.props),
        orderBy: { createdAt: 'desc' },
        include: {
          steps: true,
          initiatedBy: true,
          initiatedFor: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.workflowInstance.count({
        where: this.whereQuery(filter?.props),
      })
    ]);

    return new PagedResult<WorkflowInstance>(
      data.map(m => WorkflowInfraMapper.toDomainWithSteps(m)),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 0
    );
  }

  private whereQuery(props?: WorkflowFilter): Prisma.WorkflowInstanceWhereInput {
    const where: Prisma.WorkflowInstanceWhereInput = {
      ...(props?.type ? { type: { in: props.type } } : {}),
      ...(props?.status ? { status: { in: props.status } } : {}),
      ...(props?.initiatedBy ? { initiatedById: props.initiatedBy } : {}),
      ...(props?.initiatedFor ? { initiatedForId: props.initiatedFor } : {}),
      ...(props?.delegated ? { delegated: props.delegated } : {}),
      ...(props?.workflowId ? { id: props.workflowId } : {}),
    }
    return where;
  }



  async findById(id: string, includeTask: boolean = false): Promise<WorkflowInstance | null> {
    if (includeTask) {
      const workflow0: PrismaWorkflowInstanceWithTasks | null = await this.prisma.workflowInstance.findUnique({
        where: { id },
        include: {
          steps: {
            include: {
              tasks: {
                include: {
                  completedBy: true,
                  assignments: {
                    include: {
                      assignedTo: true,
                    },
                  },
                },
              },
            },
          },
          initiatedBy: true,
          initiatedFor: true
        }
      });
      return WorkflowInfraMapper.toDomainWithTasks(workflow0!);
    }
    const workflow0: PrismaWorkflowInstanceWithSteps | null = await this.prisma.workflowInstance.findUnique({
      where: { id },
      include: {
        steps: true,
        initiatedBy: true,
        initiatedFor: true
      }
    });

    return WorkflowInfraMapper.toDomainWithSteps(workflow0!);


  }


  async create(instance: WorkflowInstance): Promise<WorkflowInstance> {
    const createData: Prisma.WorkflowInstanceCreateInput = {
      ...WorkflowInfraMapper.toWorkflowInstanceCreatePersistence(instance),
      initiatedBy: instance.initiatedBy?.id ? { connect: { id: instance.initiatedBy.id! } } : undefined,
      initiatedFor: instance.initiatedFor?.id ? { connect: { id: instance.initiatedFor.id! } } : undefined,
      steps: {
        create: instance.steps.map((step) =>
          WorkflowInfraMapper.toWorkflowStepPersistence(step),
        ),
      },
    };

    const createdWorkflow: PrismaWorkflowInstanceWithSteps = await this.prisma.workflowInstance.create({
      data: createData,
      include: {
        steps: true,
        initiatedBy: true,
        initiatedFor: true
      }
    })
    return WorkflowInfraMapper.toDomainWithSteps(createdWorkflow);
  }

  async update(id: string, instance: WorkflowInstance): Promise<WorkflowInstance> {
    const data = WorkflowInfraMapper.toWorkflowInstanceUpdatePersistence(instance);
    return this.prisma.$transaction(async (tx) => {
      // Update workflow instance
      await tx.workflowInstance.update({ where: { id }, data });

      // Upsert steps
      await Promise.all(
        instance.steps.map((step) => {
          const stepData = WorkflowInfraMapper.toWorkflowStepPersistence(step);
          return tx.workflowStep.upsert({
            where: { id: step.id },
            update: stepData,
            create: { ...stepData, instanceId: id },
          });
        }),
      );

      // Upsert tasks for each step
      await Promise.all(
        instance.steps.map((step) => {
          return Promise.all(
            step.tasks.map((task) => {
              const taskData = WorkflowInfraMapper.toPrismaWorkflowTaskPersistance(task, step.id);
              return tx.workflowTask.upsert({
                where: { id: task.id },
                update: taskData,
                create: { ...taskData },
              });
            }),
          );
        }),
      );

      // Upsert task assignments for each task
      await Promise.all(
        instance.steps.map((step) => {
          return Promise.all(
            step.tasks.map((task) => {
              return Promise.all(
                task.assignments.map((assignment) => {
                  const assignmentData = WorkflowInfraMapper.toPrismaTaskAssignment(assignment);
                  return tx.taskAssignment.upsert({
                    where: { id: assignment.id },
                    update: assignmentData,
                    create: { ...assignmentData },
                  });
                }),
              );
            }),
          );
        }),
      );

      // Retrieve the updated instance with all relations
      const updated: PrismaWorkflowInstanceWithTasks | null = await tx.workflowInstance.findUnique({
        where: { id },
        include: {
          steps: {
            include: {
              tasks: {
                include: {
                  assignments: {
                    include: {
                      assignedTo: true,
                    },
                  },
                },
              },
            },
          },
          initiatedBy: true,
          initiatedFor: true,
        },
      });

      if (!updated) {
        throw new Error('Failed to retrieve updated workflow instance');
      }

      const mappedInstance = WorkflowInfraMapper.toDomainWithTasks(updated);
      if (!mappedInstance) {
        throw new Error('Failed to map updated workflow instance');
      }

      return mappedInstance;
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowInstance.delete({ where: { id } });
  }
}

export default WorkflowInstanceRepository;