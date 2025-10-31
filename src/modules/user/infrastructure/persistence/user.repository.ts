import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/model/user.model';
import { PrismaService } from 'src/shared/infrastructure/database/prisma.service';
import { UserMapper } from '../user.mapper';
import {
  UserProfile,
  PhoneNumber as PrismaPhoneNumber,
  Link as PrismaLink,
  Address as PrismaAddress,
  UserRole as PrismaUserRole,
} from 'generated/prisma';
import { UserFilter } from '../../domain/value-objects/user-filter.vo';

@Injectable()
class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: UserFilter): Promise<User[]> {
    const users = await this.prisma.userProfile.findMany({
      where: {
        firstName: filter.props.firstName,
        lastName: filter.props.lastName,
        email: filter.props.email,
        status: filter.props.status,
      },
      include: {
        roles: true,
      },
      take: filter.props.pageSize,
      skip: filter.props.pageIndex
        ? filter.props.pageIndex * filter.props.pageSize!
        : undefined,
    });

    return users.map((user) => UserMapper.toUser(user, user.roles));
  }

  async findById(id: string): Promise<User | null> {
    const user = (await this.prisma.userProfile.findUnique({
      where: { id: id },
      include: {
        roles: true,
        phoneNumbers: true,
        addresses: true,
        socialMediaLinks: true,
      },
    })) as UserProfile & {
      roles: PrismaUserRole[];
      phoneNumbers: PrismaPhoneNumber[];
      addresses: PrismaAddress[];
      socialMediaLinks: PrismaLink[];
    };
    return UserMapper.toUser(
      user,
      user.roles,
      user.phoneNumbers,
      user.addresses,
      user.socialMediaLinks,
    );
  }
  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.userProfile.findUnique({
      where: { email: email },
      include: {
        roles: true,
        phoneNumbers: true,
      },
    });
    return user == null ? null : UserMapper.toUser(user, user?.roles);
  }

  async create(user: User): Promise<User> {
    const created_user = await this.prisma.userProfile.create({
      data: {
        ...UserMapper.toUserPersistence(user),
        roles: {
          create: user.roles.map((role) => ({
            id: role.id,
            roleCode: role.roleCode,
            roleName: role.roleName,
            authRoleCode: role.authRoleCode,
          })),
        },
        phoneNumbers: {
          create: user.primaryNumber
            ? [
                {
                  id: user.primaryNumber.id,
                  phoneCode: user.primaryNumber.phoneCode,
                  phoneNumber: user.primaryNumber.phoneNumber,
                  hidden: user.primaryNumber.hidden,
                  primary: true,
                },
              ]
            : [],
        },
      },
      include: {
        roles: true,
        phoneNumbers: true,
      },
    });
    return UserMapper.toUser(
      created_user,
      created_user.roles,
      created_user.phoneNumbers,
    );
  }

  update(id: string, user: User): Promise<User> {
    throw new Error('Method not implemented.');
  }

  delete(id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }
}

export default UserRepository;
