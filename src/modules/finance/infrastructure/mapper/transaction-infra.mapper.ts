import { MapperUtils } from "src/modules/shared/database";
import { Prisma } from "@prisma/client";
import { TransactionPersistence } from "../persistence/transaction.repository";
import { Transaction } from "../../domain/model/transaction.model";
import { TransactionType, TransactionStatus, TransactionRefType } from "../../domain/model/transaction.model";

export class TransactionInfraMapper {

    // ===== TRANSACTION MAPPERS =====

    static toTransactionDomain(p: TransactionPersistence): Transaction | null {
        if (!p) return null;

        return new Transaction(
            p.id,
            p.type as TransactionType,
            Number(p.amount),
            p.currency,
            p.status as TransactionStatus,
            MapperUtils.nullToUndefined(p.referenceId),
            MapperUtils.nullToUndefined(p.referenceType as TransactionRefType),
            p.description,
            MapperUtils.nullToUndefined(p.metadata) as Record<string, any> | undefined,
            p.transactionDate,
            p.id,
            MapperUtils.nullToUndefined(p.particulars),
            MapperUtils.nullToUndefined(p.fromAccountId),
            MapperUtils.nullToUndefined(p.toAccountId),
            undefined,
            p.createdAt,
            p.updatedAt,
        );
    }

    static toTransactionCreatePersistence(domain: Transaction): Prisma.TransactionCreateInput {
        return {
            id: domain.id,
            type: domain.txnType,
            amount: domain.txnAmount,
            currency: domain.currency,
            status: domain.txnStatus,
            toAccount: domain.transferToAccountId ? { connect: { id: domain.transferToAccountId } } : {},
            fromAccount: domain.transferFromAccountId ? { connect: { id: domain.transferFromAccountId } } : {},
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            description: domain.description,
            metadata: domain.metadata,
            transactionDate: domain.transactionDate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
            particulars: domain.txnParticulars,
        };
    }

    static toTransactionUpdatePersistence(domain: Transaction): Prisma.TransactionUpdateInput {
        return {
            status: domain.txnStatus,
            toAccount: domain.transferToAccountId ? { connect: { id: domain.transferToAccountId } } : {},
            fromAccount: domain.transferFromAccountId ? { connect: { id: domain.transferFromAccountId } } : {},
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            description: domain.description,
            metadata: domain.metadata,
            transactionDate: domain.transactionDate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }



}