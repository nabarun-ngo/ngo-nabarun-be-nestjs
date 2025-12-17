import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Milestone, MilestoneFilterProps } from '../model/milestone.model';

export interface IMilestoneRepository extends IRepository<Milestone, string, MilestoneFilterProps> {
  findById(id: string): Promise<Milestone | null>;
  findByProjectId(projectId: string): Promise<Milestone[]>;
  findByStatus(status: string): Promise<Milestone[]>;
  create(milestone: Milestone): Promise<Milestone>;
  update(id: string, milestone: Milestone): Promise<Milestone>;
  delete(id: string): Promise<void>;
  findAll(filter?: MilestoneFilterProps): Promise<Milestone[]>;
}

export const MILESTONE_REPOSITORY = Symbol('MILESTONE_REPOSITORY');

