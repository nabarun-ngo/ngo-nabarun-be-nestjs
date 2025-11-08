import { LoginMethod, User, UserStatus } from '../domain/model/user.model';
import { PhoneNumber } from '../domain/model/phone-number.vo';
import { Role } from '../domain/model/role.model';
import { Address } from '../domain/model/address.model';
import { Link, LinkType } from '../domain/model/link.model';
import { Auth0User } from './external/auth0-user.service';
import { Prisma } from 'generated/prisma';

export class UserInfraMapper {
  static toUser(
    model: Prisma.UserProfileGetPayload<{
      include: {
        roles?: true;
        phoneNumbers?: true;
        addresses?: true;
        socialMediaLinks?: true;
      };
    }>,
  ): User {
    const primaryNumber =
      model.phoneNumbers == null ? null : model.phoneNumbers.find((p) => p.primary)!;
    const secondaryNumber =
      model.phoneNumbers == null ? null : model.phoneNumbers.find((p) => !p.primary);
    const presentAddress =
      model.addresses == null
        ? null
        : model.addresses.find((a) => a.addressType === 'PRESENT');
    const permanentAddress =
      model.addresses == null
        ? null
        : model.addresses.find((a) => a.addressType == 'PERMANENT');

    return new User(
      model.id,
      model.firstName,
      model.lastName,
      model.email,
      primaryNumber
        ? PhoneNumber.create(
          primaryNumber.phoneCode!,
          primaryNumber.phoneNumber!,
          primaryNumber.hidden,
          primaryNumber.primary,
        )
        : undefined,
      model.status as UserStatus,
      model.isTemporary,
      model.title!,
      model.middleName!,
      model.dateOfBirth!,
      model.gender!,
      model.about!,
      model.picture!,
      model.roles!.map(
        (r) =>
          new Role(r.id, r.roleCode, r.roleName, r.authRoleCode, r.expireAt!),
      ),
      secondaryNumber
        ? PhoneNumber.create(
          secondaryNumber.phoneCode!,
          secondaryNumber.phoneNumber!,
          secondaryNumber.hidden,
          secondaryNumber.primary,
        )
        : undefined,
      presentAddress
        ? new Address(
          presentAddress.id,
          presentAddress.addressLine1!,
          presentAddress.addressLine2!,
          presentAddress.addressLine3!,
          presentAddress.hometown!,
          presentAddress.zipCode!,
          presentAddress.state!,
          presentAddress.district!,
          presentAddress.country!,
        )
        : undefined,
      permanentAddress
        ? new Address(
          permanentAddress.id,
          permanentAddress.addressLine1!,
          permanentAddress.addressLine2!,
          permanentAddress.addressLine3!,
          permanentAddress.hometown!,
          permanentAddress.zipCode!,
          permanentAddress.state!,
          permanentAddress.district!,
          permanentAddress.country!,
        )
        : undefined,
      model.isPublic!,
      model.authUserId!,
      model.isSameAddress!,
      model.loginMethods
        ? (model.loginMethods.split(',') as LoginMethod[])
        : [],
      model.socialMediaLinks?.map(
        (l) => new Link(l.id, l.linkName, l.linkType as LinkType, l.linkValue),
      ),
      model.donationPauseStart!,
      model.donationPauseEnd!,
      model.panNumber!,
      model.aadharNumber!,
    );
  }

  static toUserPersistence(
    user: User,
  ): Partial<Prisma.UserProfileUpdateInput | Prisma.UserProfileCreateInput> {
    return {
      id: user.id,
      title: user.title,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      about: user.about,
      picture: user.picture,
      email: user.email,
      isPublic: user.isPublic,
      authUserId: user.authUserId,
      status: user.status,
      isTemporary: user.isTemporary,
      isSameAddress: user.isSameAddress,
      loginMethods: user.loginMethod.join(','),
      panNumber: user.panNumber,
      aadharNumber: user.aadharNumber,
      donationPauseStart: user.donationPauseStart,
      donationPauseEnd: user.donationPauseEnd,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  static toRolePersistance(
    role: Role,
  ): Partial<PrismaModel.UserRole> {
    return {
      id: role.id,
      roleCode: role.roleCode,
      roleName: role.roleName,
      authRoleCode: role.authRoleCode,
      expireAt: role.expireAt,
      createdAt: role.createdAt,      
    }
  }

  static toAuthUser(a0User: Auth0User) {
    return new User(
      a0User.user_id!,
      a0User.given_name!,
      a0User.family_name!,
      a0User.email!,
      undefined,
      UserStatus.ACTIVE,
      false,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      a0User.user_id,
      undefined,
      a0User.identities?.map((i) => this.connection2LoginMethod(i.connection!)),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    );
  }

  static loginMethod2Connection(method: LoginMethod): string {
    switch (method) {
      case LoginMethod.EMAIL:
        return 'email';
      case LoginMethod.PASSWORD:
        return 'Username-Password-Authentication';
      default:
        return 'Username-Password-Authentication';
    }
  }
  static connection2LoginMethod(connection: string): LoginMethod {
    switch (connection) {
      case 'email':
        return LoginMethod.EMAIL;
      case 'Username-Password-Authentication':
        return LoginMethod.PASSWORD;
      default:
        return LoginMethod.PASSWORD;
    }
  }
}
