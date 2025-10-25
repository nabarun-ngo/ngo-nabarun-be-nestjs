import { IRepository } from '../../application/repository.interface';

// DB-agnostic base repository
export abstract class BaseRepository<T, ID> implements IRepository<T, ID> {
  abstract findById(id: ID): Promise<T | null>;
  abstract save(entity: T): Promise<T>;
  abstract delete(id: ID): Promise<void>;
  abstract findAll(): Promise<T[]>;
}