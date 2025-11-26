import { Inject, Injectable } from '@nestjs/common';
import { IUseCase } from '../../../../shared/interfaces/use-case.interface';
import { Account, BankDetail, UPIDetail } from '../../domain/model/account.model';
import { ACCOUNT_REPOSITORY } from '../../domain/repositories/account.repository.interface';
import type { IAccountRepository } from '../../domain/repositories/account.repository.interface';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateAccountDto } from '../dto/account.dto';

@Injectable()
export class CreateAccountUseCase implements IUseCase<CreateAccountDto, Account> {
  constructor(
    @Inject(ACCOUNT_REPOSITORY)
    private readonly accountRepository: IAccountRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(request: CreateAccountDto): Promise<Account> {
    let bankDetail: BankDetail | undefined;
    if (request.bankDetail) {
      bankDetail = new BankDetail(
        request.bankDetail.bankAccountHolderName,
        request.bankDetail.bankName,
        request.bankDetail.bankBranch,
        request.bankDetail.bankAccountNumber,
        request.bankDetail.bankAccountType,
        request.bankDetail.IFSCNumber,
      );
    }

    let upiDetail: UPIDetail | undefined;
    if (request.upiDetail) {
      upiDetail = new UPIDetail(
        request.upiDetail.payeeName,
        request.upiDetail.upiId,
        request.upiDetail.mobileNumber,
        request.upiDetail.qrData,
      );
    }

    const account = Account.create({
      name: request.name,
      type: request.type as any,
      currency: request.currency,
      initialBalance: request.initialBalance,
      description: request.description,
      accountHolderId: request.accountHolderId,
      accountHolderName: request.name, // Use name as default
      bankDetail,
      upiDetail,
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


