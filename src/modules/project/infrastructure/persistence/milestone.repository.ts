import { Injectable } from '@nestjs/common';
import { IMilestoneRepository } from '../../domain/repositories/milestone.repository.interface';
import { Milestone, MilestoneFilterProps } from '../../domain/model/milestone.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { ProjectInfraMapper } from '../project-infra.mapper';

@Injectable()
class MilestoneRepository implements IMilestoneRepository {
  constructor(private readonly prisma: PrismaPostgresService) {}

  async findAll(filter?: MilestoneFilterProps): Promise<Milestone[]> {
    const milestones = await this.prisma.milestone.findMany({
      where: this.whereQuery(filter),
      orderBy: { targetDate: 'asc' },
      include: { project: true },
    });
    return milestones.map(m => ProjectInfraMapper.toMilestoneDomain(m)!);
  }

  private whereQuery(props?: MilestoneFilterProps): Prisma.MilestoneWhereInput {
    return {
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.importance ? { importance: props.importance } : {}),
      deletedAt: null,
    };
  }

  async findById(id: string): Promise<Milestone | null> {
    const milestone = await this.prisma.milestone.findUnique({
      where: { id },
      include: { project: true },
    });
    return ProjectInfraMapper.toMilestoneDomain(milestone);
  }

  async findByProjectId(projectId: string): Promise<Milestone[]> {
    const milestones = await this.prisma.milestone.findMany({
      where: { projectId, deletedAt: null },
      include: { project: true },
    });
    return milestones.map(m => ProjectInfraMapper.toMilestoneDomain(m)!);
  }

  async findByStatus(status: string): Promise<Milestone[]> {
    const milestones = await this.prisma.milestone.findMany({
      where: { status, deletedAt: null },
      include: { project: true },
    });
    return milestones.map(m => ProjectInfraMapper.toMilestoneDomain(m)!);
  }

  async create(milestone: Milestone): Promise<Milestone> {
    const created = await this.prisma.milestone.create({
      data: ProjectInfraMapper.toMilestoneCreatePersistence(milestone),
      include: { project: true },
    });
    return ProjectInfraMapper.toMilestoneDomain(created)!;
  }

  async update(id: string, milestone: Milestone): Promise<Milestone> {
    const updated = await this.prisma.milestone.update({
      where: { id },
      data: ProjectInfraMapper.toMilestoneUpdatePersistence(milestone),
      include: { project: true },
    });
    return ProjectInfraMapper.toMilestoneDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.milestone.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export { MilestoneRepository };

