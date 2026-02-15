import { AccountDetailDto, BankDetailDto, UPIDetailDto, AccountType as FrontendAccountType, AccountCategory } from "../../dto/account.dto";
import { Account, BankDetail, UPIDetail, AccountType as BackendAccountType } from "../../../domain/model/account.model";

/**
 * Account DTO Mapper
 * Maps backend complex account types to simplified frontend types
 */
export class AccountDtoMapper {
  /**
   * Convert backend account type to frontend simplified type
   * Backend can have many detailed types, frontend only sees 4 simple types
   */
  private static mapBackendToFrontendType(backendType: BackendAccountType): FrontendAccountType {
    // Map all backend account types to simplified frontend types
    // This allows backend to have complex types while frontend stays simple
    switch (backendType) {
      case BackendAccountType.PRINCIPAL:
        return FrontendAccountType.PRINCIPAL;
      case BackendAccountType.DONATION:
        return FrontendAccountType.DONATION;
      case BackendAccountType.PUBLIC_DONATION:
        return FrontendAccountType.PUBLIC_DONATION;
      case BackendAccountType.WALLET:
        return FrontendAccountType.WALLET;
      // Future backend types will map to these 4 frontend types
      // Example: DONATION_INCOME, BANK_ACCOUNT, etc. can map to PRINCIPAL or DONATION
      default:
        // Default mapping for any new backend types
        return FrontendAccountType.PRINCIPAL;
    }
  }

  /**
   * Get account category for frontend display
   */
  private static getAccountCategory(backendType: BackendAccountType): AccountCategory {
    switch (backendType) {
      case BackendAccountType.PRINCIPAL:
        return AccountCategory.ORGANIZATIONAL;
      case BackendAccountType.DONATION:
      case BackendAccountType.PUBLIC_DONATION:
        return AccountCategory.OPERATIONAL;
      case BackendAccountType.WALLET:
        return AccountCategory.INDIVIDUAL;
      default:
        return AccountCategory.ORGANIZATIONAL;
    }
  }

  /**
   * Convert frontend account type to backend account type
   * Used when creating accounts from frontend
   */
  static mapFrontendToBackendType(frontendType: FrontendAccountType): BackendAccountType {
    // Simple 1:1 mapping for now
    // As backend types expand, this mapping can become more sophisticated
    switch (frontendType) {
      case FrontendAccountType.PRINCIPAL:
        return BackendAccountType.PRINCIPAL;
      case FrontendAccountType.DONATION:
        return BackendAccountType.DONATION;
      case FrontendAccountType.PUBLIC_DONATION:
        return BackendAccountType.PUBLIC_DONATION;
      case FrontendAccountType.WALLET:
        return BackendAccountType.WALLET;
      default:
        return BackendAccountType.PRINCIPAL;
    }
  }

  static toDto(account: Account, options: {
    includeBankDetail?: boolean,
    includeUpiDetail?: boolean,
    includeBalance?: boolean,
  }): AccountDetailDto {
    return {
      id: account.id,
      accountHolderName: account.accountHolderName,
      currentBalance: options.includeBalance ? account.balance : 0,
      accountHolder: account.accountHolderId, // UserDetail reference - would need to fetch
      accountStatus: account.status,
      activatedOn: account.activatedOn,
      accountType: this.mapBackendToFrontendType(account.type),
      accountCategory: this.getAccountCategory(account.type),
      name: account.name,
      description: account.description,
      bankDetail: account.bankDetail && options.includeBankDetail ? this.bankDetailToDto(account.bankDetail) : undefined,
      upiDetail: account.upiDetail && options.includeUpiDetail ? this.upiDetailToDto(account.upiDetail) : undefined,
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