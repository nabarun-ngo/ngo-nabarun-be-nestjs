import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Account, BankDetail, UPIDetail } from '../../domain/model/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AccountType, CreateAccountDto } from '../dto/account.dto';
import { type IUserRepository, USER_REPOSITORY } from 'src/modules/user/domain/repositories/user.repository.interface';
import { BusinessException } from 'src/shared/exceptions/business-exception';

export class CreateAccountRequest {
  name: string;
  type: AccountType;
  currency: string;
  initialBalance?: number;
  description?: string;
  accountHolderId: string;
}

@Injectable()
export class CreateAccountUseCase implements IUseCase<CreateAccountDto, Account> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
    @Inject(USER_REPOSITORY) private readonly userRepository: IUserRepository,
  ) { }

  async execute(request: CreateAccountDto): Promise<Account> {
    const user = await this.userRepository.findById(request.accountHolderId);
    if (!user) {
      throw new BusinessException('User not found with id ' + request.accountHolderId);
    }

    const account = Account.create({
      name: request.name,
      type: request.type,
      currency: request.currency,
      initialBalance: request.initialBalance,
      description: request.description,
      accountHolderId: request.accountHolderId,
      accountHolderName: user.fullName,
    });

    const savedAccount = await this.accountRepository.create(account);

    // Emit domain events
    for (const event of savedAccount.domainEvents) {
      this.eventEmitter.emit(event.constructor.name, event);
    }
    savedAccount.clearEvents();

    return savedAccount;
  }
}


