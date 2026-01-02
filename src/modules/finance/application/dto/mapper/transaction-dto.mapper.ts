import { TransactionDetailDto } from "../transaction.dto";
import { Transaction } from "../../../domain/model/transaction.model";
import { Account } from "src/modules/finance/domain/model/account.model";

/**
 * Transaction DTO Mapper
 */
export class TransactionDtoMapper {
  static toDto(transaction: Transaction, acc?: string | Account): TransactionDetailDto {
    return {
      txnId: transaction.txnId,
      txnDate: transaction.txnDate,
      txnAmount: transaction.txnAmount,
      txnType: transaction.txnType,
      txnStatus: transaction.txnStatus,
      txnDescription: transaction.txnDescription,
      txnParticulars: transaction.txnParticulars,
      txnRefId: transaction.txnRefId,
      txnRefType: transaction.txnRefType,
      accBalance: transaction.getAccountBalance(acc instanceof Account ? acc.id : acc),
      accTxnType: transaction.getTxnTypeForAccount(acc instanceof Account ? acc.id : acc),
      transferFrom: transaction.transferFromAccountId,
      transferTo: transaction.transferToAccountId,
      comment: transaction.comment,
    };
  }
}