import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { UserCreatedEvent } from '../events/user-created.event';
import { randomUUID } from 'crypto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { Role } from './role.model';
import { Address } from './address.model';
import { PhoneNumber } from './phone-number.vo';
import { Link } from './link.model';
import { generatePassword } from '../../../../shared/utilities/password-util';
import { RoleAssignedEvent } from '../events/role-assigned.event';

export enum UserStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  BLOCKED = "BLOCKED",
}
export enum LoginMethod {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
}

export class UserFilterProps {
  readonly firstName?: string;
  readonly lastName?: string;
  readonly email?: string;
  readonly status?: UserStatus;
  readonly roleCode?: string;
  readonly phoneNumber?: string;
}

export class UserProfileProps {
  title?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  gender?: string;
  about?: string;
  picture?: string;
  primaryNumber?: PhoneNumber;
  secondaryNumber?: PhoneNumber;
  presentAddress?: Address;
  permanentAddress?: Address;
  isAddressSame?: boolean;
  isPublicProfile?: boolean;
  socialMediaLinks?: Link[];
}

export class UserAttributesProps {
  status?: UserStatus;
  userId?: string;
  roles?: Role[];
}
export class User extends AggregateRoot<string> {
  private _updateAuth: boolean = false;
  private _password?: string;

  // Factory
  public static create(data: {
    firstName: string;
    lastName: string;
    email: string;
    number: PhoneNumber;
    isTemporary: boolean;
  }): User {
    if (!data.firstName || !data.lastName || !data.email || !data.number) {
      throw new BusinessException(
        'firstName, lastName, phoneNumber and email are required',
      );
    }
    const user = new User(
      randomUUID(),
      data.firstName,
      data.lastName,
      data.email,
      data.number,
      UserStatus.DRAFT,
      data.isTemporary,
    );
    user._password = generatePassword({
      length: 14,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    })
    user.addDomainEvent(new UserCreatedEvent(user.id, user));
    return user;
  }

  // Domain behaviors
  private computeFullName(): string {
    const f = this.firstName ?? '';
    const l = this._lastName ?? '';
    return (f + ' ' + l).trim();
  }

  private computeInitials(): string {
    if (!this.firstName || !this._lastName) return '';
    return (this.firstName[0] + this._lastName[0]).toUpperCase();
  }

  private generatePictureUrl() {
    return `https://ui-avatars.com/api/?name=${this._firstName}+${this._lastName}&background=random`.replace(
      /\s+/g,
      '',
    );
  }

  public updateUser(detail: UserProfileProps): void {
    this._title = detail.title ?? this._title;
    this._firstName = detail.firstName ?? this.firstName;
    this._middleName = detail.middleName ?? this._middleName;
    this._lastName = detail.lastName ?? this._lastName;
    this._fullName = this.computeFullName();
    this._dateOfBirth = detail.dateOfBirth ?? this._dateOfBirth;
    this._gender = detail.gender ?? this._gender;
    this._about = detail.about ?? this._about;

    if (detail.primaryNumber) {
      this._primaryNumber = this._primaryNumber?.update(detail.primaryNumber) ??
        PhoneNumber.create(detail.primaryNumber.phoneCode, detail.primaryNumber.phoneNumber);
    }

    if (detail.secondaryNumber) {
      this._secondaryNumber = this.secondaryNumber?.update(detail.secondaryNumber) ??
        PhoneNumber.create(detail.secondaryNumber.phoneCode, detail.secondaryNumber.phoneNumber);
    }

    if (detail.presentAddress) {
      const address = detail.presentAddress;
      this._presentAddress = this._presentAddress?.update(detail.presentAddress) ??
        Address.create(address.addressLine1, address.addressLine2, address.addressLine3,
          address.hometown, address.zipCode, address.state,
          address.district, address.country);
    }
    if (detail.permanentAddress) {
      const address = detail.permanentAddress;
      this._permanentAddress = this._permanentAddress?.update(detail.permanentAddress) ??
        Address.create(address.addressLine1, address.addressLine2, address.addressLine3,
          address.hometown, address.zipCode, address.state,
          address.district, address.country)
    } 

    this._isSameAddress = detail.isAddressSame ?? this._isSameAddress;
    this._isPublic = detail.isPublicProfile ?? this._isPublic;

    if(detail.socialMediaLinks && detail.socialMediaLinks.length > 0){
      detail.socialMediaLinks.forEach(link => {
        const existing = this._socialMediaLinks.find(f=>f.linkType === link.linkType);
        if(existing){
          existing.update(link);
        }else{
          this._socialMediaLinks.push(Link.create(link.linkName, link.linkType, link.linkValue));
        }
      })
    }

    this._isProfileCompleted = !!(
      this.firstName &&
      this._lastName &&
      this._dateOfBirth &&
      this._gender &&
      this._email &&
      this._authUserId
    );
    this._fullName = this.computeFullName();
    this._initials = this.computeInitials();
    this._picture = detail.picture ?? this._picture ?? this.generatePictureUrl();
    this._updateAuth = (detail.firstName !== undefined ||
      detail.lastName !== undefined ||
      detail.picture !== undefined ||
      this._isProfileCompleted);
    console.log('Update Auth Flag:', this._updateAuth);
    this.touch();
  }

