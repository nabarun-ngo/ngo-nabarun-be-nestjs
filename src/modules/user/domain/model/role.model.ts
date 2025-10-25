import { randomUUID } from "crypto";
import { BaseDomain } from "src/shared/domain/base-domain"

export class Role extends BaseDomain<string> {
    roleCode: string;
    roleName: string;
    authRoleCode: string;
    expireAt!: Date;

    private constructor(roleCode: string, roleName: string, authRoleCode: string) {
        super(randomUUID());
        this.roleCode = roleCode;
        this.roleName = roleName;
        this.authRoleCode = authRoleCode;
    }
    expire() {
        this.expireAt = new Date();
    }
}