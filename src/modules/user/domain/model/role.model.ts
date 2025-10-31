import { randomUUID } from 'crypto';
import { BaseDomain } from 'src/shared/domain/base-domain';

export class Role extends BaseDomain<string> {
  constructor(
    protected _id: string,
    private _roleCode: string,
    private _roleName: string,
    private _authRoleCode: string,
    private _expireAt?: Date,
  ) {
    super(_id);
  }

  static create(roleCode: string, roleName: string, authRoleCode: string) {
    return new Role(randomUUID(), roleCode, roleName, authRoleCode);
  }
  expire() {
    this._expireAt = new Date();
    this.touch();
  }

  /**
   * getters
   */

  get id(): string {
    return this._id;
  }

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
}
