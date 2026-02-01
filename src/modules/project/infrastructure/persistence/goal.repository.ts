import { Injectable } from '@nestjs/common';
import { IGoalRepository } from '../../domain/repositories/goal.repository.interface';
import { Goal, GoalFilterProps } from '../../domain/model/goal.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { ProjectInfraMapper } from '../project-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class GoalRepository implements IGoalRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async count(filter: GoalFilterProps): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.prisma.goal.count({ where });
  }

  async findPaged(filter?: BaseFilter<GoalFilterProps>): Promise<PagedResult<Goal>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.goal.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { project: true },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.goal.count({ where }),
    ]);

    return new PagedResult<Goal>(
      data.map(m => ProjectInfraMapper.toGoalDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: GoalFilterProps): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: { project: true },
    });
    return goals.map(m => ProjectInfraMapper.toGoalDomain(m)!);
  }

  private whereQuery(props?: GoalFilterProps): Prisma.GoalWhereInput {
    return {
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.priority ? { priority: props.priority } : {}),
      deletedAt: null,
    };
  }

  async findById(id: string): Promise<Goal | null> {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: { project: true },
    });
    return ProjectInfraMapper.toGoalDomain(goal);
  }

  async findByProjectId(projectId: string): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: { projectId, deletedAt: null },
      include: { project: true },
    });
    return goals.map(m => ProjectInfraMapper.toGoalDomain(m)!);
  }

  async findByStatus(status: string): Promise<Goal[]> {
    const goals = await this.prisma.goal.findMany({
      where: { status, deletedAt: null },
      include: { project: true },
    });
    return goals.map(m => ProjectInfraMapper.toGoalDomain(m)!);
  }

  async create(goal: Goal): Promise<Goal> {
    const created = await this.prisma.goal.create({
      data: ProjectInfraMapper.toGoalCreatePersistence(goal),
      include: { project: true },
    });
    return ProjectInfraMapper.toGoalDomain(created)!;
  }

  async update(id: string, goal: Goal): Promise<Goal> {
    const updated = await this.prisma.goal.update({
      where: { id },
      data: ProjectInfraMapper.toGoalUpdatePersistence(goal),
      include: { project: true },
    });
    return ProjectInfraMapper.toGoalDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.goal.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export { GoalRepository };

