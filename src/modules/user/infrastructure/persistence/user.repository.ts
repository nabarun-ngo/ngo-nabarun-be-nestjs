import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User, UserFilterProps } from '../../domain/model/user.model';
import { Address, Prisma } from '@prisma/client';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { Role } from '../../domain/model/role.model';
import { UserInfraMapper } from '../user-infra.mapper';
import { BaseFilter } from 'src/shared/models/base-filter-props';
import { PagedResult } from 'src/shared/models/paged-result';

@Injectable()
class UserRepository
  implements IUserRepository {
  constructor(private readonly prisma: PrismaPostgresService) { }


  async findPaged(filter?: BaseFilter<UserFilterProps> | undefined): Promise<PagedResult<User>> {

    const [data, total] = await Promise.all([
      this.prisma.userProfile.findMany({
        where: this.whereQuery(filter?.props),
        orderBy: { firstName: 'asc' },
        include: {
          roles: true,
          socialMediaLinks: filter?.props?.includeLinks ?? false
        },
        skip: (filter?.pageIndex ?? 0) * (filter?.pageSize ?? 10),
        take: filter?.pageSize ?? 10,
      }),
      this.prisma.userProfile.count({
        where: this.whereQuery(filter?.props),
      })
    ]);

    return new PagedResult<User>(
      data.map(m => UserInfraMapper.toUserDomain(m)!),
      total,
      filter?.pageIndex ?? 0,
      filter?.pageSize ?? 0
    );
  }

  async findAll(filter?: UserFilterProps | undefined): Promise<User[]> {
    const users = await this.prisma.userProfile.findMany({
      where: this.whereQuery(filter),
      orderBy: { firstName: 'asc' },
      include: {
        roles: true,
        socialMediaLinks: filter?.includeLinks ?? false
      },
    })
    return users.map(m => UserInfraMapper.toUserDomain(m)!);
  }

  private whereQuery(props?: UserFilterProps) {
    const where: Prisma.UserProfileWhereInput = {
      ...(props?.firstName ? { firstName: { contains: props.firstName, mode: 'insensitive' } } : {}),
      ...(props?.lastName ? { lastName: { contains: props.lastName, mode: 'insensitive' } } : {}),
      ...(props?.email ? { email: { contains: props.email, mode: 'insensitive' } } : {}),
      ...(props?.status ? { status: props.status } : {}),
      ...(props?.roleCodes ? { roles: { some: { roleCode: { in: [...props.roleCodes] } } } } : {}),
      ...(props?.phoneNumber ? { phoneNumbers: { some: { phoneNumber: props.phoneNumber } } } : {}),
      ...(props?.public ? { isPublic: props.public } : {}),
      deletedAt: null
    };
    return where;
  }


  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.userProfile.findUnique({
      where: { id },
      include: {
        roles: true,
        socialMediaLinks: true,
        addresses: true,
        phoneNumbers: true,
      }
    });
    return UserInfraMapper.toUserDomain(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.userProfile.findUnique({
      where: { email },
      include: {
        roles: true,
        socialMediaLinks: true,
        addresses: true,
        phoneNumbers: true,
      }
    });
    return UserInfraMapper.toUserDomain(user);
  }

  async create(user: User): Promise<User> {
    const createData: Prisma.UserProfileCreateInput = {
      ...UserInfraMapper.toUserCreatePersistence(user),
      roles: {
        create: user.roles.map((role) => UserInfraMapper.toRolePersistance(role)),
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
    };

    const createdUser = await this.prisma.userProfile.create({
      data: createData,
      include: {
        roles: true,
        addresses: true,
        phoneNumbers: true,
        socialMediaLinks: true,
      },
    });
    return UserInfraMapper.toUserDomain(createdUser)!;
  }

  async update(id: string, user: User): Promise<User> {
    const now = new Date();
    const data = UserInfraMapper.toUserCreatePersistence(user);

    return this.prisma.$transaction(async (tx) => {
      // 1. Update core profile
      await tx.userProfile.update({
        where: { id },
        data,
      });

      // 2. Upsert phone numbers
      const phoneNumbers = [user.primaryNumber, user.secondaryNumber].filter(Boolean);
      await Promise.all(
        phoneNumbers.map((phone, index) =>
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
          }),
        ),
      );

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
          version: BigInt(1),
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

      await Promise.all(
        addresses.map((addr) =>
          tx.address.upsert({
            where: { id: addr.id },
            update: { ...addr },
            create: { ...addr },
          }),
        ),
      );

      // 4. Upsert social links
      await Promise.all(
        user.socialMediaLinks.map((link) =>
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
          }),
        ),
      );

      // 5. Return updated profile
      const updated = await tx.userProfile.findUnique({
        where: { id },
        include: {
          roles: true,
          phoneNumbers: true,
          addresses: true,
          socialMediaLinks: true,
        },
      });

      const mappedUser = UserInfraMapper.toUserDomain(updated);
      if (!mappedUser) {
        throw new Error('Failed to map updated user');
      }
      return mappedUser;
    });
  }

  async updateRoles(id: string, roles: Role[]): Promise<void> {
    const now = new Date();
    await this.prisma.$transaction(async (tx) => {
      // Expire old roles
      await tx.userRole.updateMany({
        where: { userId: id, expireAt: null },
        data: { expireAt: now },
      });

      await Promise.all(
        // Create new roles
        roles.map((role) =>
          tx.userRole.create({
            data: {
              id: role.id,
              userId: id,
              roleCode: role.roleCode,
              roleName: role.roleName,
              authRoleCode: role.authRoleCode,
              isDefault: role.isDefault,
              createdAt: now,
            },
          }),
        )
      );
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.userProfile.update({
      where: { id: id },
      data: {
        deletedAt: new Date()
      }
    });
  }

  async restore(id: string): Promise<void> {
    await this.prisma.userProfile.update({
      where: { id: id },
      data: {
        deletedAt: null
      }
    });
  }
}

export default UserRepository;
