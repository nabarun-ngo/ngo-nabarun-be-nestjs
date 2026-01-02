import { IRepository } from 'src/shared/interfaces/repository.interface';
import { ProjectTeamMember, ProjectTeamMemberFilterProps } from '../model/project-team-member.model';

export interface IProjectTeamMemberRepository extends IRepository<ProjectTeamMember, string, ProjectTeamMemberFilterProps> {
  findById(id: string): Promise<ProjectTeamMember | null>;
  findByProjectId(projectId: string): Promise<ProjectTeamMember[]>;
  findByUserId(userId: string): Promise<ProjectTeamMember[]>;
  findByActiveMembers(projectId: string): Promise<ProjectTeamMember[]>;
  create(member: ProjectTeamMember): Promise<ProjectTeamMember>;
  update(id: string, member: ProjectTeamMember): Promise<ProjectTeamMember>;
  delete(id: string): Promise<void>;
  findAll(filter?: ProjectTeamMemberFilterProps): Promise<ProjectTeamMember[]>;
}

export const PROJECT_TEAM_MEMBER_REPOSITORY = Symbol('PROJECT_TEAM_MEMBER_REPOSITORY');

