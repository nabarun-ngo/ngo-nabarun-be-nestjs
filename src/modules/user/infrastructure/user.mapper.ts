import { LoginMethod, User, UserStatus } from '../domain/model/user.model';
import {
  Address as PrismaAddress,
  Link as PrismaLink,
  PhoneNumber as PrismaPhoneNumber,
  UserProfile,
  UserRole as PrismaUserRole,
} from 'generated/prisma';
import { PhoneNumber } from '../domain/model/phone-number.vo';
import { Role } from '../domain/model/role.model';
import { Address } from '../domain/model/address.model';
import { Link, LinkType } from '../domain/model/link.model';
import { Auth0User } from './external/auth0-user.service';

export class UserMapper {
  static toUser(
    model: UserProfile,
    roles?: PrismaUserRole[],
    phoneNumbers?: PrismaPhoneNumber[],
    addresses?: PrismaAddress[],
    socialMediaLinks?: PrismaLink[],
  ): User {
    const primaryNumber =
      phoneNumbers == null ? null : phoneNumbers.find((p) => p.primary)!;
    const secondaryNumber =
      phoneNumbers == null ? null : phoneNumbers.find((p) => !p.primary);
    const presentAddress =
      addresses == null
        ? null
        : addresses.find((a) => a.addressType === 'PRESENT');
    const permanentAddress =
      addresses == null
        ? null
        : addresses.find((a) => a.addressType == 'PERMANENT');

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
      roles!.map(
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
      socialMediaLinks?.map(
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
  ): Omit<UserProfile, 'createdAt' | 'updatedAt' | 'version'> {
    return {
      id: user.id,
      title: user.title ?? null,
      firstName: user.firstName,
      middleName: user.middleName ?? null,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth ?? null,
      gender: user.gender ?? null,
      about: user.about ?? null,
      picture: user.picture ?? null,
      email: user.email,
      isPublic: user.isPublic,
      authUserId: user.authUserId ?? null,
      status: user.status,
      isTemporary: user.isTemporary,
      isSameAddress: user.isSameAddress ?? null,
      loginMethods: user.loginMethod.join(','),
      panNumber: user.panNumber ?? null,
      aadharNumber: user.aadharNumber ?? null,
      donationPauseStart: user.donationPauseStart ?? null,
      donationPauseEnd: user.donationPauseEnd ?? null,
      deletedAt : null
    };
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
