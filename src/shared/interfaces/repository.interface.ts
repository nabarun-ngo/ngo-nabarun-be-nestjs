export interface IRepository<T, ID, F = any> {
  findAll(filter: F): Promise<T[]>;
  findById(id: ID): Promise<T | null>;
  create(entity: T): Promise<T>;
  update(id: ID, entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}
