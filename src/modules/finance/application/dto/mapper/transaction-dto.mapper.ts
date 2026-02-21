import { TransactionDetailDto } from "../transaction.dto";
import { Transaction } from "../../../domain/model/transaction.model";

/**
 * Transaction DTO Mapper
 */
export class TransactionDtoMapper {
  static toDto(transaction: Transaction): TransactionDetailDto {
    return {
      txnId: transaction.id,
      txnDate: transaction.transactionDate,
      txnAmount: transaction.amount,
      txnType: transaction.type,
      txnStatus: transaction.status,
      txnDescription: transaction.description,
      txnParticulars: transaction.particulars,
      txnRefId: transaction.referenceId,
      txnRefType: transaction.referenceType,
      accBalance: transaction.balanceAfterTxn,
      accTxnType: transaction.type == 'IN' ? 'Credit' : 'Debit',
      transferFrom: transaction.refAccountId,
      transferTo: transaction.accountId,
      transactionRef: transaction.transactionRef,
    };
  }
}