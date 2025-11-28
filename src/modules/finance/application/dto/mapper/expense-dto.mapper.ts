import { ExpenseDetailDto, ExpenseItemDetailDto } from "../expense.dto";
import { Expense, ExpenseItem } from "../../../domain/model/expense.model";

/**
 * Expense DTO Mapper
 */
export class ExpenseDtoMapper {
  static toDto(expense: Expense): ExpenseDetailDto {
    return {
      id: expense.id,
      name: expense.name,
      description: expense.description,
      expenseDate: expense.expenseDate,
      createdBy: expense.requestedBy, // UserDetail reference
      createdOn: expense.createdAt!,
      isAdmin: expense.isAdmin,
      isDeligated: expense.isDelegated,
      paidBy: expense.requestedBy, // UserDetail reference
      finalizedBy: expense.finalizedBy, // UserDetail reference
      status: expense.status,
      finalizedOn: expense.finalizedDate,
      settledBy: expense.settledBy, // UserDetail reference
      settledOn: expense.settledDate,
      expenseItems: expense.expenseItems.map(item => this.expenseItemToDto(item)),
      finalAmount: expense.finalAmount,
      expenseRefType: expense.referenceType as any,
      expenseRefId: expense.referenceId,
      txnNumber: expense.txnNumber,
      settlementAccount: undefined, // Would need to fetch account
      rejectedBy: expense.rejectedBy, // UserDetail reference
      rejectedOn: expense.rejectedDate,
      remarks: expense.remarks,
    };
  }

  private static expenseItemToDto(item: ExpenseItem): ExpenseItemDetailDto {
    return {
      id: item.id,
      itemName: item.itemName,
      description: item.description,
      amount: item.amount,
    };
  }
}