import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/model/user.model';
import {
  UserProfile,
  PhoneNumber as PrismaPhoneNumber,
  Link as PrismaLink,
  Address as PrismaAddress,
  UserRole as PrismaUserRole,
  Address,
} from 'generated/prisma';
import { UserFilter } from '../../domain/value-objects/user-filter.vo';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { Role } from '../../domain/model/role.model';
import { UserInfraMapper } from '../user-infra.mapper';
import { PrismaModel } from 'generated/prisma/classes';

@Injectable()
class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }

  async findAll(filter: UserFilter): Promise<User[]> {
    const users:PrismaModel.UserProfile[] = await this.prisma.userProfile.findMany({
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

    return users.map((user) => UserInfraMapper.toUser(user));
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
    }))
    return UserInfraMapper.toUser(
      user
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
            createdAt: role.createdAt,
            createdBy : role.createdBy,
            expireAt: role.expireAt,
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

  async update(id: string, user: User): Promise<User> {
    const now = new Date();
    const data = UserMapper.toUserPersistence(user);

    const tx = await this.prisma.$transaction(async (tx) => {
      // 1. Update core profile
      await tx.userProfile.update({
        where: { id },
        data,
      });

      // 2. Upsert phone numbers
      const phoneNumbers = [user.primaryNumber, user.secondaryNumber].filter(Boolean);
      await Promise.all(phoneNumbers.map((phone, index) =>
        tx.phoneNumber.upsert({
          where: { id: phone!.id },
          update: {
            phoneCode: phone!.phoneCode,
            phoneNumber: phone!.phoneNumber,
            hidden: phone!.hidden,
            primary: index === 0,
          },
          create: {
            id: phone!.id,
            userId: id,
            phoneCode: phone!.phoneCode,
            phoneNumber: phone!.phoneNumber,
            hidden: phone!.hidden,
            primary: index === 0,
          },
        })
      ));

      // 3. Upsert addresses
      const addresses: Address[] = [];
      if (user.presentAddress) {
        addresses.push({
          id: user.presentAddress.id,
          userId: id,
          addressLine1: user.presentAddress.addressLine1 ?? null,
          addressLine2: user.presentAddress.addressLine2 ?? null,
          addressLine3: user.presentAddress.addressLine3 ?? null,
          hometown: user.presentAddress.hometown ?? null,
          zipCode: user.presentAddress.zipCode ?? null,
          state: user.presentAddress.state ?? null,
          district: user.presentAddress.district ?? null,
          country: user.presentAddress.country ?? null,
          addressType: 'present',
          version: BigInt(1), // or use domain version if available
        });
      }

      if (user.permanentAddress) {
        addresses.push({
          id: user.permanentAddress.id,
          userId: id,
          addressLine1: user.permanentAddress.addressLine1 ?? null,
          addressLine2: user.permanentAddress.addressLine2 ?? null,
          addressLine3: user.permanentAddress.addressLine3 ?? null,
          hometown: user.permanentAddress.hometown ?? null,
          zipCode: user.permanentAddress.zipCode ?? null,
          state: user.permanentAddress.state ?? null,
          district: user.permanentAddress.district ?? null,
          country: user.permanentAddress.country ?? null,
          addressType: 'permanent',
          version: BigInt(1),
        });
      }



      await Promise.all(addresses.map(addr =>
        tx.address.upsert({
          where: { id: addr.id },
          update: { ...addr },
          create: { ...addr },
        })
      ));

      // 4. Upsert social links
      await Promise.all(user.socialMediaLinks.map(link =>
        tx.link.upsert({
          where: { id: link.id },
          update: {
            linkName: link.linkName,
            linkType: link.linkType,
            linkValue: link.linkValue,
            updatedAt: now,
          },
          create: {
            id: link.id,
            userId: id,
            linkName: link.linkName,
            linkType: link.linkType,
            linkValue: link.linkValue,
            createdAt: now,
            updatedAt: now,
          },
        })
      ));

      // 5. Return updated profile
      const updated = await tx.userProfile.findUnique({
        where: { id },
        include: {
          phoneNumbers: true,
          addresses: true,
          socialMediaLinks: true,
        },
      });

      return UserMapper.toUser(
        updated!,
        [], // roles handled separately
        updated!.phoneNumbers,
        updated!.addresses,
        updated!.socialMediaLinks,
      );
    });

    return tx;
  }

  async updateRoles(id: string, roles: Role[]): Promise<void> {
    const now = new Date();

    await this.prisma.$transaction(async (tx) => {
      // Expire old roles
      await tx.userRole.updateMany({
        where: { userId: id, expireAt: null },
        data: { expireAt: now },
      });
      // Upsert new roles
      await Promise.all(roles.map(role =>
        tx.userRole.upsert({
          where: { id: role.id },
          update: {
            roleCode: role.roleCode,
            roleName: role.roleName,
            authRoleCode: role.authRoleCode,
            expireAt: null,
          },
          create: {
            id: role.id,
            userId: id,
            roleCode: role.roleCode,
            roleName: role.roleName,
            authRoleCode: role.authRoleCode,
            createdAt: now,
          },
        })
      ));
    });
  }


  async delete(id: string): Promise<void> {
    await this.prisma.userProfile.update({ where: { id }, data: { deletedAt: new Date() }});
  }
}

export default UserRepository;
