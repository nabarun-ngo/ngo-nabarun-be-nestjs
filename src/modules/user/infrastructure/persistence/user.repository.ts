import { Injectable } from '@nestjs/common';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
import { User } from '../../domain/model/user.model';
import { Address, Prisma } from 'generated/prisma';
import { UserFilter } from '../../domain/value-objects/user-filter.vo';
import { PrismaPostgresService } from 'src/modules/shared/database/prisma-postgres.service';
import { Role } from '../../domain/model/role.model';
import { UserInfraMapper } from '../user-infra.mapper';
import { PrismaBaseRepository } from 'src/modules/shared/database/base-repository';
import { RepositoryHelpers } from 'src/modules/shared/database/repository-helpers';
import { UserPersistence } from '../types/user-persistence.types';

@Injectable()
class UserRepository 
  extends PrismaBaseRepository<
    User,
    PrismaPostgresService['userProfile'],
    Prisma.UserProfileWhereUniqueInput,
    Prisma.UserProfileWhereInput,
    UserPersistence.Full,
    Prisma.UserProfileCreateInput,
    Prisma.UserProfileUpdateInput
  >
  implements IUserRepository 
{
  constructor(prisma: PrismaPostgresService) {
    super(prisma);
  }

  protected getDelegate() {
    return this.prisma.userProfile;
  }

  protected toDomain(prismaModel: any): User | null {
    return UserInfraMapper.toUserDomain(prismaModel);
  }

  async findAll(filter: UserFilter): Promise<User[]> {
    const where: Prisma.UserProfileWhereInput = {
      firstName: filter.props.firstName,
      lastName: filter.props.lastName,
      email: filter.props.email,
      status: filter.props.status,
      deletedAt: null,
    };

    return this.findMany(
      where,
      undefined,
      RepositoryHelpers.buildPaginationOptions(
        filter.props.pageIndex,
        filter.props.pageSize,
      ),
    );
  }

  async findById(id: string): Promise<User | null> {
    return this.findUnique({ id });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.findFirst({
      email,
      deletedAt: null,
    });
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

    return this.createRecord(createData);
  }

  async update(id: string, user: User): Promise<User> {
    const now = new Date();
    const data = UserInfraMapper.toUserCreatePersistence(user);

    return this.executeTransaction(async (tx) => {
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

    await this.executeTransaction(async (tx) => {
      // Expire old roles
      await tx.userRole.updateMany({
        where: { userId: id, expireAt: null },
        data: { expireAt: now },
      });
      // Upsert new roles
      await Promise.all(
        roles.map((role) =>
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
          }),
        ),
      );
    });
  }

  async delete(id: string): Promise<void> {
    await this.softDelete({ id });
  }
}

export default UserRepository;
