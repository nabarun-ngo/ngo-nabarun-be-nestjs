import { Role } from '../../domain/model/role.model';
import { LoginMethod, User } from '../../domain/model/user.model';
import {
  AddressDto,
  LinkDto,
  PhoneNumberDto,
  RoleDto,
  UserDto,
} from './user.dto';
import { PhoneNumber } from '../../domain/model/phone-number.model';
import { Address } from '../../domain/model/address.model';
import { Link } from '../../domain/model/link.model';

export function toUserDTO(user: User): UserDto {
  return {
    id: user.id,
    fullName: user.fullName,
    firstName: user.firstName,
    lastName: user.lastName,
    activeDonor: true,
    blocked: false,
    status: user.status,
    createdOn: user.createdAt,
    roles: user.getRoles()
      .filter((role) => role != null)
      .map((role) => toRoleDTO(role)),
    loginMethod: user.loginMethod as LoginMethod[],
    email: user.email,
    primaryNumber: toPhoneNumberDTO(user.primaryNumber!),
    userId: user.authUserId,
    about: user.about,
    dateOfBirth: user.dateOfBirth,
    gender: user.gender,
    middleName: user.middleName,
    permanentAddress: toAddressDTO(user.permanentAddress!),
    addressSame: user.isSameAddress,
    picture: user.picture,
    presentAddress: toAddressDTO(user.presentAddress!),
    secondaryNumber: toPhoneNumberDTO(user.secondaryNumber!),
    //profileCompleted: user.isProfileCompleted,
    title: user.title,
    socialMediaLinks: user.socialMediaLinks.map((link) => toLinkDTO(link)),
    publicProfile: user.isPublic,
  };
}

export function toRoleDTO(role: Role): RoleDto {
  return {
    roleCode: role.roleCode,
    roleName: role.roleName,
    description: '',
  };
}

export function toPhoneNumberDTO(
  phoneNumber: PhoneNumber,
): PhoneNumberDto | undefined {
  if (!phoneNumber) return undefined;
  return {
    code: phoneNumber.phoneCode,
    number: phoneNumber.phoneNumber,
    fullNumber: phoneNumber.fullNumber,
  };
}

export function toAddressDTO(address: Address): AddressDto | undefined {
  if (!address) return undefined;
  return {
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    addressLine3: address.addressLine3,
    hometown: address.hometown,
    zipCode: address.zipCode,
    country: address.country,
    district: address.district,
    landmark: '',
    state: address.state,
  };
}
export function toLinkDTO(link: Link): LinkDto {
  return {
    linkType: link.linkType,
    linkName: link.linkName,
    linkValue: link.linkValue,
  };
}
