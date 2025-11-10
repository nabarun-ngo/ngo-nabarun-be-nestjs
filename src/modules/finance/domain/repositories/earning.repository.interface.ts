import { IRepository } from 'src/shared/interfaces/repository.interface';
import { Earning, EarningCategory } from '../model/earning.model';

export interface IEarningRepository extends IRepository<Earning, string> {
  findById(id: string): Promise<Earning | null>;
  findByCategory(category: EarningCategory): Promise<Earning[]>;
  findBySource(source: string): Promise<Earning[]>;
  create(earning: Earning): Promise<Earning>;
  update(id: string, earning: Earning): Promise<Earning>;
  delete(id: string): Promise<void>;
  findAll(filter?: any): Promise<Earning[]>;
}

export const EARNING_REPOSITORY = Symbol('EARNING_REPOSITORY');
