import { MapperUtils } from "src/modules/shared/database";
import { ExpenseCategory, ExpenseRefType, ExpenseStatus } from "../../domain/model/expense.model";
import { Expense } from "../../domain/model/expense.model";
import { ExpensePersistence } from "../persistence/expense.repository";
import { Prisma } from "@prisma/client";

export class ExpenseInfraMapper {
    // ===== EXPENSE MAPPERS =====

    static toExpenseDomain(p: ExpensePersistence): Expense | null {
        if (!p) return null;

        return new Expense(
            p.id,
            p.description ? p.description.substring(0, 50) : 'Expense', // Name fallback
            p.category as ExpenseCategory,
            Number(p.amount),
            p.currency,
            p.status as ExpenseStatus,
            p.description,
            MapperUtils.nullToUndefined(p.referenceId),
            MapperUtils.nullToUndefined(p.referenceType),
            p.requestedBy,
            MapperUtils.nullToUndefined(p.approvedBy),
            undefined, // finalizedBy
            undefined, // settledBy
            undefined, // rejectedBy
            MapperUtils.nullToUndefined(p.accountId),
            MapperUtils.nullToUndefined(p.transactionId),
            MapperUtils.nullToUndefined(p.receiptUrl),
            p.expenseDate,
            MapperUtils.nullToUndefined(p.approvedDate),
            undefined, // finalizedDate
            undefined, // settledDate
            undefined, // rejectedDate
            MapperUtils.nullToUndefined(p.paidDate),
            [], // expenseItems
            Number(p.amount), // finalAmount
            undefined, // txnNumber
            undefined, // remarks
            false, // isAdmin
            false, // isDelegated
            p.createdAt,
            p.updatedAt,
        );
    }

    static toExpenseCreatePersistence(domain: Expense): Prisma.ExpenseUncheckedCreateInput {
        return {
            id: domain.id,
            category: domain.category,
            amount: domain.amount,
            currency: domain.currency,
            status: domain.status,
            description: domain.description,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            requestedBy: domain.requestedBy,
            approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            transactionId: MapperUtils.undefinedToNull(domain.transactionId),
            receiptUrl: MapperUtils.undefinedToNull(domain.receiptUrl),
            expenseDate: domain.expenseDate,
            approvedDate: MapperUtils.undefinedToNull(domain.approvedDate),
            paidDate: MapperUtils.undefinedToNull(domain.paidDate),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }

    static toExpenseUpdatePersistence(domain: Expense): Prisma.ExpenseUncheckedUpdateInput {
        return {
            status: domain.status,
            approvedBy: MapperUtils.undefinedToNull(domain.approvedBy),
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            transactionId: MapperUtils.undefinedToNull(domain.transactionId),
            approvedDate: MapperUtils.undefinedToNull(domain.approvedDate),
            paidDate: MapperUtils.undefinedToNull(domain.paidDate),
            updatedAt: new Date(),
        };
    }

}