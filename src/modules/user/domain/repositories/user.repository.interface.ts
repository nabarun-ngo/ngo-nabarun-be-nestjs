import { IRepository } from 'src/shared/interfaces/repository.interface';
import { User } from '../model/user.model';
import { UserFilter } from '../value-objects/user-filter.vo';

export interface IUserRepository extends IRepository<User,string> {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(user: User): Promise<User>;
  update(id: string, user: User): Promise<User>;
  delete(id: string): Promise<void>;
  findAll(filter: UserFilter): Promise<User[]>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
