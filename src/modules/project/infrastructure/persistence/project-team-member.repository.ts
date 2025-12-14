import { Injectable } from '@nestjs/common';
import { IProjectTeamMemberRepository } from '../../domain/repositories/project-team-member.repository.interface';
import { ProjectTeamMember, ProjectTeamMemberFilterProps } from '../../domain/model/project-team-member.model';
import { Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { ProjectInfraMapper } from '../project-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class ProjectTeamMemberRepository implements IProjectTeamMemberRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  findPaged(filter?: BaseFilter<ProjectTeamMemberFilterProps> | undefined): Promise<PagedResult<ProjectTeamMember>> {
    throw new Error('Method not implemented.');
  }

  async findAll(filter?: ProjectTeamMemberFilterProps): Promise<ProjectTeamMember[]> {
    const members = await this.prisma.projectTeamMember.findMany({
      where: this.whereQuery(filter),
      orderBy: { createdAt: 'desc' },
      include: {
        project: true,
        user: true,
      },
    });
    return members.map(m => ProjectInfraMapper.toProjectTeamMemberDomain(m)!);
  }

  private whereQuery(props?: ProjectTeamMemberFilterProps): Prisma.ProjectTeamMemberWhereInput {
    return {
      ...(props?.projectId ? { projectId: props.projectId } : {}),
      ...(props?.userId ? { userId: props.userId } : {}),
      ...(props?.isActive !== undefined ? { isActive: props.isActive } : {}),
      ...(props?.role ? { role: props.role } : {}),
      deletedAt: null,
    };
  }

  async findById(id: string): Promise<ProjectTeamMember | null> {
    const member = await this.prisma.projectTeamMember.findUnique({
      where: { id },
      include: {
        project: true,
        user: true,
      },
    });
    return ProjectInfraMapper.toProjectTeamMemberDomain(member);
  }

  async findByProjectId(projectId: string): Promise<ProjectTeamMember[]> {
    const members = await this.prisma.projectTeamMember.findMany({
      where: { projectId, deletedAt: null },
      include: {
        project: true,
        user: true,
      },
    });
    return members.map(m => ProjectInfraMapper.toProjectTeamMemberDomain(m)!);
  }

  async findByUserId(userId: string): Promise<ProjectTeamMember[]> {
    const members = await this.prisma.projectTeamMember.findMany({
      where: { userId, deletedAt: null },
      include: {
        project: true,
        user: true,
      },
    });
    return members.map(m => ProjectInfraMapper.toProjectTeamMemberDomain(m)!);
  }

  async findByActiveMembers(projectId: string): Promise<ProjectTeamMember[]> {
    const members = await this.prisma.projectTeamMember.findMany({
      where: { projectId, isActive: true, deletedAt: null },
      include: {
        project: true,
        user: true,
      },
    });
    return members.map(m => ProjectInfraMapper.toProjectTeamMemberDomain(m)!);
  }

  async create(member: ProjectTeamMember): Promise<ProjectTeamMember> {
    const created = await this.prisma.projectTeamMember.create({
      data: ProjectInfraMapper.toProjectTeamMemberCreatePersistence(member),
      include: {
        project: true,
        user: true,
      },
    });
    return ProjectInfraMapper.toProjectTeamMemberDomain(created)!;
  }

  async update(id: string, member: ProjectTeamMember): Promise<ProjectTeamMember> {
    const updated = await this.prisma.projectTeamMember.update({
      where: { id },
      data: ProjectInfraMapper.toProjectTeamMemberUpdatePersistence(member),
      include: {
        project: true,
        user: true,
      },
    });
    return ProjectInfraMapper.toProjectTeamMemberDomain(updated)!;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.projectTeamMember.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

export { ProjectTeamMemberRepository };

