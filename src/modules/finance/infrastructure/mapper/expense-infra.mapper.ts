import { MapperUtils } from "src/modules/shared/database";
import { ExpenseStatus, ExpenseItem, ExpenseRefType } from "../../domain/model/expense.model";
import { Expense } from "../../domain/model/expense.model";
import { ExpensePersistence } from "../persistence/expense.repository";
import { Prisma } from "@prisma/client";
import { UserInfraMapper } from "src/modules/user/infrastructure/user-infra.mapper";

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
            Number(p.amount),
            p.currency,
            p.status as ExpenseStatus,
            MapperUtils.nullToUndefined(p.description) || '',
            MapperUtils.nullToUndefined(p.referenceId),
            MapperUtils.nullToUndefined(p.referenceType as ExpenseRefType),
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.createdBy as any)
            )!,
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.submittedBy as any)
            ),
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.finalizedBy as any)
            ),
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.settledBy as any)
            ),
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.rejectedBy as any)
            ),
            MapperUtils.nullToUndefined(
                UserInfraMapper.toUserDomain(p.paidBy as any)
            )!,
            MapperUtils.nullToUndefined(p.accountId),
            MapperUtils.nullToUndefined(p.transactionRef),
            p.expenseDate,
            MapperUtils.nullToUndefined(p.submittedOn),
            MapperUtils.nullToUndefined(p.finalizedOn),
            MapperUtils.nullToUndefined(p.settledOn),
            MapperUtils.nullToUndefined(p.rejectedOn),
            expenseItems,
            MapperUtils.nullToUndefined(p.transactionRef), // txnNumber
            MapperUtils.nullToUndefined(p.remarks),
            p.isDelegated,
            p.createdAt,
            p.updatedAt,
        );
    }

    static toExpenseCreatePersistence(domain: Expense): Prisma.ExpenseCreateInput {
        // Serialize expense items to JSON string
        const itemsJson = domain.expenseItems.length > 0
            ? JSON.stringify(domain.expenseItems)
            : null;

        return {
            id: domain.id,
            title: domain.name, // Map name to title
            items: itemsJson,
            amount: domain.amount,
            currency: domain.currency,
            status: domain.status,
            description: domain.description,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            isDelegated: domain.isDelegated,
            createdBy: MapperUtils.connect(domain.requestedBy), // Map requestedBy to createdById
            paidBy: MapperUtils.connect(domain.paidBy), // Default paidById to requestedBy (can be updated later)
            finalizedBy: MapperUtils.connect(domain.finalizedBy),
            finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
            settledBy: MapperUtils.connect(domain.settledBy),
            settledOn: MapperUtils.undefinedToNull(domain.settledDate),
            rejectedBy: MapperUtils.connect(domain.rejectedBy),
            updatedBy: MapperUtils.connect(domain.requestedBy), // Default to creator
            updatedOn: domain.updatedAt,
            account: MapperUtils.connect({ id: domain.accountId }),
            transactionRef: MapperUtils.undefinedToNull(domain.transactionId ?? domain.txnNumber),
            expenseDate: domain.expenseDate,
            submittedBy: MapperUtils.connect(domain.requestedBy),
            submittedOn: domain.submittedDate,
            rejectedOn: domain.rejectedDate,
            remarks: MapperUtils.undefinedToNull(domain.remarks),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }

    static toExpenseUpdatePersistence(domain: Expense): Prisma.ExpenseUpdateInput {
        // Serialize expense items to JSON string
        const itemsJson = domain.expenseItems.length > 0
            ? JSON.stringify(domain.expenseItems)
            : null;

        return {
            title: domain.name, // Map name to title
            items: itemsJson,
            amount: domain.amount,
            currency: domain.currency,
            status: domain.status,
            description: domain.description,
            referenceId: MapperUtils.undefinedToNull(domain.referenceId),
            referenceType: MapperUtils.undefinedToNull(domain.referenceType),
            isDelegated: domain.isDelegated,
            createdBy: MapperUtils.connect(domain.requestedBy), // Map requestedBy to createdById
            paidBy: MapperUtils.connect(domain.paidBy), // Default paidById to requestedBy (can be updated later)
            finalizedBy: MapperUtils.connect(domain.finalizedBy),
            finalizedOn: MapperUtils.undefinedToNull(domain.finalizedDate),
            settledBy: MapperUtils.connect(domain.settledBy),
            settledOn: MapperUtils.undefinedToNull(domain.settledDate),
            rejectedBy: MapperUtils.connect(domain.rejectedBy),
            updatedBy: MapperUtils.connect(domain.requestedBy), // Default to creator
            updatedOn: domain.updatedAt,
            account: MapperUtils.connect({ id: domain.accountId }),
            transactionRef: MapperUtils.undefinedToNull(domain.transactionId ?? domain.txnNumber),
            expenseDate: domain.expenseDate,
            submittedBy: MapperUtils.connect(domain.requestedBy),
            submittedOn: domain.submittedDate,
            rejectedOn: domain.rejectedDate,
            remarks: MapperUtils.undefinedToNull(domain.remarks),
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt,
        };
    }

}