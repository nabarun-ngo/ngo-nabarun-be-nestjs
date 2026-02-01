import { Injectable } from '@nestjs/common';
import { IProjectRiskRepository } from '../../domain/repositories/project-risk.repository.interface';
import { ProjectRisk, ProjectRiskFilterProps } from '../../domain/model/project-risk.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { ProjectInfraMapper } from '../project-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class ProjectRiskRepository implements IProjectRiskRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async count(filter: ProjectRiskFilterProps): Promise<number> {
    const where = this.whereQuery(filter);
    return await this.prisma.projectRisk.count({ where });
  }

  async findPaged(filter?: BaseFilter<ProjectRiskFilterProps> | undefined): Promise<PagedResult<ProjectRisk>> {
    const where = this.whereQuery(filter?.props);

    const [data, total] = await Promise.all([
      this.prisma.projectRisk.findMany({
        where,
        orderBy: { identifiedDate: 'desc' },
        include: {
          project: true,
          owner: true,
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 1000),
        take: filter?.pageSize ?? 1000,
      }),
      this.prisma.projectRisk.count({ where }),
    ]);

    return new PagedResult<ProjectRisk>(
      data.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 1000,
    );
  }

  async findAll(filter?: ProjectRiskFilterProps): Promise<ProjectRisk[]> {
    const risks = await this.prisma.projectRisk.findMany({
      where: this.whereQuery(filter),
      orderBy: { identifiedDate: 'desc' },
      include: {
        project: true,
        owner: true,
      },
    });
    return risks.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!);
  }

  private whereQuery(props?: ProjectRiskFilterProps): Prisma.ProjectRiskWhereInput {
    return {
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.severity ? { severity: props.severity } : {}),
      ...(props?.category ? { category: props.category } : {}),
      deletedAt: null,
    };
  }

  async findById(id: string): Promise<ProjectRisk | null> {
    const risk = await this.prisma.projectRisk.findUnique({
      where: { id },
      include: {
        project: true,
        owner: true,
      },
    });
    return ProjectInfraMapper.toProjectRiskDomain(risk);
  }

  async findByProjectId(projectId: string): Promise<ProjectRisk[]> {
    const risks = await this.prisma.projectRisk.findMany({
      where: { projectId, deletedAt: null },
      include: {
        project: true,
        owner: true,
      },
    });
    return risks.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!);
  }

  async findByStatus(status: string): Promise<ProjectRisk[]> {
    const risks = await this.prisma.projectRisk.findMany({
      where: { status, deletedAt: null },
      include: {
        project: true,
        owner: true,
      },
    });
    return risks.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!);
  }

  async findBySeverity(severity: string): Promise<ProjectRisk[]> {
    const risks = await this.prisma.projectRisk.findMany({
      where: { severity, deletedAt: null },
      include: {
        project: true,
        owner: true,
      },
    });
    return risks.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!);
  }

  async findByCategory(category: string): Promise<ProjectRisk[]> {
    const risks = await this.prisma.projectRisk.findMany({
      where: { category, deletedAt: null },
      include: {
        project: true,
        owner: true,
      },
    });
    return risks.map(m => ProjectInfraMapper.toProjectRiskDomain(m)!);
  }

  async create(risk: ProjectRisk): Promise<ProjectRisk> {
    const created = await this.prisma.projectRisk.create({
      data: ProjectInfraMapper.toProjectRiskCreatePersistence(risk),
      include: {
        project: true,
        owner: true,
      },
    });
    return ProjectInfraMapper.toProjectRiskDomain(created)!;
  }

  async update(id: string, risk: ProjectRisk): Promise<ProjectRisk> {
    const updated = await this.prisma.projectRisk.update({
      where: { id },
      data: ProjectInfraMapper.toProjectRiskUpdatePersistence(risk),
      include: {
        project: true,
        owner: true,
      },
    });
    return ProjectInfraMapper.toProjectRiskDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectRisk.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export { ProjectRiskRepository };

