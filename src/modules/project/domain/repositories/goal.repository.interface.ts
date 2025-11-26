import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Goal, GoalFilterProps } from '../model/goal.model';

export interface IGoalRepository extends IRepository<Goal, string, GoalFilterProps> {
  findById(id: string): Promise<Goal | null>;
  findByProjectId(projectId: string): Promise<Goal[]>;
  findByStatus(status: string): Promise<Goal[]>;
  create(goal: Goal): Promise<Goal>;
  update(id: string, goal: Goal): Promise<Goal>;
  delete(id: string): Promise<void>;
  findAll(filter?: GoalFilterProps): Promise<Goal[]>;
}

export const GOAL_REPOSITORY = Symbol('GOAL_REPOSITORY');

