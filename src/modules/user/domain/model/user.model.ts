import { AggregateRoot } from '../../../../shared/models/aggregate-root';
import { UserCreatedEvent } from '../events/user-created.event';
import { randomUUID } from 'crypto';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { Expose } from 'class-transformer';
import { Role } from './role.model';
import { Address } from './address.model';
import { PhoneNumber } from './phone-number.vo';
import { Link } from './link.model';
import { generatePassword } from '../../../../shared/utilities/password-util';

export enum UserStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
}
export enum LoginMethod {
  EMAIL = 'EMAIL',
  PASSWORD = 'PASSWORD',
}

export class User extends AggregateRoot<string> {
  private _fullName: string;
  private _initials: string;
  constructor(
    protected _id: string,
    private _firstName: string,
    private _lastName: string,
    private _email: string,
    private _primaryNumber?: PhoneNumber,
    private _status: UserStatus = UserStatus.DRAFT,
    private _isTemporary: boolean = false,
    private _title?: string,
    private _middleName?: string,
    private _dateOfBirth?: Date,
    private _gender?: string,
    private _about?: string,
    private _picture?: string,
    private _roles: Role[] = [],
    private _secondaryNumber?: PhoneNumber,
    private _presentAddress?: Address,
    private _permanentAddress?: Address,
    private _isPublic: boolean = true,
    private _authUserId?: string,
    private _isSameAddress?: boolean,
    private _loginMethod: LoginMethod[] = [
      LoginMethod.EMAIL,
      LoginMethod.PASSWORD,
    ],
    private _socialMediaLinks: Link[] = [],
    private _donationPauseStart?: Date,
    private _donationPauseEnd?: Date,
    private _panNumber?: string,
    private _aadharNumber?: string,
    private _isProfileCompleted: boolean = false,
  ) {
    super(_id);
    this._fullName = this.computeFullName();
    this._initials = this.computeInitials();
    this._picture = this.generatePictureUrl();
  }

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
    user.addDomainEvent(new UserCreatedEvent(user.id, user));
    return user;
  }

  // Domain behaviors
  private computeFullName(): string {
    const f = this._firstName ?? '';
    const l = this._lastName ?? '';
    return (f + ' ' + l).trim();
  }

  private computeInitials(): string {
    if (!this._firstName || !this._lastName) return '';
    return (this._firstName[0] + this._lastName[0]).toUpperCase();
  }

  private generatePictureUrl() {
    return `https://ui-avatars.com/api/?name=${this._firstName}+${this._lastName}&background=random`.replace(
      /\s+/g,
      '',
    );
  }

  public createPassword() {
    return generatePassword({
      length: 8,
      includeUppercase: true,
      includeLowercase: true,
      includeNumbers: true,
      includeSymbols: true,
    });
  }

  public updateUser(detail: {
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
  }): void {
    this._title = detail.title ?? this._title;
    this._firstName = detail.firstName ?? this._firstName;
    this._middleName = detail.middleName ?? this._middleName;
    this._lastName = detail.lastName ?? this._lastName;
    this._fullName = this.computeFullName();
    this._dateOfBirth = detail.dateOfBirth ?? this._dateOfBirth;
    this._gender = detail.gender ?? this._gender;
    this._about = detail.about ?? this._about;
    this._picture = detail.picture ?? this._picture;
    this._primaryNumber = detail.primaryNumber ?? this._primaryNumber;
    this._secondaryNumber = detail.secondaryNumber ?? this._secondaryNumber;
    this._presentAddress = detail.presentAddress ?? this._presentAddress;
    this._permanentAddress = detail.permanentAddress ?? this._permanentAddress;
    this._isSameAddress = detail.isAddressSame ?? this._isSameAddress;
    this._isPublic = detail.isPublicProfile ?? this._isPublic;
    this._socialMediaLinks = detail.socialMediaLinks ?? this._socialMediaLinks;
    this._isProfileCompleted = !!(
      this._firstName &&
      this._lastName &&
      this._dateOfBirth &&
      this._gender &&
      this._email &&
      this._authUserId
    );
    this._fullName = this.computeFullName();
    this._initials = this.computeInitials();
    this._picture = this.generatePictureUrl();
    this.touch();
  }

  public updateAdmin(detail: {
    roles?: Role[];
    status?: UserStatus;
    userId?: string;
  }): void {
    this._roles = detail.roles ?? this._roles;
    this._status = detail.status ?? this._status;
    this._authUserId = detail.userId ?? this._authUserId;
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
    const currentRoles = activeRoles ? [...activeRoles] :[];
    const incomingRoles = newRoles ? [...newRoles] : [];

    // Ensure default roles are always present
    defaultRoles?.forEach((dr) => {
      if (!incomingRoles.some((r) => r.roleCode === dr.roleCode)) {
        incomingRoles.push(dr);
      }
    });

    const toAdd = incomingRoles.filter(
      (r) => !currentRoles.some((cr) => cr.roleCode === r.roleCode),
    );
    const toRemove = currentRoles.filter(
      (r) =>
        !incomingRoles.some((ir) => ir.roleCode === r.roleCode) &&
        !defaultRoles.some((dr) => dr.roleCode === r.roleCode),
    );

    // Expire existing active roles
    this._roles.forEach((role) => {
      if (!role.expireAt) role.expire();
    });

    this._roles.push(...incomingRoles);
    return { toAdd, toRemove };
  }

  public changeStatus(newStatus: UserStatus): void {
    if (newStatus) this._status = newStatus;
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
}
