import { Donation, DonationStatus, DonationType, PaymentMethod, UPIPaymentType } from '../../domain/model/donation.model';
import { DonationDto } from './donation.dto';
import { Account, AccountStatus, AccountType, BankDetail, UPIDetail } from '../../domain/model/account.model';
import { AccountDetailDto, BankDetailDto, UPIDetailDto } from './account.dto';
import { Expense, ExpenseStatus, ExpenseCategory, ExpenseItem } from '../../domain/model/expense.model';
import { ExpenseDetailDto, ExpenseItemDetailDto } from './expense.dto';
import { Transaction, TransactionStatus, TransactionType, TransactionRefType } from '../../domain/model/transaction.model';
import { TransactionDetailDto } from './transaction.dto';
import { Earning, EarningStatus, EarningCategory } from '../../domain/model/earning.model';
import { EarningDetailDto } from './earning.dto';

/**
 * Donation DTO Mapper
 */
export class DonationDtoMapper {
  static toDto(donation: Donation): DonationDto {
    return {
      id: donation.id,
      type: donation.type,
      amount: donation.amount,
      currency: donation.currency,
      status: donation.status,
      donorId: donation.donorId,
      donorName: donation.donorName,
      donorEmail: donation.donorEmail,
      description: donation.description,
      raisedDate: donation.raisedDate,
      paidDate: donation.paidDate,
      transactionId: donation.transactionId,
      // Legacy fields
      isGuest: donation.isGuest,
      startDate: donation.startDate,
      endDate: donation.endDate,
      raisedOn: donation.raisedOn,
      paidOn: donation.paidOn,
      confirmedBy: donation.confirmedBy,
      confirmedOn: donation.confirmedOn,
      paymentMethod: donation.paymentMethod,
      paidToAccountId: donation.paidToAccountId,
      forEventId: donation.forEventId,
      paidUsingUPI: donation.paidUsingUPI,
      isPaymentNotified: donation.isPaymentNotified,
      transactionRef: donation.transactionRef,
      remarks: donation.remarks,
      cancelletionReason: donation.cancelletionReason,
      laterPaymentReason: donation.laterPaymentReason,
      paymentFailureDetail: donation.paymentFailureDetail,
      additionalFields: donation.additionalFields,
      createdAt: donation.createdAt,
      updatedAt: donation.updatedAt,
    };
  }

  static toDomain(dto: DonationDto): Donation {
    // This is a simplified version - in practice, you'd use factory methods
    throw new Error('Use factory methods to create domain entities');
  }
}

/**
 * Account DTO Mapper
 */
export class AccountDtoMapper {
  static toDto(account: Account): AccountDetailDto {
    return {
      id: account.id,
      accountHolderName: account.accountHolderName,
      currentBalance: account.balance,
      accountHolder: account.accountHolderId, // UserDetail reference - would need to fetch
      accountStatus: account.status,
      activatedOn: account.activatedOn,
      accountType: account.type,
      bankDetail: account.bankDetail ? this.bankDetailToDto(account.bankDetail) : undefined,
      upiDetail: account.upiDetail ? this.upiDetailToDto(account.upiDetail) : undefined,
    };
  }

  private static bankDetailToDto(bankDetail: BankDetail): BankDetailDto {
    return {
      bankAccountHolderName: bankDetail.bankAccountHolderName,
      bankName: bankDetail.bankName,
      bankBranch: bankDetail.bankBranch,
      bankAccountNumber: bankDetail.bankAccountNumber,
      bankAccountType: bankDetail.bankAccountType,
      IFSCNumber: bankDetail.IFSCNumber,
    };
  }

  private static upiDetailToDto(upiDetail: UPIDetail): UPIDetailDto {
    return {
      payeeName: upiDetail.payeeName,
      upiId: upiDetail.upiId,
      mobileNumber: upiDetail.mobileNumber,
      qrData: upiDetail.qrData,
    };
  }
}

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

/**
 * Transaction DTO Mapper
 */
export class TransactionDtoMapper {
  static toDto(transaction: Transaction): TransactionDetailDto {
    return {
      txnId: transaction.txnId,
      txnNumber: transaction.txnNumber,
      txnDate: transaction.txnDate,
      txnAmount: transaction.txnAmount,
      txnType: transaction.txnType,
      txnStatus: transaction.txnStatus,
      txnDescription: transaction.txnDescription,
      txnParticulars: transaction.txnParticulars,
      txnRefId: transaction.txnRefId,
      txnRefType: transaction.txnRefType,
      accBalance: transaction.accBalance,
      transferFrom: undefined, // Would need to fetch account
      transferTo: undefined, // Would need to fetch account
      comment: transaction.comment,
      account: undefined, // Would need to fetch account
    };
  }
}

/**
 * Earning DTO Mapper
 */
export class EarningDtoMapper {
  static toDto(earning: Earning): EarningDetailDto {
    return {
      id: earning.id,
      category: earning.category,
      amount: earning.amount,
      currency: earning.currency,
      status: earning.status,
      description: earning.description,
      source: earning.source,
      referenceId: earning.referenceId,
      referenceType: earning.referenceType,
      accountId: earning.accountId,
      transactionId: earning.transactionId,
      earningDate: earning.earningDate,
      receivedDate: earning.receivedDate,
      createdAt: earning.createdAt,
      updatedAt: earning.updatedAt,
    };
  }
}


