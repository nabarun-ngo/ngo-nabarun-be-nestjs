import { IRepository } from 'src/shared/interfaces/repository.interface';
import { ProjectRisk, ProjectRiskFilterProps } from '../model/project-risk.model';

export interface IProjectRiskRepository extends IRepository<ProjectRisk, string, ProjectRiskFilterProps> {
  findById(id: string): Promise<ProjectRisk | null>;
  findByProjectId(projectId: string): Promise<ProjectRisk[]>;
  findByStatus(status: string): Promise<ProjectRisk[]>;
  findBySeverity(severity: string): Promise<ProjectRisk[]>;
  findByCategory(category: string): Promise<ProjectRisk[]>;
  create(risk: ProjectRisk): Promise<ProjectRisk>;
  update(id: string, risk: ProjectRisk): Promise<ProjectRisk>;
  delete(id: string): Promise<void>;
  findAll(filter?: ProjectRiskFilterProps): Promise<ProjectRisk[]>;
}

export const PROJECT_RISK_REPOSITORY = Symbol('PROJECT_RISK_REPOSITORY');

