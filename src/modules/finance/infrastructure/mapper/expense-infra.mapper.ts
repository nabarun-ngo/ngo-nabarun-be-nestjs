import { MapperUtils } from "src/modules/shared/database";
import { ExpenseCategory, ExpenseRefType, ExpenseStatus, ExpenseItem } from "../../domain/model/expense.model";
import { Expense } from "../../domain/model/expense.model";
import { ExpensePersistence } from "../persistence/expense.repository";
import { Prisma } from "@prisma/client";

export class ExpenseInfraMapper {
    // ===== EXPENSE MAPPERS =====

    static toExpenseDomain(p: ExpensePersistence): Expense | null {
        if (!p) return null;

        // Parse expense items from JSON string if present
        let expenseItems: ExpenseItem[] = [];
        if (p.items) {
            try {
                const parsed = JSON.parse(p.items);
                expenseItems = Array.isArray(parsed) ? parsed : [];
            } catch {
                // If parsing fails, treat as empty array
                expenseItems = [];
            }
        }

        return new Expense(
            p.id,
            p.title || 'Expense', // Map title to name
            p.category as ExpenseCategory,
            Number(p.amount),
            p.currency,
            p.status as ExpenseStatus,
            MapperUtils.nullToUndefined(p.description) || '',
            MapperUtils.nullToUndefined(p.referenceId),
            MapperUtils.nullToUndefined(p.referenceType),
            p.createdById, // Map createdById to requestedBy
            MapperUtils.nullToUndefined(p.paidById), // approvedBy (using paidById as proxy)
            MapperUtils.nullToUndefined(p.finalizedById),
            MapperUtils.nullToUndefined(p.settledById),
            MapperUtils.nullToUndefined(p.rejectedById),
            MapperUtils.nullToUndefined(p.accountId),
            MapperUtils.nullToUndefined(p.transactionRef),
            undefined, // receiptUrl - not in schema
            p.expenseDate,
            undefined, // approvedDate - not in schema
            MapperUtils.nullToUndefined(p.finalizedOn),
            MapperUtils.nullToUndefined(p.settledOn),
            undefined, // rejectedDate - not in schema
            undefined, // paidDate - not in schema
            expenseItems,
            Number(p.amount), // finalAmount
            MapperUtils.nullToUndefined(p.transactionRef), // txnNumber
            MapperUtils.nullToUndefined(p.remarks),
            false, // isAdmin
            p.isDelegated,
            p.createdAt,
            p.updatedAt,
        );
    }

    static toExpenseCreatePersistence(domain: Expense): Prisma.ExpenseUncheckedCreateInput {
        // Serialize expense items to JSON string
        const itemsJson = domain.expenseItems.length > 0
            ? JSON.stringify(domain.expenseItems)
            : null;

        return {
            id: domain.id,
            title: domain.name, // Map name to title
            category: domain.category,
            items: itemsJson,
            amount: domain.amount,
            currency: domain.currency,
            status: domain.status,
            description: domain.description,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            isDelegated: domain.isDelegated,
            createdById: domain.requestedBy, // Map requestedBy to createdById
            paidById: domain.requestedBy, // Default paidById to requestedBy (can be updated later)
            finalizedById: MapperUtils.undefinedToNull(domain.finalizedBy),
            finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
            settledById: MapperUtils.undefinedToNull(domain.settledBy),
            settledOn: MapperUtils.undefinedToNull(domain.settledDate),
            rejectedById: MapperUtils.undefinedToNull(domain.rejectedBy),
            updatedById: MapperUtils.undefinedToNull(domain.requestedBy), // Default to creator
            updatedOn: domain.updatedAt,
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            accountName: undefined, // Can be populated from account relation
            transactionRef: MapperUtils.undefinedToNull(domain.txnNumber),
            expenseDate: domain.expenseDate,
            expenseCreated: domain.createdAt,
            remarks: MapperUtils.undefinedToNull(domain.remarks),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }

    static toExpenseUpdatePersistence(domain: Expense): Prisma.ExpenseUncheckedUpdateInput {
        // Serialize expense items to JSON string
        const itemsJson = domain.expenseItems.length > 0
            ? JSON.stringify(domain.expenseItems)
            : null;

        return {
            title: domain.name,
            items: itemsJson,
            status: domain.status,
            description: domain.description,
            finalizedById: MapperUtils.undefinedToNull(domain.finalizedBy),
            finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
            settledById: MapperUtils.undefinedToNull(domain.settledBy),
            settledOn: MapperUtils.undefinedToNull(domain.settledDate),
            rejectedById: MapperUtils.undefinedToNull(domain.rejectedBy),
            updatedById: domain.requestedBy, // Track who updated
            updatedOn: new Date(),
            accountId: MapperUtils.undefinedToNull(domain.accountId),
            transactionRef: MapperUtils.undefinedToNull(domain.txnNumber),
            remarks: MapperUtils.undefinedToNull(domain.remarks),
            updatedAt: new Date(),
        };
    }

}