  public updateAdmin(detail: UserAttributesProps): void {
    if(detail.roles && detail.roles.length > 0){
      this.updateRoles(detail.roles, []);// no need to pass default role
    }
    this._status = detail.status ?? this._status;
    this._authUserId = detail.userId ?? this._authUserId;
    this._updateAuth = true;
    this.touch();
  }

  public addLoginMethod(method: LoginMethod): void {
    if (!this._loginMethod.includes(method)) {
      this._loginMethod.push(method);
    }
  }

  public removeLoginMethod(method: LoginMethod): void {
    if (method === LoginMethod.PASSWORD) {
      throw new BusinessException('Login Method PASSWORD cannot be removed.');
    }
    this._loginMethod = this._loginMethod.filter((m) => m !== method);
  }

  public updateRoles(
    newRoles: Role[],
    defaultRoles: Role[],
  ): { toAdd: Role[]; toRemove: Role[] } {
    //if (!newRoles) return { toAdd: [], toRemove: [] };

    const activeRoles = this._roles.filter((r) => !r.expireAt);
    const currentRoles = activeRoles ? [...activeRoles] : [];
    const incomingRoles = newRoles ? [...newRoles] : [];

    // Ensure default roles are always present
    defaultRoles?.forEach((dr) => {
      if (!incomingRoles.some((r) => r.roleCode === dr.roleCode)) {
        incomingRoles.push(Role.create(dr.roleCode, dr.roleName, dr.authRoleCode, true));
      }
    });

    const toAdd = incomingRoles.filter(
      (r) => !currentRoles.some((cr) => cr.roleCode === r.roleCode),
    );
    const toRemove = currentRoles.filter(
      (r) =>
        !incomingRoles.some((ir) => ir.roleCode === r.roleCode) &&
        !defaultRoles.some((dr) => dr.roleCode === r.roleCode),
    ).filter((r) => !r.isDefault);

    // Expire existing active roles
    this._roles.forEach((role) => {
      if (!role.expireAt) role.expire();
    });

    incomingRoles.forEach((role) => {
      this._roles.push(Role.create(role.roleCode, role.roleName, role.authRoleCode));
    });

    if(toAdd.length > 0 || toRemove.length > 0){
      this.addDomainEvent(new RoleAssignedEvent(this.id, this))
    }
    return { toAdd, toRemove };
  }

  public changeStatus(newStatus: UserStatus): void {
    if (newStatus) { 
      this._status = newStatus;
      this._updateAuth = true;
      this.touch();
    }
  }

  // Getters (read-only views)
  public getRoles(): ReadonlyArray<Role> {
    return this._roles.filter((r) => !r.expireAt);
  }

  public getRoleHistory(): Record<string, Role[]> {
    const format = (d: Date) =>
      d.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    return this._roles.reduce(
      (acc, role) => {
        const start = format(role.createdAt);
        const end = role.expireAt ? format(role.expireAt) : 'Present';
        const key = `${start} - ${end}`;
        acc[key] = acc[key] || [];
        acc[key].push(role);
        return acc;
      },
      {} as Record<string, Role[]>,
    );
  }

  /**
   * Getters
   */
  // region

