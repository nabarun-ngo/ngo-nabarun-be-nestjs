import { randomUUID } from 'crypto';
import { BaseDomain } from 'src/shared/models/base-domain';
import { User } from './user.model';

export class Role extends BaseDomain<string> {

  // 🔒 TRUE PRIVATE FIELDS
  #roleCode: string;
  #roleName: string;
  #authRoleCode: string;
  #expireAt?: Date;
  #createdBy?: User;
  #isDefault: boolean;

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

    this.#roleCode = roleCode;
    this.#roleName = roleName;
    this.#authRoleCode = authRoleCode;
    this.#expireAt = expireAt;
    this.#createdBy = createdBy;
    this.#isDefault = defaultRole ?? false;
  }

  static create(
    roleCode: string,
    roleName: string,
    authRoleCode: string,
    defaultRole?: boolean
  ) {
    return new Role(randomUUID(), roleCode, roleName, authRoleCode, defaultRole);
  }

  expire() {
    this.#expireAt = new Date();
    this.touch();
  }

  // === GETTERS (required for BaseDomain.toJson()) ===

  get roleCode(): string {
    return this.#roleCode;
  }

  get roleName(): string {
    return this.#roleName;
  }

  get authRoleCode(): string {
    return this.#authRoleCode;
  }

  get expireAt(): Date | undefined {
    return this.#expireAt;
  }

  get createdBy(): User | undefined {
    return this.#createdBy;
  }

  get isDefault(): boolean {
    return this.#isDefault;
  }
}
