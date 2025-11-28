import { MapperUtils } from "src/modules/shared/database/mapper-utils";
import { Earning, EarningCategory, EarningStatus } from "../../domain/model/earning.model";
import { Prisma } from "@prisma/client";
import { EarningPersistence } from "../persistence/earning.repository";

export class EarningInfraMapper {
    // ===== EARNING MAPPERS =====

    static toEarningDomain(p: EarningPersistence): Earning | null {
        if (!p) return null;

        return new Earning(
            p.id,
            p.category as EarningCategory,
            Number(p.amount),
            p.currency,
            p.status as EarningStatus,
            p.description,
            p.source,
            MapperUtils.nullToUndefined(p.referenceId),
            MapperUtils.nullToUndefined(p.referenceType),
            MapperUtils.nullToUndefined(p.accountId),
            MapperUtils.nullToUndefined(p.transactionId),
            p.earningDate,
            MapperUtils.nullToUndefined(p.receivedDate),
            p.createdAt,
            p.updatedAt,
        );
    }

    static toEarningCreatePersistence(domain: Earning): Prisma.EarningUncheckedCreateInput {
        return {
            id: domain.id,
            category: domain.category,
            amount: domain.amount,
            currency: domain.currency,
            status: domain.status,
            description: domain.description,
            source: domain.source,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            transactionId: MapperUtils.undefinedToNull(domain.transactionId),
            earningDate: domain.earningDate,
            receivedDate: MapperUtils.undefinedToNull(domain.receivedDate),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }

    static toEarningUpdatePersistence(domain: Earning): Prisma.EarningUncheckedUpdateInput {
        return {
            status: domain.status,
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            transactionId: MapperUtils.undefinedToNull(domain.transactionId),
            receivedDate: MapperUtils.undefinedToNull(domain.receivedDate),
            createdAt: domain.createdAt,
            amount: domain.amount,
            currency: domain.currency,
            description: domain.description,
            source: domain.source,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            earningDate: domain.earningDate,
            updatedAt: new Date(),
        };
    }
}