  private _fullName: string;
  private _initials: string;
  private _firstName: string;
  private _lastName: string;
  private _email: string;
  private _primaryNumber?: PhoneNumber;
  private _status: UserStatus;
  private _isTemporary: boolean;
  private _title?: string;
  private _middleName?: string;
  private _dateOfBirth?: Date;
  private _gender?: string;
  private _about?: string;
  private _picture?: string;
  private _roles: Role[];
  private _secondaryNumber?: PhoneNumber;
  private _presentAddress?: Address;
  private _permanentAddress?: Address;
  private _isPublic: boolean;
  private _authUserId?: string;
  private _isSameAddress?: boolean;
  private _loginMethod: LoginMethod[];
  private _socialMediaLinks: Link[];
  private _donationPauseStart?: Date;
  private _donationPauseEnd?: Date;
  private _panNumber?: string;
  private _aadharNumber?: string;
  private _isProfileCompleted: boolean;
  constructor(
    id: string,
    firstName: string,
    lastName: string,
    email: string,
    primaryNumber?: PhoneNumber,
    status: UserStatus = UserStatus.DRAFT,
    isTemporary: boolean = false,
    title?: string,
    middleName?: string,
    dateOfBirth?: Date,
    gender?: string,
    about?: string,
    picture?: string,
    roles: Role[] = [],
    secondaryNumber?: PhoneNumber,
    presentAddress?: Address,
    permanentAddress?: Address,
    isPublic: boolean = true,
    authUserId?: string,
    isSameAddress?: boolean,
    loginMethod: LoginMethod[] = [
      LoginMethod.EMAIL,
      LoginMethod.PASSWORD,
    ],
    socialMediaLinks: Link[] = [],
    donationPauseStart?: Date,
    donationPauseEnd?: Date,
    panNumber?: string,
    aadharNumber?: string,
    isProfileCompleted: boolean = false,
  ) {
    super(id);
    this._initials = this.computeInitials();
    this._picture = this.generatePictureUrl();
    this._firstName = firstName;
    this._lastName = lastName;
    this._email = email;
    this._primaryNumber = primaryNumber;
    this._status = status;
    this._isTemporary = isTemporary;
    this._title = title;
    this._middleName = middleName;
    this._dateOfBirth = dateOfBirth;
    this._gender = gender;
    this._about = about;
    this._picture = picture;
    this._roles = roles;
    this._secondaryNumber = secondaryNumber;
    this._presentAddress = presentAddress;
    this._permanentAddress = permanentAddress;
    this._isPublic = isPublic;
    this._authUserId = authUserId;
    this._isSameAddress = isSameAddress;
    this._loginMethod = loginMethod;
    this._socialMediaLinks = socialMediaLinks;
    this._donationPauseStart = donationPauseStart;
    this._donationPauseEnd = donationPauseEnd;
    this._panNumber = panNumber;
    this._aadharNumber = aadharNumber;
    this._isProfileCompleted = isProfileCompleted;
    this._fullName = this.computeFullName();
  }

  get fullName(): string {
    return this._fullName;
  }

  get initials(): string {
    return this._initials;
  }

  get id(): string {
    return this._id;
  }

  get firstName(): string {
    return this._firstName;
  }

  get lastName(): string {
    return this._lastName;
  }

  get email(): string {
    return this._email;
  }

  get primaryNumber(): PhoneNumber | undefined {
    return this._primaryNumber;
  }

  get status(): UserStatus {
    return this._status;
  }

  get isTemporary(): boolean {
    return this._isTemporary;
  }

  get title(): string | undefined {
    return this._title;
  }

  get middleName(): string | undefined {
    return this._middleName;
  }

  get dateOfBirth(): Date | undefined {
    return this._dateOfBirth;
  }

  get gender(): string | undefined {
    return this._gender;
  }

  get about(): string | undefined {
    return this._about;
  }

  get picture(): string | undefined {
    return this._picture;
  }

  get roles(): ReadonlyArray<Role> {
    return this._roles;
  }

  get secondaryNumber(): PhoneNumber | undefined {
    return this._secondaryNumber;
  }

  get presentAddress(): Address | undefined {
    return this._presentAddress;
  }

  get permanentAddress(): Address | undefined {
    return this._permanentAddress;
  }

  get isPublic(): boolean {
    return this._isPublic;
  }

  get authUserId(): string | undefined {
    return this._authUserId;
  }

  get isSameAddress(): boolean | undefined {
    return this._isSameAddress;
  }

  get loginMethod(): ReadonlyArray<LoginMethod> {
    return this._loginMethod;
  }

  get socialMediaLinks(): ReadonlyArray<Link> {
    return this._socialMediaLinks;
  }

  get donationPauseStart(): Date | undefined {
    return this._donationPauseStart;
  }

  get donationPauseEnd(): Date | undefined {
    return this._donationPauseEnd;
  }

  get panNumber(): string | undefined {
    return this._panNumber;
  }

  get aadharNumber(): string | undefined {
    return this._aadharNumber;
  }

  get isProfileCompleted(): boolean {
    return this._isProfileCompleted;
  }

  get updateAuth(): boolean {
    return this._updateAuth;
  }

  get password(){
    return this._password;
  }

  // endregion
}
