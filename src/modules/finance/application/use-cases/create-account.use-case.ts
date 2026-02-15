import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Account, AccountStatus, AccountType as BackendAccountType } from '../../domain/model/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAccountDto } from '../dto/account.dto';
import { AccountDtoMapper } from '../dto/mapper/account-dto.mapper';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';
import { PostToLedgerUseCase } from './post-to-ledger.use-case';
import { JournalEntryReferenceType } from '../../domain/model/journal-entry.model';
import { Role } from 'src/modules/user/domain/model/role.model';

@Injectable()
export class CreateAccountUseCase implements IUseCase<CreateAccountDto, Account> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
    private readonly postToLedgerUseCase: PostToLedgerUseCase,
  ) {}

  async execute(request: CreateAccountDto): Promise<Account> {
    // Map frontend simplified account type to backend account type
    const backendAccountType = AccountDtoMapper.mapFrontendToBackendType(request.accountType);
    
    // ORGANIZATIONAL accounts (PRINCIPAL) don't require accountHolder
    // OPERATIONAL and INDIVIDUAL accounts require accountHolder
    const isOrganizationalAccount = backendAccountType === BackendAccountType.PRINCIPAL;
    
    if (!isOrganizationalAccount && !request.accountHolderId) {
      throw new BusinessException('accountHolderId is required for this account type');
    }

    let accountHolder: string | undefined;
    let accountHolderName: string | undefined;

    if (!isOrganizationalAccount) {
      const user = await this.userRepository.findById(request.accountHolderId!);
      if (!user) {
        throw new BusinessException('User not found with id ' + request.accountHolderId);
      }
      accountHolder = request.accountHolderId;
      accountHolderName = user.fullName;

      // Validate user has required role for account type
      if (request.type === AccountType.DONATION) {
        const role = user.roles.find(role => role.roleCode === Role.CASHIER || role.roleCode === Role.ASSISTANT_CASHIER);
        if (!role) {
          throw new BusinessException('Account holder must have CASHIER or ASSISTANT_CASHIER role for DONATION accounts');
        }
      }
    } else {
      // For PRINCIPAL accounts, accountHolderId is used only for validation (treasurer role)
      // but the account itself doesn't have an accountHolder
      if (request.accountHolderId) {
        const user = await this.userRepository.findById(request.accountHolderId);
        if (!user) {
          throw new BusinessException('User not found with id ' + request.accountHolderId);
        }
        const role = user.roles.find(role => role.roleCode === Role.TREASURER);
        if (!role) {
          throw new BusinessException('Only users with TREASURER role can create PRINCIPAL accounts');
        }
      }
    }

    const existingAccount = await this.accountRepository.findAll({
      status: [AccountStatus.ACTIVE],
      type: [request.type],
      accountHolderId: accountHolder
    });
    if (existingAccount.length > 0) {
      throw new BusinessException(`An active account of this type already exists${accountHolder ? ' for this account holder' : ''}.`);
    }

    const account = Account.create({
      name: request.name,
      type: request.type,
      currency: request.currency,
      description: request.description,
      accountHolderId: accountHolder,
      accountHolderName: accountHolderName,
    });

    const savedAccount = await this.accountRepository.create(account);

    if (request?.initialBalance != null && request.initialBalance > 0 && request.createdById) {
      await this.postToLedgerUseCase.execute({
        entryDate: account.createdAt ?? new Date(),
        description: 'Initial Balance for Account',
        referenceType: JournalEntryReferenceType.INITIAL_BALANCE,
        referenceId: savedAccount.id,
        postedById: request.createdById,
        lines: [
          {
            accountId: savedAccount.id,
            debitAmount: 0,
            creditAmount: request.initialBalance,
            currency: request.currency || 'INR',
            particulars: 'Initial Balance for Account',
          },
        ],
      });
    }

    for (const event of savedAccount.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedAccount.clearEvents();

    return savedAccount;
  }
}
