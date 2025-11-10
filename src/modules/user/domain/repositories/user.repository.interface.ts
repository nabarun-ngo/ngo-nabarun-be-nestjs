import { IRepository } from 'src/shared/interfaces/repository.interface';
import { User, UserFilterProps } from '../model/user.model';
import { Role } from '../model/role.model';

export interface IUserRepository extends IRepository<User,string,UserFilterProps> {
  findByEmail(email: string): Promise<User | null>;
  updateRoles(id: string, roles: Role[]): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
