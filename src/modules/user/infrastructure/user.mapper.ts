import { User, UserStatus, LoginMethod } from '../../domain/model/user.model';
import {
  UserProfile,
  PhoneNumber as PrismaPhoneNumber,
  Link as PrismaLink,
  Address as PrismaAddress,
  UserRole as PrismaUserRole,
} from 'generated/prisma';
import { PhoneNumber } from '../../domain/model/phone-number.vo';
import { Role } from '../../domain/model/role.model';
import { Address, AddressType } from '../../domain/model/address.model';
import { Link, LinkType } from '../../domain/model/link.model';

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
        : addresses.find(
            (a) => a.addressType === AddressType.PRESENT.toString(),
          );
    const permanentAddress =
      addresses == null
        ? null
        : addresses.find(
            (a) => a.addressType == AddressType.PERMANENT.toString(),
          );

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
            presentAddress.addressType as AddressType,
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
            permanentAddress.addressType as AddressType,
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
    };
  }
}
