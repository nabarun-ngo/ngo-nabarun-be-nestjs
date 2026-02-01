import { IRepository } from '../interfaces/repository.interface';
import { BaseFilter } from './base-filter-props';
import { PagedResult } from './paged-result';

export abstract class BaseRepository<T, ID, F> implements IRepository<T, ID, F> {
  abstract findPaged<F>(filter?: BaseFilter<F> | undefined): Promise<PagedResult<T>>;
  abstract findAll<F>(filter: F): Promise<T[]>;
  abstract findById(id: ID): Promise<T | null>;
  abstract delete(id: ID): Promise<void>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: ID, entity: T): Promise<T>;
  abstract count<F>(filter: F): Promise<number>;
}
