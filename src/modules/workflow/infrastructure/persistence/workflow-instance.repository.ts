import { Injectable } from '@nestjs/common';
import { IWorkflowInstanceRepository } from '../../domain/repositories/workflow-instance.repository.interface';
import { WorkflowFilter, WorkflowInstance } from '../../domain/model/workflow-instance.model';
import { PrismaPostgresService } from '../../../shared/database/prisma-postgres.service';
import { Prisma, PrismaClient } from 'prisma/client';
import { PrismaBaseRepository, RepositoryHelpers } from 'src/modules/shared/database';
import { WorkflowPersistence } from '../types/workflow-persistence.types';
import { WorkflowInfraMapper } from '../workflow-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class WorkflowInstanceRepository
  extends PrismaBaseRepository<
    WorkflowInstance,
    PrismaClient['workflowInstance'],
    Prisma.WorkflowInstanceWhereUniqueInput,
    Prisma.WorkflowInstanceWhereInput,
    Prisma.WorkflowInstanceGetPayload<any>,
    Prisma.WorkflowInstanceCreateInput,
    Prisma.WorkflowInstanceUpdateInput
  >
  implements IWorkflowInstanceRepository {
  protected getDelegate(prisma: PrismaPostgresService) {
    return prisma.workflowInstance;
  }
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }
  findAll(filter?: WorkflowFilter | undefined): Promise<WorkflowInstance[]> {
    const where: Prisma.WorkflowInstanceWhereInput = {
      type: filter?.type,
      status: filter?.status,
      initiatedById: filter?.initiatedBy,
    };

    return this.findMany<Prisma.WorkflowInstanceInclude>(
      where,{
        steps: true,
        initiatedBy:true,
        initiatedFor: true
      }
    );
  }
  findPaged(filter?: BaseFilter<WorkflowFilter> | undefined): Promise<PagedResult<WorkflowInstance>> {
    throw new Error('Method not implemented.');
  }



  protected toDomain(prismaModel: any): WorkflowInstance | null {
    return WorkflowInfraMapper.toWorkflowInstanceDomain(prismaModel);
  }



  async findById(id: string,include: boolean): Promise<WorkflowInstance | null> {
    return this.findUnique<Prisma.WorkflowInstanceInclude>({ id },{
      steps: include,
      initiatedBy:true,
      initiatedFor: true
    });
  }

  async findByType(type: string, status?: string): Promise<WorkflowInstance[]> {
    return this.findMany({ type, status: status || undefined });
  }

  async findByInitiator(initiatedBy: string): Promise<WorkflowInstance[]> {
    return this.findMany({ initiatedById: initiatedBy });
  }

  async findByStatus(status: string): Promise<WorkflowInstance[]> {
    return this.findMany({ status });
  }

  async create(instance: WorkflowInstance): Promise<WorkflowInstance> {
    const createData: Prisma.WorkflowInstanceCreateInput = {
      ...WorkflowInfraMapper.toWorkflowInstanceCreatePersistence(instance),
      steps: {
        create: instance.steps.map((step) =>
          WorkflowInfraMapper.toWorkflowStepPersistence(step),
        ),
      },
    };

    return this.createRecord(createData);
  }

  async update(id: string, instance: WorkflowInstance): Promise<WorkflowInstance> {
    const data = WorkflowInfraMapper.toWorkflowInstanceUpdatePersistence(instance);
    return this.executeTransaction(async (tx) => {
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
              const taskData = WorkflowInfraMapper.toPrismaWorkflowTask(task);
              return tx.workflowTask.upsert({
                where: { id: task.id },
                update: taskData,
                create: { ...taskData, step: { connect: { id: step.id } } },
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
                    create: { ...assignmentData},
                  });
                }),
              );
            }),
          );
        }),
      );
      // Retrieve the updated instance with all relations
      const updated = await tx.workflowInstance.findUnique({
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
      const mappedInstance = WorkflowInfraMapper.toWorkflowInstanceDomain(updated);
      if (!mappedInstance) {
        throw new Error('Failed to map updated workflow instance');
      }
      return mappedInstance;
    });
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default WorkflowInstanceRepository;