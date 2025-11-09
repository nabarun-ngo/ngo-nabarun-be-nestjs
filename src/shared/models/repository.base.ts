import { IRepository } from '../interfaces/repository.interface';
import { BaseFilter } from './base-filter-props';
import { PagedResult } from './paged-result';

export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  abstract findPaged(filter?: BaseFilter<any> | undefined): Promise<PagedResult<T>>;
  abstract findAll<F>(filter: F): Promise<T[]>;
  abstract findById(id: ID): Promise<T | null>;
  abstract delete(id: ID): Promise<void>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: ID, entity: T): Promise<T>;
}
