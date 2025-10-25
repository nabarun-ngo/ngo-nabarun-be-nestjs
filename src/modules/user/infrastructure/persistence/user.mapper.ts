import { User } from '../../domain/model/user.model';

// Generic DB model interface - adapt to your DB
export interface UserModel {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class UserMapper {
  static toDomain(model: UserModel): User {
    new User(null);
    // return User.reconstitute(
    //   model.id,
    //   model.name,
    //   model.email,
    //   model.isActive,
    //   model.createdAt,
    //   model.updatedAt,
    // );
    return new User(null, '', '', null, false);
  }

  static toPersistence(user: User): UserModel {
    return {
      id: user.id,
      name: user.name,
      email: user.email.value,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}