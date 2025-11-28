import { Prisma } from "@prisma/client";
import { Account, AccountStatus, AccountType } from "../../domain/model/account.model";
import { OnlyAccount } from "../persistence/account.repository";
import { MapperUtils } from "src/modules/shared/database/mapper-utils";

export class AccountInfraMapper {
    // ===== ACCOUNT MAPPERS =====

    static toAccountDomain(p: OnlyAccount): Account | null {
        if (!p) return null;

        return new Account(
            p.id,
            p.name,
            p.type as AccountType,
            Number(p.balance),
            p.currency,
            p.status as AccountStatus,
            MapperUtils.nullToUndefined(p.description),
            `${p.accountHolder?.firstName} ${p.accountHolder?.lastName}`,
            MapperUtils.nullToUndefined(p.accountHolderId),
            MapperUtils.nullToUndefined(p.activatedOn),
            p.bankDetail ? JSON.parse(p.bankDetail) : undefined,
            p.upiDetail ? JSON.parse(p.upiDetail) : undefined,
            p.createdAt,
            p.updatedAt,
        );
    }

    static toAccountCreatePersistence(domain: Account): Prisma.AccountCreateInput {
        return {
            id: domain.id,
            name: domain.name,
            type: domain.type,
            balance: domain.balance,
            currency: domain.currency,
            status: domain.status,
            description: MapperUtils.undefinedToNull(domain.description),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            bankDetail: domain.bankDetail ? JSON.stringify(domain.bankDetail) : undefined,
            upiDetail: domain.upiDetail ? JSON.stringify(domain.upiDetail) : undefined,
            accountHolder: { connect: { id: domain.accountHolderId } },
            activatedOn: domain.activatedOn,
        };
    }

    static toAccountUpdatePersistence(domain: Account): Prisma.AccountUncheckedUpdateInput {
        return {
            name: domain.name,
            balance: domain.balance,
            status: domain.status,
            description: MapperUtils.undefinedToNull(domain.description),
            updatedAt: new Date(),
            bankDetail: domain.bankDetail ? JSON.stringify(domain.bankDetail) : undefined,
            upiDetail: domain.upiDetail ? JSON.stringify(domain.upiDetail) : undefined,
            activatedOn: domain.activatedOn,
            currency: domain.currency,
            type: domain.type,

        };
    }

}