import { randomUUID } from 'crypto';
import { BaseDomain } from 'src/shared/models/base-domain';
import { User } from './user.model';

export class Role extends BaseDomain<string> {
  private _roleCode: string;
  private _roleName: string;
  private _authRoleCode: string;
  private _expireAt?: Date;
  private _createdBy?: User;
  private _isDefault: boolean;
  constructor(
    id: string,
    roleCode: string,
    roleName: string,
    authRoleCode: string,
    defaultRole?: boolean,
    expireAt?: Date,
    createdBy?: User

  ) {
    super(id);
    this._roleCode = roleCode;
    this._roleName = roleName;
    this._authRoleCode = authRoleCode;
    this._expireAt = expireAt;
    this._createdBy = createdBy;
    this._isDefault = defaultRole ?? false;
  }

  static create(roleCode: string, roleName: string, authRoleCode: string, defaultRole?: boolean) {
    return new Role(randomUUID(), roleCode, roleName, authRoleCode, defaultRole);
  }
  expire() {
    this._expireAt = new Date();
    this.touch();
  }

  /**
   * getters
   */

  get roleCode(): string {
    return this._roleCode;
  }

  get roleName(): string {
    return this._roleName;
  }

  get authRoleCode(): string {
    return this._authRoleCode;
  }

  get expireAt(): Date | undefined {
    return this._expireAt;
  }

  get createdBy(): User | undefined {
    return this._createdBy;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }
}
