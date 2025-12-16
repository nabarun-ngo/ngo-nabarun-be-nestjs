import { TransactionDetailDto } from "../transaction.dto";
import { Transaction } from "../../../domain/model/transaction.model";

/**
 * Transaction DTO Mapper
 */
export class TransactionDtoMapper {
  static toDto(transaction: Transaction, accId?: string): TransactionDetailDto {
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
      accBalance: transaction.getAccountBalance(accId),
      transferFrom: undefined, // Would need to fetch account
      transferTo: undefined, // Would need to fetch account
      comment: transaction.comment,
      account: undefined, // Would need to fetch account
    };
  }
}