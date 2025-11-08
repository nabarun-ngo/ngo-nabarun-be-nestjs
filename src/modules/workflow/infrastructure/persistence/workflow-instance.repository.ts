import { Injectable } from '@nestjs/common';
import { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { WorkflowMapper } from '../workflow.mapper';
import { PrismaPostgresService } from '../../../shared/database/prisma-postgres.service';
import { WorkflowInfraMapper } from '../WorkflowInfraMapper';

@Injectable()
export class WorkflowInstanceRepository
  implements IWorkflowInstanceRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }
  findAll(filter?: any): Promise<WorkflowInstance[]> {
    throw new Error('Method not implemented.');
  }

  async findById(
    id: string,
    includeSteps: boolean = false,
  ): Promise<WorkflowInstance> {
    const instance = await this.prisma.workflowInstance.findUnique({
      where: { id },
      include: includeSteps
        ? {
          steps: {
            include: {
              tasks: {
                include: {
                  assignments: true,
                },
                orderBy: { createdAt: 'asc' },
              },
            },
            orderBy: { orderIndex: 'asc' },
          },
        }
        : undefined,
    });
    return WorkflowMapper.toWorkflowInstance(instance!);
  }

  async findByType(
    type: string,
    status?: string,
  ): Promise<WorkflowInstance[]> {
    const instances = await this.prisma.workflowInstance.findMany({
      where: {
        type,
        status: status || undefined,
      },
      include: {
        steps: {
          include: {
            tasks: {
              include: {
                assignments: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instances.map((inst) => WorkflowMapper.toWorkflowInstance(inst));
  }

  async findByInitiator(initiatedBy: string): Promise<WorkflowInstance[]> {
    const instances = await this.prisma.workflowInstance.findMany({
      where: { initiatedById: initiatedBy },
      include: {
        steps: {
          include: {
            tasks: {
              include: {
                assignments: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instances.map((inst) => WorkflowMapper.toWorkflowInstance(inst));
  }

  async findByStatus(status: string): Promise<WorkflowInstance[]> {
    const instances = await this.prisma.workflowInstance.findMany({
      where: { status },
      include: {
        steps: {
          include: {
            tasks: {
              include: {
                assignments: true,
              },
            },
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return instances.map((inst) => WorkflowMapper.toWorkflowInstance(inst));
  }

  async create(instance: WorkflowInstance): Promise<WorkflowInstance> {
    const prismaData = WorkflowInfraMapper.toPersistence(instance);
    const created = await this.prisma.workflowInstance.create({
      data: {
        ...prismaData,
        steps: {
          create: instance.steps.map((step) => ({
            ...WorkflowMapper.toPrismaWorkflowStep(step),
            // tasks: {
            //   create: step.tasks.map((task) => ({
            //     ...WorkflowMapper.toPrismaWorkflowTask(task),
            //     assignments: {
            //       create: task.assignments.map((assignment) =>
            //         WorkflowMapper.toPrismaTaskAssignment(assignment),
            //       ),
            //     },
            //   })),
            // },
          })),
        },
      },
      include: {
        steps: true,
        initiatedBy:true,
        initiatedFor:true
      },
    },
    );

    return WorkflowInfraMapper.toDomain(created);
  }

  async update(
    id: string,
    instance: WorkflowInstance,
  ): Promise<WorkflowInstance> {
    const prismaData = WorkflowInfraMapper.toPersistence(instance);

    // Update instance
    await this.prisma.workflowInstance.update({
      where: { id },
      data: prismaData,
    });

    // Update steps and tasks (simplified - in production, you'd want more sophisticated update logic)
    for (const step of instance.steps) {
      const stepData = WorkflowMapper.toPrismaWorkflowStep(step);
      await this.prisma.workflowStep.upsert({
        where: { id: step.id },
        update: stepData,
        create: {
          ...stepData,
          instanceId: id,
        },
      });

      for (const task of step.tasks) {
        const taskData = WorkflowMapper.toPrismaWorkflowTask(task);
        // await this.prisma.workflowTask.upsert({
        //   where: { id: task.id },
        //   update: taskData,
        //   create: {
        //     ...taskData,
        //     stepId: step.id, // Ensure stepId is explicitly set for creation
            
        //   },
        // });

        for (const assignment of task.assignments) {
          const assignmentData =
            WorkflowMapper.toPrismaTaskAssignment(assignment);
          await this.prisma.taskAssignment.upsert({
            where: { id: assignment.id },
            update: assignmentData,
            create: {
              ...assignmentData,
              taskId: task.id,
            },
          });
        }
      }
    }

    return this.findById(id, true)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.workflowInstance.delete({
      where: { id },
    });
  }
}
