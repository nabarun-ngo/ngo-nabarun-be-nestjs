import { IRepository } from '../../domain/repository.interface';

export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  abstract findAll<F>(filter: F): Promise<T[]>;
  abstract findById(id: ID): Promise<T | null>;
  abstract delete(id: ID): Promise<void>;
  abstract create(entity: T): Promise<T>;
  abstract update(id: ID, entity: T): Promise<T>;
}
